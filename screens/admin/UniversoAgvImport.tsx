import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Loader2, ChevronRight, AlertTriangle, Copy, XCircle } from 'lucide-react';
import { Card, Button, SectionTitle } from '../../components/ui';
import { importUniversoAgvSpreadsheet, ImportSummary } from '../../services/universoAgvImportService';

/**
 * Componente isolado para importação de associados da Associação Universo AGV.
 * Permite upload de .xlsx, .xls e .csv com mapeamento automático de colunas.
 *
 * NÃO altera nenhum componente, rota ou serviço existente do projeto.
 */
export const UniversoAgvImport: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
      setError(null);
      setProgress(0);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setSummary(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setSummary(null);
    setProgress(0);

    try {
      const result = await importUniversoAgvSpreadsheet(file, (percent) => {
        setProgress(percent);
      });
      setSummary(result);
    } catch (err: unknown) {
      console.error('Universo AGV import error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro desconhecido ao processar o arquivo.');
      }
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionTitle
        title="Importar Associados — Universo AGV"
        subtitle="Importe planilhas da Associação Universo AGV para cadastrar associados no clube de descontos."
      />

      <Card className="p-6 bg-obsidian-900 border-white/5 shadow-2xl">
        <div className="space-y-6">

          {/* Instructions */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-theme-muted">
            <h4 className="font-bold text-white mb-3 flex items-center">
              <FileSpreadsheet size={16} className="mr-2 text-gold-500" /> Instruções de Importação
            </h4>
            <p className="mb-3">
              Faça upload de uma planilha <strong className="text-gold-400">.xlsx</strong>,{' '}
              <strong className="text-gold-400">.xls</strong> ou{' '}
              <strong className="text-gold-400">.csv</strong> contendo os dados dos associados.
            </p>
            <p className="mb-2 text-xs opacity-80">O sistema identifica automaticamente as colunas. Exemplos de nomes aceitos:</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-gold-500 font-bold text-xs block mb-1">📛 Nome</span>
                <code className="text-[10px] text-gray-400 leading-relaxed">
                  nome, associado, cliente, nome completo, titular, beneficiário, razão social
                </code>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-gold-500 font-bold text-xs block mb-1">📱 Telefone</span>
                <code className="text-[10px] text-gray-400 leading-relaxed">
                  telefone, fone, celular, whatsapp, contato, número
                </code>
              </div>
              <div className="bg-black/30 rounded-lg p-3">
                <span className="text-gold-500 font-bold text-xs block mb-1">🚗 Placa</span>
                <code className="text-[10px] text-gray-400 leading-relaxed">
                  placa, placa do veículo, veículo, identificação, placa atual
                </code>
              </div>
            </div>
            <p className="mt-3 text-xs text-gold-500/60">
              Se a planilha tiver várias abas, o sistema escolhe a aba com maior compatibilidade automaticamente.
            </p>
          </div>

          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-white/10 hover:border-gold-500/50 transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer"
            onClick={() => !isProcessing && !file && fileInputRef.current?.click()}
          >
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
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
                <p className="text-white font-medium mb-1">Selecione a planilha Universo AGV</p>
                <p className="text-gray-400 text-xs">Formatos aceitos: .xlsx, .xls, .csv</p>
              </div>
            )}

            <div className="flex gap-4">
              {!file && (
                <Button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  variant="outline"
                  className="border-white/20 hover:border-gold-500 bg-transparent text-white"
                >
                  Selecionar Arquivo
                </Button>
              )}
              {file && !isProcessing && !summary && (
                <>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleClearFile(); }}
                    variant="ghost"
                    className="text-gray-400"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); handleImport(); }}
                    className="bg-gold-500 text-black shadow-lg shadow-gold-500/20 font-bold"
                  >
                    INICIAR IMPORTAÇÃO <ChevronRight size={18} className="ml-1" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="bg-obsidian-800 rounded-xl p-5 border border-white/5">
              <div className="flex justify-between text-sm text-theme-muted mb-2 font-medium">
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-gold-500" /> Importando Associados Universo AGV...
                </span>
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

          {/* Global Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm flex-1">{error}</p>
            </div>
          )}

          {/* Import Summary */}
          {summary && !isProcessing && (
            <div className="space-y-4 pt-4 border-t border-white/10">
              <h4 className="font-bold text-white text-lg">Resumo da Importação</h4>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <SummaryCard
                  icon={<FileSpreadsheet size={22} />}
                  value={summary.totalLidas}
                  label="Linhas Lidas"
                  color="blue"
                />
                <SummaryCard
                  icon={<CheckCircle size={22} />}
                  value={summary.importados}
                  label="Importados"
                  color="green"
                />
                <SummaryCard
                  icon={<Copy size={22} />}
                  value={summary.duplicados + summary.atualizados}
                  label={`Duplicados${summary.atualizados > 0 ? ` (${summary.atualizados} atual.)` : ''}`}
                  color="yellow"
                />
                <SummaryCard
                  icon={<AlertTriangle size={22} />}
                  value={summary.incompletos}
                  label="Incompletos"
                  color="orange"
                />
                <SummaryCard
                  icon={<XCircle size={22} />}
                  value={summary.erros}
                  label="Erros"
                  color="red"
                />
              </div>

              {/* File info */}
              <div className="bg-white/5 rounded-lg p-3 flex flex-wrap gap-4 text-xs text-theme-muted">
                <span>📄 <strong className="text-white">{summary.nomeArquivo}</strong></span>
                <span>📅 {new Date(summary.dataImportacao).toLocaleString('pt-BR')}</span>
              </div>

              {/* Error Details */}
              {summary.detalhesErros.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-bold text-gray-300 mb-3">Detalhes ({summary.detalhesErros.length}):</h5>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                    {summary.detalhesErros.map((err, idx) => (
                      <div key={idx} className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg flex items-start gap-3 text-sm">
                        {err.linha > 0 && (
                          <span className="font-mono text-red-400 text-xs bg-red-500/10 px-2 py-0.5 rounded shrink-0">
                            Linha {err.linha}
                          </span>
                        )}
                        <span className="text-gray-300">{err.motivo}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New import button */}
              <div className="pt-4">
                <Button
                  onClick={handleClearFile}
                  variant="outline"
                  className="border-white/20 hover:border-gold-500 bg-transparent text-white"
                >
                  Nova Importação
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

// ============================================================
// Summary Card sub-component
// ============================================================

const colorMap: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: 'text-green-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-500' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: 'text-yellow-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', icon: 'text-orange-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-500' },
};

const SummaryCard: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  color: string;
}> = ({ icon, value, label, color }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-3 flex flex-col items-center text-center`}>
      <span className={c.icon}>{icon}</span>
      <span className="text-2xl font-black text-white mt-1">{value}</span>
      <span className={`text-[10px] ${c.text} uppercase tracking-wider mt-1 font-bold leading-tight`}>{label}</span>
    </div>
  );
};
