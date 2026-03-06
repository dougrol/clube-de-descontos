import React, { useState, useRef } from 'react';
import { Upload, Users, CheckCircle, AlertCircle, Loader2, FileText, ChevronRight } from 'lucide-react';
import { Card, Button, SectionTitle } from '../../components/ui';
import { supabase } from '../../services/supabaseClient';
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
        
        for (const item of textContent.items as any[]) {
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
            let cpfSource = rowData.cpf || '';
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
// XLSX/CSV Parser (Standard mode)
// ============================================================
function parseSpreadsheet(arrayBuffer: ArrayBuffer, importMode: string): ImportRow[] {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length < 1) throw new Error("O arquivo parece estar vazio.");

    const firstRow = rawData[0].map((v: any) => 
        String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    );
    
    let dataStartIndex = 0;
    let headers = firstRow;
    
    const standardKeywords = ['name', 'cpf', 'nome', 'placa', 'email', 'telefone', 'associacao'];
    const isHeader = firstRow.some((cell: string) => standardKeywords.includes(cell));
    
    if (isHeader) {
        dataStartIndex = 1;
    } else {
        throw new Error("Não conseguimos detectar os cabeçalhos. Verifique se a primeira linha contém os nomes das colunas.");
    }

    const parsedData: ImportRow[] = [];
    
    for (let i = dataStartIndex; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const rowData: any = {};
        headers.forEach((header: string, index: number) => {
            if (header) rowData[header] = row[index];
        });
        
        const name = rowData.name || rowData.nome;
        const cpf = rowData.cpf;
        if (!name || !cpf) continue;

        parsedData.push({
            name,
            cpf,
            association_name: rowData.association_name || rowData.associacao || 'Geral',
            phone: rowData.phone || rowData.telefone || undefined,
            status: rowData.status || 'active',
            valid_until: rowData.valid_until || rowData.validade || undefined,
            password: rowData.password || rowData.senha || undefined
        });
    }
    
    return parsedData;
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
    const [importMode, setImportMode] = useState<'standard' | 'elevamais'>('standard');
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
        setProgress(0);

        try {
            const data = await file.arrayBuffer();
            let parsedData: ImportRow[];
            
            if (importMode === 'elevamais') {
                // PDF parsing for Eleva Mais
                if (!file.name.toLowerCase().endsWith('.pdf')) {
                    throw new Error("Para o modo Eleva Mais, envie o relatório em formato PDF.");
                }
                parsedData = await parsePdfFile(data);
            } else {
                // Standard XLSX/CSV parsing
                parsedData = parseSpreadsheet(data, importMode);
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

                } catch (chunkErr: any) {
                    console.error("Chunk Error:", chunkErr);
                    let errMsg = chunkErr.message;
                    if (chunkErr.message === 'Failed to fetch') {
                        errMsg = 'Erro de CORS ou rede. A Edge Function não foi encontrada ou falhou ao processar a requisição.';
                    }
                    chunk.forEach(c => allResults.push({ cpf: c.cpf || c.email, status: 'error', message: errMsg }));
                }

                setProgress(Math.round(((i + chunk.length) / parsedData.length) * 100));
            }

            setResults(allResults);

        } catch (err: any) {
            console.error("Import error:", err);
            setError(err.message);
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
                subtitle="Faça upload de uma planilha CSV/Excel ou PDF (Eleva Mais) para cadastrar ou atualizar membros."
            />

            <Card className="p-6 bg-obsidian-900 border-white/5 shadow-2xl">
                <div className="space-y-6">
                   
                   {/* Layout Selection */}
                   <div className="flex gap-4 mb-6 p-1 bg-obsidian-950 rounded-lg max-w-fit">
                       <button 
                           onClick={() => { setImportMode('standard'); setFile(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'standard' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           Layout Padrão (CPF)
                       </button>
                       <button 
                           onClick={() => { setImportMode('elevamais'); setFile(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'elevamais' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           Layout Eleva Mais (PDF)
                       </button>
                   </div>

                    {/* Instructions */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-theme-muted">
                        <h4 className="font-bold text-white mb-2 flex items-center">
                            <FileText size={16} className="mr-2 text-gold-500"/> Instruções e Formato
                        </h4>
                        
                        {importMode === 'standard' ? (
                            <>
                                <p className="mb-2">A planilha deve conter <strong>obrigatoriamente</strong> cabeçalhos exatos na primeira linha:</p>
                                <code className="block bg-black p-3 rounded-lg text-gold-400 font-mono text-xs overflow-x-auto whitespace-nowrap mb-3 whitespace-pre">
                                    name, cpf, association_name, phone, status, valid_until, password
                                </code>
                                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                                    <li><strong>name:</strong> Nome completo do associado</li>
                                    <li><strong>cpf:</strong> (será limpo automaticamente)</li>
                                    <li><strong>association_name:</strong> Nome do Clube/Associação (ex: Elevamais). Se não existir, será criado.</li>
                                    <li><strong>status:</strong> (Opcional) 'active', 'inactive'. Padrão: active</li>
                                    <li><strong>password:</strong> (Opcional) Padrão será os 11 dígitos do CPF</li>
                                </ul>
                            </>
                        ) : (
                            <>
                                <p className="mb-2">Faça o upload do <strong className="text-gold-500">PDF</strong> do relatório de veículos gerado pelo sistema <strong className="text-gold-500">Hinova/SGA</strong> da Eleva Mais.</p>
                                <p className="mb-3 text-xs opacity-80">O sistema vai extrair automaticamente as seguintes informações:</p>
                                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                                    <li><strong>Nome:</strong> Nome completo do associado</li>
                                    <li><strong>Placa:</strong> Placa do veículo (armazenada no cadastro)</li>
                                    <li><strong>Telefone:</strong> Contato do associado</li>
                                    <li><strong>CPF/CNPJ:</strong> Usado como <strong>Login e Senha</strong> no primeiro acesso</li>
                                    <li><strong>Data de Nascimento:</strong> Armazenada no cadastro</li>
                                </ul>
                                <p className="mt-3 text-xs text-gold-500/70">Associação: todos serão vinculados à "Eleva Mais" automaticamente.</p>
                            </>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-white/10 hover:border-gold-500/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <input 
                            type="file" 
                            accept={importMode === 'elevamais' ? '.pdf' : '.csv, .xlsx, .xls'}
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
                                    {importMode === 'elevamais' ? 'Selecione o PDF do relatório' : 'Selecione o arquivo CSV ou Excel'}
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

                </div>
            </Card>
        </div>
    );
};
