/**
 * Serviço de importação de associados Universo AGV
 *
 * Responsável por:
 * - Parsear planilhas .xlsx, .xls e .csv
 * - Mapear colunas flexivelmente (nomes variados)
 * - Normalizar nome, telefone e placa
 * - Inserir/atualizar registros no Supabase (deduplicação por placa)
 * - Retornar resumo detalhado da importação
 *
 * Este serviço é 100% isolado e NÃO modifica nenhuma lógica existente.
 */

import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';

// ============================================================
// Types
// ============================================================

export interface UniversoAgvRecord {
  nome: string;
  telefone: string | null;
  placa: string;
  telefone_normalizado: string | null;
  placa_normalizada: string;
  origem: string;
  status_cadastro: string;
  arquivo_origem: string;
  observacoes: string | null;
  updated_at: string;
}

export interface ImportSummary {
  totalLidas: number;
  importados: number;
  atualizados: number;
  duplicados: number;
  incompletos: number;
  erros: number;
  nomeArquivo: string;
  dataImportacao: string;
  detalhesErros: Array<{ linha: number; motivo: string }>;
}

// ============================================================
// Column mapping dictionaries
// ============================================================

const NOME_ALIASES = [
  'nome', 'associado', 'cliente', 'nome do associado', 'nome completo',
  'beneficiario', 'titular', 'razao social', 'beneficiário', 'razão social',
];

const TELEFONE_ALIASES = [
  'telefone', 'fone', 'celular', 'whatsapp', 'contato',
  'telefone 1', 'fone 1', 'numero', 'número',
];

const PLACA_ALIASES = [
  'placa', 'placa do veiculo', 'placa veiculo', 'veiculo', 'veículo',
  'placa do veículo', 'identificacao', 'identificação', 'placa atual',
];

// ============================================================
// Helpers
// ============================================================

/** Normalize header text for comparison (lowercase, no accents, trimmed) */
function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Try to match a header to a field using alias lists */
function matchColumn(header: string, aliases: string[]): boolean {
  const normalized = normalizeHeader(header);
  return aliases.some(alias => {
    const normalizedAlias = normalizeHeader(alias);
    return normalized === normalizedAlias;
  });
}

/** Clean nome: trim, collapse multiple spaces, reject empty */
function normalizeName(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = String(raw).trim().replace(/\s+/g, ' ');
  return cleaned.length > 0 ? cleaned : null;
}

/** Clean telefone: keep only digits */
function normalizePhone(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

/** Regex for placa antiga (ABC1234) and Mercosul (ABC1D23) */
const PLACA_REGEX = /^[A-Z]{3}\d[A-Z0-9]\d{2}$/;

/** Clean placa: uppercase, remove spaces/dashes, validate format */
function normalizePlate(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[\s\-\.]/g, '').toUpperCase();
  if (cleaned.length === 0) return null;
  // Accept even if doesn't match regex (might be non-standard)
  return cleaned;
}

function isValidPlateFormat(plate: string): boolean {
  return PLACA_REGEX.test(plate);
}

// ============================================================
// Sheet selection (multi-tab support)
// ============================================================

interface SheetScore {
  sheetName: string;
  score: number;
  nomeIdx: number;
  telefoneIdx: number;
  placaIdx: number;
}

function scoreSheet(workbook: XLSX.WorkBook, sheetName: string): SheetScore {
  const worksheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

  if (!rawData || rawData.length === 0) {
    return { sheetName, score: 0, nomeIdx: -1, telefoneIdx: -1, placaIdx: -1 };
  }

  // Check first few rows for headers
  for (let rowIdx = 0; rowIdx < Math.min(5, rawData.length); rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || !Array.isArray(row)) continue;

    let nomeIdx = -1, telefoneIdx = -1, placaIdx = -1;
    let score = 0;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellVal = String(row[colIdx] || '');
      if (cellVal.trim() === '') continue;

      if (nomeIdx === -1 && matchColumn(cellVal, NOME_ALIASES)) {
        nomeIdx = colIdx;
        score += 2; // Nome is critical
      } else if (telefoneIdx === -1 && matchColumn(cellVal, TELEFONE_ALIASES)) {
        telefoneIdx = colIdx;
        score += 1;
      } else if (placaIdx === -1 && matchColumn(cellVal, PLACA_ALIASES)) {
        placaIdx = colIdx;
        score += 2; // Placa is critical
      }
    }

    if (score > 0) {
      return { sheetName, score, nomeIdx, telefoneIdx, placaIdx };
    }
  }

  return { sheetName, score: 0, nomeIdx: -1, telefoneIdx: -1, placaIdx: -1 };
}

// ============================================================
// Main import function
// ============================================================

export async function importUniversoAgvSpreadsheet(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ImportSummary> {
  const summary: ImportSummary = {
    totalLidas: 0,
    importados: 0,
    atualizados: 0,
    duplicados: 0,
    incompletos: 0,
    erros: 0,
    nomeArquivo: file.name,
    dataImportacao: new Date().toISOString(),
    detalhesErros: [],
  };

  // 1. Read file
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  if (workbook.SheetNames.length === 0) {
    throw new Error('O arquivo não contém nenhuma aba/planilha.');
  }

  // 2. Find best sheet
  const scores = workbook.SheetNames.map(name => scoreSheet(workbook, name));
  scores.sort((a, b) => b.score - a.score);
  const bestSheet = scores[0];

  if (bestSheet.score === 0 || (bestSheet.nomeIdx === -1 && bestSheet.placaIdx === -1)) {
    throw new Error(
      'Nenhuma coluna compatível encontrada na planilha. ' +
      'O sistema procura colunas como: "Nome", "Associado", "Placa", "Telefone", "Celular", etc. ' +
      'Verifique se a planilha contém pelo menos as colunas de Nome e Placa.'
    );
  }

  // 3. Parse selected sheet
  const worksheet = workbook.Sheets[bestSheet.sheetName];
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

  // Find header row (the row that matched)
  let headerRowIdx = -1;
  for (let rowIdx = 0; rowIdx < Math.min(5, rawData.length); rowIdx++) {
    const row = rawData[rowIdx];
    if (!row || !Array.isArray(row)) continue;

    for (let colIdx = 0; colIdx < row.length; colIdx++) {
      const cellVal = String(row[colIdx] || '');
      if (matchColumn(cellVal, NOME_ALIASES) || matchColumn(cellVal, PLACA_ALIASES)) {
        headerRowIdx = rowIdx;
        break;
      }
    }
    if (headerRowIdx >= 0) break;
  }

  if (headerRowIdx === -1) {
    throw new Error('Não foi possível localizar a linha de cabeçalho na planilha.');
  }

  // Re-map columns from the actual header row
  const headerRow = rawData[headerRowIdx] as unknown[];
  let nomeIdx = -1, telefoneIdx = -1, placaIdx = -1;

  for (let colIdx = 0; colIdx < headerRow.length; colIdx++) {
    const cellVal = String(headerRow[colIdx] || '');
    if (cellVal.trim() === '') continue;

    if (nomeIdx === -1 && matchColumn(cellVal, NOME_ALIASES)) nomeIdx = colIdx;
    else if (telefoneIdx === -1 && matchColumn(cellVal, TELEFONE_ALIASES)) telefoneIdx = colIdx;
    else if (placaIdx === -1 && matchColumn(cellVal, PLACA_ALIASES)) placaIdx = colIdx;
  }

  if (nomeIdx === -1 && placaIdx === -1) {
    throw new Error(
      'A planilha não possui as colunas mínimas necessárias (Nome e Placa). ' +
      'Verifique os cabeçalhos e tente novamente.'
    );
  }

  // 4. Extract data rows
  const dataRows = rawData.slice(headerRowIdx + 1);
  summary.totalLidas = dataRows.length;

  // 5. Parse and validate each row
  const validRecords: UniversoAgvRecord[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i] as unknown[];
    if (!row || !Array.isArray(row) || row.length === 0) continue;

    const rawNome = nomeIdx >= 0 ? String(row[nomeIdx] || '') : '';
    const rawTelefone = telefoneIdx >= 0 ? String(row[telefoneIdx] || '') : '';
    const rawPlaca = placaIdx >= 0 ? String(row[placaIdx] || '') : '';

    const nome = normalizeName(rawNome);
    const telefone = normalizePhone(rawTelefone);
    const placa = normalizePlate(rawPlaca);

    // Validate: nome is required
    if (!nome) {
      summary.incompletos++;
      summary.detalhesErros.push({
        linha: headerRowIdx + i + 2, // 1-indexed + header offset
        motivo: 'Nome vazio ou inválido',
      });
      continue;
    }

    // Validate: placa is required
    if (!placa) {
      summary.incompletos++;
      summary.detalhesErros.push({
        linha: headerRowIdx + i + 2,
        motivo: `Placa vazia para "${nome}"`,
      });
      continue;
    }

    // Build observations
    const obs: string[] = [];
    if (!telefone) {
      obs.push('Telefone não informado');
    }
    if (!isValidPlateFormat(placa)) {
      obs.push(`Formato de placa não padrão: ${placa}`);
    }

    validRecords.push({
      nome,
      telefone: rawTelefone.trim() || null,
      placa: rawPlaca.trim(),
      telefone_normalizado: telefone,
      placa_normalizada: placa,
      origem: 'Universo AGV',
      status_cadastro: 'pendente',
      arquivo_origem: file.name,
      observacoes: obs.length > 0 ? obs.join('; ') : null,
      updated_at: new Date().toISOString(),
    });
  }

  if (validRecords.length === 0) {
    throw new Error(
      `Nenhum registro válido encontrado. ${summary.incompletos} linha(s) com dados incompletos.`
    );
  }

  // 6. Upsert to Supabase in chunks
  const CHUNK_SIZE = 50;
  for (let i = 0; i < validRecords.length; i += CHUNK_SIZE) {
    const chunk = validRecords.slice(i, i + CHUNK_SIZE);

    try {
      // First, check which plates already exist
      const placas = chunk.map(r => r.placa_normalizada);
      const { data: existing } = await supabase
        .from('associados_universo_agv')
        .select('placa_normalizada, nome, telefone_normalizado')
        .in('placa_normalizada', placas);

      const existingMap = new Map<string, { nome: string; telefone_normalizado: string | null }>();
      if (existing) {
        for (const row of existing) {
          existingMap.set(row.placa_normalizada, {
            nome: row.nome,
            telefone_normalizado: row.telefone_normalizado,
          });
        }
      }

      // Classify each record
      const toInsert: UniversoAgvRecord[] = [];
      const toUpdate: UniversoAgvRecord[] = [];

      for (const record of chunk) {
        const existingRecord = existingMap.get(record.placa_normalizada);

        if (existingRecord) {
          // Check if anything changed
          const nomeChanged = existingRecord.nome !== record.nome;
          const phoneChanged = existingRecord.telefone_normalizado !== record.telefone_normalizado;

          if (nomeChanged || phoneChanged) {
            const updateObs: string[] = [];
            if (nomeChanged) updateObs.push(`Nome atualizado de "${existingRecord.nome}" para "${record.nome}"`);
            if (phoneChanged) updateObs.push('Telefone atualizado');

            toUpdate.push({
              ...record,
              status_cadastro: 'atualizado',
              observacoes: updateObs.join('; '),
            });
            summary.atualizados++;
          } else {
            // Exact duplicate, skip
            summary.duplicados++;
          }
        } else {
          toInsert.push(record);
        }
      }

      // Insert new records
      if (toInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('associados_universo_agv')
          .insert(toInsert);

        if (insertError) {
          console.error('Insert error:', insertError);
          for (const rec of toInsert) {
            summary.erros++;
            summary.detalhesErros.push({
              linha: 0,
              motivo: `Erro ao inserir "${rec.nome}" (${rec.placa_normalizada}): ${insertError.message}`,
            });
          }
        } else {
          summary.importados += toInsert.length;
        }
      }

      // Update existing records
      for (const record of toUpdate) {
        const { error: updateError } = await supabase
          .from('associados_universo_agv')
          .update({
            nome: record.nome,
            telefone: record.telefone,
            telefone_normalizado: record.telefone_normalizado,
            status_cadastro: record.status_cadastro,
            observacoes: record.observacoes,
            arquivo_origem: record.arquivo_origem,
            updated_at: record.updated_at,
          })
          .eq('placa_normalizada', record.placa_normalizada);

        if (updateError) {
          console.error('Update error:', updateError);
          summary.erros++;
          summary.detalhesErros.push({
            linha: 0,
            motivo: `Erro ao atualizar "${record.nome}" (${record.placa_normalizada}): ${updateError.message}`,
          });
          summary.atualizados--; // Undo the increment
        }
      }

    } catch (chunkError) {
      console.error('Chunk processing error:', chunkError);
      summary.erros += chunk.length;
      summary.detalhesErros.push({
        linha: 0,
        motivo: `Erro ao processar lote: ${chunkError instanceof Error ? chunkError.message : 'Erro desconhecido'}`,
      });
    }

    // Report progress
    if (onProgress) {
      const percent = Math.round(((i + chunk.length) / validRecords.length) * 100);
      onProgress(Math.min(percent, 100));
    }
  }

  return summary;
}
