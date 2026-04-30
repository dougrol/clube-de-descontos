import React, { useState, useRef } from 'react';
import { FileText, Import, AlertCircle, CheckCircle, Upload, Trash2, Download, ChevronRight, Loader2, Users } from 'lucide-react';
import { Card, Button, SectionTitle } from '../../components/ui';
import { supabase } from '../../services/supabaseClient';
import { importUniversoAgvSpreadsheet, ImportSummary as AgvImportSummary } from '../../services/universoAgvImportService';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure pdf.js worker from local node_modules (avoids CDN fetch issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ImportRow {
  name: string;
  cpf?: string;
  email?: string;
  placa?: string;
  phone?: string;
  association_name: string;
  status: string;
  valid_until?: string;
  password?: string;
  birth_date?: string;
}

interface ImportResult {
  cpf?: string;
  email?: string;
  status: 'success' | 'error';
  message?: string;
  member_name?: string;
}

// ============================================================
// PDF PARSER - Eleva Mais "Relatório de Veículos"
// ============================================================
// The PDF has fixed x-position columns:
//   x~21:  Nome
//   x~196: Placa
//   x~240: Data Contrato
//   x~295: Telefone
//   x~356: Telefone Comercial
//   x~431: CPF / CNPJ
//   x~484: Data Nascimento
// ============================================================

interface PdfTextItem {
    x: number;
    y: number;
    text: string;
}

function classifyColumn(x: number): string | null {
    if (x < 190) return 'nome';
    if (x < 235) return 'placa';
    if (x < 280) return 'data_contrato';
    if (x < 350) return 'telefone';
    if (x < 425) return 'telefone_comercial';
    if (x < 478) return 'cpf';
    return 'birth_date';
}

async function parsePdfFile(arrayBuffer: ArrayBuffer): Promise<ImportRow[]> {
    const data = new Uint8Array(arrayBuffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const doc = await loadingTask.promise;
    
    const allRows: ImportRow[] = [];
    
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        const page = await doc.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Group text items by Y position (each row in the table)
        const rowsByY: Record<number, PdfTextItem[]> = {};
        
        for (const item of textContent.items as Array<{str: string, transform: number[]}>) {
            if (!item.str || !item.str.trim()) continue;
            const y = Math.round(item.transform[5]);
            const x = Math.round(item.transform[4]);
            if (!rowsByY[y]) rowsByY[y] = [];
            rowsByY[y].push({ x, y, text: item.str.trim() });
        }
        
        // Sort by Y descending (top of page first)
        const sortedYs = Object.keys(rowsByY).map(Number).sort((a, b) => b - a);
        
        for (const y of sortedYs) {
            const cells = rowsByY[y].sort((a, b) => a.x - b.x);
            
            // Build row data from column positions
            const rowData: Record<string, string> = {};
            for (const cell of cells) {
                const col = classifyColumn(cell.x);
                if (col) {
                    // Concatenate text in same column (some names might be split)
                    rowData[col] = rowData[col] ? rowData[col] + cell.text : cell.text;
                }
            }
            
            // Skip header rows, footer rows, and empty rows
            const lowerNome = (rowData.nome || '').toLowerCase();
            const lowerCpf = (rowData.cpf || '').toLowerCase();
            
            // If completely empty, skip
            if (!rowData.nome && !rowData.cpf) continue;
            
            // Skip clear header/footer signatures
            if (lowerNome.includes('nome') && lowerCpf.includes('cpf')) continue;
            if (lowerNome.includes('total') || lowerNome.includes('sga') || lowerNome.includes('hinova') || lowerNome.includes('http')) continue;
            
            // Extract numbers from whatever looks like the CPF column or other columns if misplaced
            const cpfSource = rowData.cpf || '';
            // If the PDF merged CPF with another field, let's try to extract any 11 or 14 digit sequence
            let cpfClean = cpfSource.replace(/\D/g, '');
            
            // If not found in CPF column, search the entire text of the row for a CPF/CNPJ pattern
            if (cpfClean.length !== 11 && cpfClean.length !== 14) {
               const fullRowText = Object.values(rowData).join(' ').replace(/\D/g, '');
               const match11 = fullRowText.match(/(\d{11})/);
               const match14 = fullRowText.match(/(\d{14})/);
               
               if (match14) cpfClean = match14[1];
               else if (match11) cpfClean = match11[1];
            }
            
            // Required: we must have a valid CPF/CNPJ to use as password and login
            if (cpfClean.length !== 11 && cpfClean.length !== 14) {
                console.warn("Skipping row due to invalid/missing CPF:", rowData);
                continue;
            }
            
            // Set a fallback name if empty
            const finalName = rowData.nome ? rowData.nome.trim() : `Associado ${cpfClean}`;
            
            // Clean phone
            let phone = rowData.telefone || '';
            if (phone === '()' || phone.replace(/\D/g, '').length < 8) phone = '';
            
            // Parse birth_date to YYYY-MM-DD if present
            let birthDate: string | undefined;
            if (rowData.birth_date) {
                const parts = rowData.birth_date.split('/');
                if (parts.length === 3) {
                    birthDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            }
            
            allRows.push({
                name: finalName,
                cpf: cpfClean,
                placa: rowData.placa?.trim() || undefined,
                phone: phone || undefined,
                birth_date: birthDate,
                association_name: 'Eleva Mais',
                status: 'active'
            });
        }
    }
    
    return allRows;
}

// ============================================================
// XLSX/CSV Parser — Intelligent / Any Format
// ============================================================

// Fuzzy mappings: field -> list of possible header keywords
const FIELD_KEYWORDS: Record<string, string[]> = {
    name: ['nome','name','nome completo','nome do associado','associado','razao social','razao','titular','cliente','nome/razao','beneficiario','nome do titular','responsavel'],
    cpf: ['cpf','cpf/cnpj','cpf_cnpj','cnpj','documento','doc','nr documento','num documento','numero documento','cpf / cnpj','cpf cnpj','inscricao'],
    matricula: ['matricula','matrícula','registro','cod associado','codigo associado','id associado'],
    phone: ['telefone','tel','celular','phone','fone','contato','whatsapp','tel celular','tel residencial','telefone celular','tel.','cel','cel.','numero celular'],
    email: ['email','e-mail','correio','mail','e mail','endereco eletronico'],
    placa: ['placa','placa do veiculo','placa veiculo','plate','veiculo placa'],
    association_name: ['associacao','associação','association','clube','parceiro','empresa','convenio','grupo','entidade','association_name','instituicao','instituição'],
    status: ['status','situacao','situação','ativo','active','sit','sit.'],
    valid_until: ['validade','valid_until','vencimento','data vencimento','vigencia','vigência','dt vencimento','expiracao'],
    birth_date: ['data nascimento','nascimento','data de nascimento','birth_date','dt nascimento','dt nasc','nasc','aniversario','data nasc'],
    password: ['senha','password','pass'],
};

function normalize(str: string): string {
    return String(str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9 /]/g, '').trim();
}

function matchField(header: string): string | null {
    const norm = normalize(header);
    if (!norm) return null;
    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
        for (const kw of keywords) {
            if (norm === kw || norm.includes(kw) || kw.includes(norm)) return field;
        }
    }
    return null;
}

// Detect CPF column by data pattern (11 or 14 digits after removing non-digits)
function looksLikeCPF(val: string): boolean {
    const digits = String(val).replace(/\D/g, '');
    return digits.length === 11 || digits.length === 14;
}
function looksLikePhone(val: string): boolean {
    const digits = String(val).replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 13;
}
function looksLikeEmail(val: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(val).trim());
}

function parseSpreadsheet(arrayBuffer: ArrayBuffer, _importMode: string, associationOverride?: string): ImportRow[] {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });
    
    if (rawData.length < 2) throw new Error("O arquivo parece estar vazio ou com dados insuficientes.");

    // --- Step 1: Find the header row (scan first 10 rows) ---
    let headerRowIndex = -1;
    let columnMap: Record<string, number> = {};
    
    const scanLimit = Math.min(rawData.length, 10);
    for (let r = 0; r < scanLimit; r++) {
        const row = rawData[r];
        if (!row || !Array.isArray(row) || row.length < 2) continue;
        
        const tempMap: Record<string, number> = {};
        let matchCount = 0;
        
        for (let c = 0; c < row.length; c++) {
            const cellStr = String(row[c] || '');
            const field = matchField(cellStr);
            if (field && !tempMap[field]) {
                tempMap[field] = c;
                matchCount++;
            }
        }
        
        // Accept this row as header if we matched at least 2 fields
        if (matchCount >= 2 && matchCount > Object.keys(columnMap).length) {
            headerRowIndex = r;
            columnMap = { ...tempMap };
        }
    }

    // --- Step 2: If no header found, try pattern-based detection on data ---
    let dataStartIndex = 0;
    
    if (headerRowIndex >= 0) {
        dataStartIndex = headerRowIndex + 1;
    } else {
        // No headers detected — try to infer columns from data patterns
        const sampleRow = rawData.find((row, idx) => idx < 5 && Array.isArray(row) && row.length >= 2) as unknown[];
        if (!sampleRow) throw new Error("Não foi possível detectar dados válidos no arquivo.");
        
        for (let c = 0; c < sampleRow.length; c++) {
            const val = String(sampleRow[c] || '');
            if (!val.trim()) continue;
            if (!columnMap.cpf && looksLikeCPF(val)) { columnMap.cpf = c; continue; }
            if (!columnMap.phone && looksLikePhone(val)) { columnMap.phone = c; continue; }
            if (!columnMap.email && looksLikeEmail(val)) { columnMap.email = c; continue; }
        }
        // Assume first text column is name
        for (let c = 0; c < sampleRow.length; c++) {
            const val = String(sampleRow[c] || '').trim();
            if (val && !Object.values(columnMap).includes(c) && isNaN(Number(val.replace(/\D/g,'').slice(0,3)))) {
                columnMap.name = c;
                break;
            }
        }
        dataStartIndex = 0;
        console.log('Auto-detected columns by pattern:', columnMap);
    }

    // Check if we have at least name column
    if (!columnMap.name && !columnMap.cpf && !columnMap.matricula) {
        throw new Error("Não foi possível identificar colunas de Nome, CPF ou Matrícula. Verifique o formato do arquivo.");
    }

    // If no CPF column, use Matricula as fallback identifier
    const useMatriculaAsCpf = !columnMap.cpf && columnMap.matricula !== undefined;
    if (useMatriculaAsCpf) {
        console.log('CPF column not found — using Matricula as identifier (padded to 11 digits)');
    }

    // --- Step 3: Parse rows with deduplication ---
    const seenIds = new Map<string, ImportRow>();
    const assocName = associationOverride || 'Geral';
    
    for (let i = dataStartIndex; i < rawData.length; i++) {
        const row = rawData[i] as unknown[];
        if (!row || !Array.isArray(row) || row.length < 2) continue;

        const getValue = (field: string): string => {
            const colIdx = columnMap[field];
            if (colIdx === undefined) return '';
            return String(row[colIdx] || '').trim();
        };

        const name = getValue('name');
        let cpf = getValue('cpf');
        
        // If no CPF column, derive from matricula
        if (!cpf && useMatriculaAsCpf) {
            const mat = getValue('matricula').replace(/\D/g, '');
            if (mat) cpf = mat.padStart(11, '0');
        }
        
        // Clean CPF
        if (cpf) cpf = cpf.replace(/\D/g, '');
        
        // Skip if no useful data
        if (!name && !cpf) continue;
        // If CPF exists, pad to at least 11 digits if shorter
        if (cpf && cpf.length < 11) cpf = cpf.padStart(11, '0');
        // Skip if CPF is clearly invalid (too long)
        if (cpf && cpf.length !== 11 && cpf.length !== 14) continue;
        // If we have CPF but no name, use a placeholder
        const finalName = name || `Associado ${cpf}`;
        // If we have name but no CPF, skip (required by Edge Function)
        if (!cpf) continue;

        // Map status values to system format
        const rawStatus = getValue('status').toLowerCase();
        const mappedStatus = rawStatus.includes('ativo') ? 'active' 
            : rawStatus.includes('cancel') ? 'inactive'
            : rawStatus.includes('inativo') ? 'inactive'
            : rawStatus || 'active';

        // Deduplication: same person (by CPF) may appear multiple times (one per vehicle)
        // Keep first entry, merge phone if missing
        const dedupeKey = cpf;
        if (seenIds.has(dedupeKey)) {
            const existing = seenIds.get(dedupeKey)!;
            // Merge phone if first was empty
            if (!existing.phone && getValue('phone')) {
                existing.phone = getValue('phone');
            }
            continue;
        }

        const entry: ImportRow = {
            name: finalName,
            cpf,
            email: getValue('email') || undefined,
            phone: getValue('phone') || undefined,
            placa: getValue('placa') || undefined,
            association_name: getValue('association_name') || assocName,
            status: mappedStatus,
            valid_until: getValue('valid_until') || undefined,
            birth_date: getValue('birth_date') || undefined,
            password: getValue('password') || undefined,
        };
        
        seenIds.set(dedupeKey, entry);
    }
    
    return Array.from(seenIds.values());
}

// ============================================================
// Component
// ============================================================
export const AdminImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importMode, setImportMode] = useState<'standard' | 'elevamais' | 'agv'>('agv');
    const [associationName, setAssociationName] = useState('');
    const [agvSummary, setAgvSummary] = useState<AgvImportSummary | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResults([]);
            setError(null);
            setProgress(0);
        }
    };

    const processFile = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setResults([]);
        setAgvSummary(null);
        setProgress(0);

        try {
            // AGV mode: use dedicated service (no auth user, placa-based)
            if (importMode === 'agv') {
                const summary = await importUniversoAgvSpreadsheet(file, (percent) => {
                    setProgress(percent);
                });
                setAgvSummary(summary);
                setIsProcessing(false);
                if(fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            // Standard & Eleva Mais: read file as ArrayBuffer
            const data = await file.arrayBuffer();
            let parsedData: ImportRow[];
            
            if (importMode === 'elevamais') {
                // PDF parsing for Eleva Mais
                if (!file.name.toLowerCase().endsWith('.pdf')) {
                    throw new Error("Para o modo Eleva Mais, envie o relatório em formato PDF.");
                }
                parsedData = await parsePdfFile(data);
            } else {
                // Standard XLSX/CSV parsing — smart detection
                parsedData = parseSpreadsheet(data, importMode, associationName.trim() || undefined);
            }

            if (parsedData.length === 0) throw new Error("Nenhum dado válido encontrado para importar.");

            const chunkSize = 50;
            let allResults: ImportResult[] = [];
            
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) throw new Error("Sessão administrativa expirada ou inválida.");

            const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import_member`;

            for (let i = 0; i < parsedData.length; i += chunkSize) {
                const chunk = parsedData.slice(i, i + chunkSize);
                
                try {
                    const response = await fetch(functionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify(chunk)
                    });

                    const resData = await response.json();
                    
                    if(!response.ok) {
                         throw new Error(resData.global_error || resData.error || resData.message || JSON.stringify(resData) || "Erro desconhecido na chamada da API.");
                    }

                    if(resData.results) {
                        allResults = [...allResults, ...resData.results];
                    }

                } catch (chunkErr: unknown) {
                    console.error("Chunk Error:", chunkErr);
                    let errMsg = 'Erro desconhecido';
                    if (chunkErr instanceof Error) {
                        errMsg = chunkErr.message;
                        if (chunkErr.message === 'Failed to fetch') {
                            errMsg = 'Erro de CORS ou rede. A Edge Function não foi encontrada ou falhou ao processar a requisição.';
                        }
                    } else if (typeof chunkErr === 'string') {
                        errMsg = chunkErr;
                    }
                    chunk.forEach(c => allResults.push({ cpf: c.cpf || c.email, status: 'error', message: errMsg }));
                }

                setProgress(Math.round(((i + chunk.length) / parsedData.length) * 100));
            }

            setResults(allResults);

        } catch (err: unknown) {
            console.error("Import error:", err);
            let errMsg = 'Erro desconhecido';
            if (err instanceof Error) errMsg = err.message;
            else if (typeof err === 'string') errMsg = err;
            setError(errMsg);
        } finally {
            setIsProcessing(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    return (
        <div className="space-y-6 animate-fade-in">
            <SectionTitle 
                title="Importar Associados" 
                subtitle="Envie qualquer planilha ou PDF com dados de associados. O sistema detecta automaticamente as colunas."
            />

            <Card className="p-6 bg-obsidian-900 border-white/5 shadow-2xl">
                <div className="space-y-6">
                   
                   {/* Layout Selection */}
                   <div className="flex flex-wrap gap-2 mb-6 p-1 bg-obsidian-950 rounded-lg max-w-fit">
                       <button 
                           onClick={() => { setImportMode('agv'); setFile(null); setAgvSummary(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'agv' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           🚗 Universo AGV (Placa)
                       </button>
                       <button 
                           onClick={() => { setImportMode('standard'); setFile(null); setAgvSummary(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'standard' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           Layout Padrão (CPF)
                       </button>
                       <button 
                           onClick={() => { setImportMode('elevamais'); setFile(null); setAgvSummary(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'elevamais' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           Eleva Mais (PDF)
                       </button>
                   </div>

                    {/* Instructions */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-theme-muted">
                        <h4 className="font-bold text-white mb-2 flex items-center">
                            <FileText size={16} className="mr-2 text-gold-500"/> Instruções e Formato
                        </h4>
                        
                        {importMode === 'agv' ? (
                            <>
                                <p className="mb-2">Envie a planilha do sistema <strong className="text-gold-500">Hinova/SGA</strong> (Universo AGV).</p>
                                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                                    <li><strong>Associado:</strong> Nome do associado</li>
                                    <li><strong>Placa:</strong> Placa do veículo (usado para login inicial)</li>
                                    <li><strong>Fone 1/2:</strong> Telefone de contato</li>
                                    <li><strong>Instituição:</strong> Universo AGV</li>
                                </ul>
                                <p className="mt-2 text-xs text-gold-500/70">💡 <strong>Sem CPF?</strong> Sem problema! O associado fará o cadastro completo (CPF, email, senha) pelo "Primeiro Acesso" usando a placa.</p>
                            </>
                        ) : importMode === 'standard' ? (
                            <>
                                <p className="mb-2">Envie <strong className="text-gold-500">qualquer planilha</strong> (CSV, Excel) com dados de associados. O sistema detecta automaticamente colunas como:</p>
                                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                                    <li><strong>Nome:</strong> Nome, Nome Completo, Associado, Titular, Cliente...</li>
                                    <li><strong>CPF:</strong> CPF, CPF/CNPJ, Documento, Doc...</li>
                                    <li><strong>Telefone:</strong> Telefone, Celular, Contato, WhatsApp...</li>
                                    <li><strong>E-mail:</strong> Email, E-mail...</li>
                                    <li><strong>Placa:</strong> Placa, Placa do Veículo...</li>
                                </ul>
                                <p className="mt-2 text-xs text-gold-500/70">💡 O cabeçalho não precisa seguir nenhum formato exato. Nós entendemos variações em português e inglês.</p>
                            </>
                        ) : (
                            <>
                                <p className="mb-2">Faça o upload do <strong className="text-gold-500">PDF</strong> do relatório de veículos gerado pelo sistema <strong className="text-gold-500">Hinova/SGA</strong> da Eleva Mais.</p>
                                <p className="mt-3 text-xs text-gold-500/70">Associação: todos serão vinculados à "Eleva Mais" automaticamente.</p>
                            </>
                        )}
                    </div>

                    {/* Association Name (standard mode only) */}
                    {importMode === 'standard' && (
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nome da Associação (para vincular todos)</label>
                            <input
                                type="text"
                                placeholder="Ex: Eleva Mais, Ancore, Universo AGV..."
                                value={associationName}
                                onChange={(e) => setAssociationName(e.target.value)}
                                className="w-full bg-obsidian-950 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 text-sm focus:border-gold-500 focus:outline-none transition-colors"
                            />
                            <p className="text-xs text-gray-500 ml-1">Deixe vazio para usar o valor da planilha ou "Geral" como padrão.</p>
                        </div>
                    )}

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-white/10 hover:border-gold-500/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <input 
                            type="file" 
                            accept={importMode === 'elevamais' ? '.pdf' : '.csv,.xlsx,.xls,.ods,.tsv'}
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />
                        
                        <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mb-4">
                            <Upload size={32} className="text-gold-500" />
                        </div>
                        
                        {file ? (
                            <div className="mb-4">
                                <p className="text-white font-bold">{file.name}</p>
                                <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div className="mb-4">
                                <p className="text-white font-medium mb-1">
                                    {importMode === 'elevamais' ? 'Selecione o PDF do relatório' : 'Selecione a planilha (CSV, Excel)'}
                                </p>
                                <p className="text-gray-400 text-xs">Arraste ou clique abaixo</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                             {!file && (
                                <Button 
                                    onClick={() => fileInputRef.current?.click()}
                                    variant="outline"
                                    className="border-white/20 hover:border-gold-500 bg-transparent text-white"
                                >
                                    Selecionar Arquivo
                                </Button>
                             )}
                             {file && !isProcessing && progress === 0 && (
                                <>
                                  <Button 
                                      onClick={() => { setFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                                      variant="ghost"
                                      className="text-gray-400"
                                  >
                                      Cancelar
                                  </Button>
                                  <Button 
                                      onClick={processFile}
                                      className="bg-gold-500 text-black shadow-lg shadow-gold-500/20"
                                  >
                                      INICIAR IMPORTAÇÃO <ChevronRight size={18} className="ml-1" />
                                  </Button>
                                </>
                             )}
                        </div>
                    </div>

                    {/* Progress Area */}
                    {isProcessing && (
                         <div className="bg-obsidian-800 rounded-xl p-5 border border-white/5">
                             <div className="flex justify-between text-sm text-theme-muted mb-2 font-medium">
                                 <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin text-gold-500"/> Processando Membros...</span>
                                 <span>{progress}%</span>
                             </div>
                             <div className="h-2 w-full bg-black rounded-full overflow-hidden">
                                 <div 
                                     className="h-full bg-gold-500 transition-all duration-300 relative" 
                                     style={{ width: `${progress}%` }}
                                 >
                                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]" />
                                 </div>
                             </div>
                         </div>
                    )}

                    {/* Error Handling Global */}
                    {error && (
                         <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                             <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                             <p className="text-red-300 text-sm flex-1">{error}</p>
                         </div>
                    )}

                    {/* Result Summary */}
                    {results.length > 0 && !isProcessing && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                             <h4 className="font-bold text-white text-lg">Resumo da Importação</h4>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <CheckCircle size={28} className="text-green-500 mb-2"/>
                                      <span className="text-3xl font-black text-white">{successCount}</span>
                                      <span className="text-xs text-green-400 uppercase tracking-widest mt-1 font-bold">Importados</span>
                                 </div>
                                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <AlertCircle size={28} className="text-red-500 mb-2"/>
                                      <span className="text-3xl font-black text-white">{errorCount}</span>
                                      <span className="text-xs text-red-400 uppercase tracking-widest mt-1 font-bold">Com Erro</span>
                                 </div>
                             </div>

                             {/* Error Details */}
                             {errorCount > 0 && (
                                 <div className="mt-6">
                                     <h5 className="text-sm font-bold text-gray-300 mb-3">Erros Detalhados:</h5>
                                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                         {results.filter(r => r.status === 'error').map((err, idx) => (
                                              <div key={idx} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-3 text-sm">
                                                  <span className="font-mono text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded">{err.cpf || '???'}</span>
                                                  <span className="text-gray-300">{err.message}</span>
                                              </div>
                                         ))}
                                     </div>
                                 </div>
                             )}
                        </div>
                    )}

                    {/* AGV Import Summary */}
                    {agvSummary && !isProcessing && (
                        <div className="space-y-4 pt-4 border-t border-white/10">
                             <h4 className="font-bold text-white text-lg">Resumo da Importação AGV</h4>
                             
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                 <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <Users size={24} className="text-blue-400 mb-2"/>
                                      <span className="text-2xl font-black text-white">{agvSummary.totalLidas}</span>
                                      <span className="text-xs text-blue-300 uppercase tracking-widest mt-1 font-bold">Lidas</span>
                                 </div>
                                 <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <CheckCircle size={24} className="text-green-500 mb-2"/>
                                      <span className="text-2xl font-black text-white">{agvSummary.importados}</span>
                                      <span className="text-xs text-green-400 uppercase tracking-widest mt-1 font-bold">Novos</span>
                                 </div>
                                 <div className="bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <Import size={24} className="text-gold-400 mb-2"/>
                                      <span className="text-2xl font-black text-white">{agvSummary.atualizados}</span>
                                      <span className="text-xs text-gold-300 uppercase tracking-widest mt-1 font-bold">Atualizados</span>
                                 </div>
                                 <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex flex-col items-center">
                                      <AlertCircle size={24} className="text-red-500 mb-2"/>
                                      <span className="text-2xl font-black text-white">{agvSummary.erros}</span>
                                      <span className="text-xs text-red-400 uppercase tracking-widest mt-1 font-bold">Erros</span>
                                 </div>
                             </div>

                             {agvSummary.detalhesErros.length > 0 && (
                                 <div className="mt-4">
                                     <h5 className="text-sm font-bold text-gray-300 mb-3">Erros Detalhados:</h5>
                                     <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                         {agvSummary.detalhesErros.map((err, idx) => (
                                              <div key={idx} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-3 text-sm">
                                                  <span className="font-mono text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded">L{err.linha}</span>
                                                  <span className="text-gray-300">{err.motivo}</span>
                                              </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             <p className="text-xs text-gold-500/70 mt-3">
                                 💡 Os associados importados poderão acessar o sistema pelo <strong>"Primeiro Acesso AGV"</strong> digitando a placa do veículo.
                             </p>
                        </div>
                    )}

                </div>
            </Card>
        </div>
    );
};
