import React, { useState, useRef } from 'react';
import { Upload, Users, CheckCircle, AlertCircle, Loader2, FileText, ChevronRight } from 'lucide-react';
import { Card, Button, SectionTitle } from '../../components/ui';
import { supabase } from '../../services/supabaseClient';

interface CSVRow {
  name: string;
  cpf: string;
  phone?: string;
  association_name: string;
  status: string;
  valid_until?: string;
  password?: string;
}

interface ImportResult {
  cpf: string;
  status: 'success' | 'error';
  message?: string;
  member_name?: string;
}

export const AdminImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [importMode, setImportMode] = useState<'standard' | 'ancore'>('standard');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
            setResults([]);
            setError(null);
            setProgress(0);
        }
    };

    const processCSV = async () => {
        if (!file) return;

        setIsProcessing(true);
        setError(null);
        setResults([]);
        setProgress(0);

        try {
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) throw new Error("O arquivo parece estar vazio ou não possui cabeçalho.");

            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            
            let requireHeaders: string[] = [];
            
            if (importMode === 'standard') {
                requireHeaders = ['name', 'cpf', 'association_name'];
            } else if (importMode === 'ancore') {
                requireHeaders = ['nome', 'telefone', 'placa', 'email'];
            }
            
            const missing = requireHeaders.filter(h => !headers.includes(h));
            
            if (missing.length > 0) {
               throw new Error(`Colunas obrigatórias ausentes para o modo selecionado: ${missing.join(', ')}`);
            }

            const parsedData: any[] = [];
            
            for (let i = 1; i < lines.length; i++) {
                const currentline = lines[i].split(',').map(v => v.trim());
                if (currentline.length !== headers.length) continue; 

                const row: any = {};
                headers.forEach((header, index) => {
                    row[header] = currentline[index];
                });
                
                if (importMode === 'standard') {
                    parsedData.push({
                        name: row.name,
                        cpf: row.cpf,
                        association_name: row.association_name,
                        phone: row.phone || row.telefone || undefined,
                        status: row.status || 'active',
                        valid_until: row.valid_until || row.validade || undefined,
                        password: row.password || row.senha || undefined
                    });
                } else if (importMode === 'ancore') {
                    parsedData.push({
                        name: row.nome,
                        email: row.email,
                        placa: row.placa,
                        phone: row.telefone,
                        association_name: 'Ancore',
                        status: 'active'
                    });
                }
            }

            if (parsedData.length === 0) throw new Error("Nenhum dado válido encontrado para importar.");

            const chunkSize = 50;
            let allResults: ImportResult[] = [];
            
            const { data: { session } } = await supabase.auth.getSession();
            if(!session) throw new Error("Sessão administrativa expirada ou inválida.");

            const functionUrl = importMode === 'standard' 
              ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import_member`
              : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import_ancore_member`;

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
                         throw new Error(resData.global_error || resData.error || "Erro desconhecido na importação do lote.");
                    }

                    if(resData.results) {
                        allResults = [...allResults, ...resData.results];
                    }

                } catch (chunkErr: any) {
                    console.error("Chunk Error:", chunkErr);
                    chunk.forEach(c => allResults.push({ cpf: c.cpf || c.email, status: 'error', message: chunkErr.message }));
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
                subtitle="Faça upload de uma planilha CSV para cadastrar ou atualizar membros das Associações."
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
                           onClick={() => { setImportMode('ancore'); setFile(null); }}
                           className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${importMode === 'ancore' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
                       >
                           Layout Ancore (Placa)
                       </button>
                   </div>

                    {/* Instructions */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-theme-muted">
                        <h4 className="font-bold text-white mb-2 flex items-center">
                            <FileText size={16} className="mr-2 text-gold-500"/> Instruções e Formato do CSV
                        </h4>
                        
                        {importMode === 'standard' ? (
                            <>
                                <p className="mb-2">A planilha deve conter **obrigatoriamente** cabeçalhos exatos na primeira linha:</p>
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
                                <p className="mb-2">A planilha para membros <strong className="text-gold-500">Ancore</strong> precisa destes exatos cabeçalhos:</p>
                                <code className="block bg-black p-3 rounded-lg text-gold-400 font-mono text-xs overflow-x-auto whitespace-nowrap mb-3 whitespace-pre">
                                    nome, telefone, placa, email
                                </code>
                                <ul className="list-disc pl-5 space-y-1 text-xs opacity-80">
                                    <li><strong>nome:</strong> Nome completo do associado</li>
                                    <li><strong>email:</strong> Será usado para vincular a conta do associado</li>
                                    <li><strong>placa:</strong> Será usada como senha no Primeiro Acesso.</li>
                                    <li><strong>telefone:</strong> Contato do associado</li>
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Upload Area */}
                    <div className="border-2 border-dashed border-white/10 hover:border-gold-500/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center">
                        <input 
                            type="file" 
                            accept=".csv" 
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
                                <p className="text-white font-medium mb-1">Selecione o arquivo CSV</p>
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
                                      onClick={processCSV}
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
