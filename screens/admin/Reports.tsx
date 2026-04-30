import React, { useEffect, useState } from 'react';
import { Card, SectionTitle } from '../../components/ui';
import { supabase } from '../../services/supabaseClient';
import { Users, FileCheck, FileX, BarChart3, Database } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

interface ReportData {
  totalAssociates: number;
  byAssociation: { name: string; count: number }[];
  completeProfile: number;
  incompleteProfile: number;
  agvFirstAccessDone: number;
  agvFirstAccessPending: number;
}

const COLORS = ['#D4AF37', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

const Reports: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    totalAssociates: 0,
    byAssociation: [],
    completeProfile: 0,
    incompleteProfile: 0,
    agvFirstAccessDone: 0,
    agvFirstAccessPending: 0
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      // Fetch total from associates (fully registered)
      const { data: associates, error: assocError } = await supabase
        .from('associates')
        .select('association, email, cpf, name, phone, status');

      if (assocError) throw assocError;

      // Group by association
      const assocMap: Record<string, number> = {};
      let complete = 0;
      let incomplete = 0;

      associates?.forEach(a => {
        // Count by association
        const assocName = a.association || 'Desconhecida';
        assocMap[assocName] = (assocMap[assocName] || 0) + 1;

        // Check if profile is complete (e.g., has email, phone, name, cpf)
        if (a.email && a.cpf && a.name && a.phone) {
          complete++;
        } else {
          incomplete++;
        }
      });

      // Fetch AGV data (imported via spreadsheet, pending registration)
      const { data: agvUsers, error: agvError } = await supabase
        .from('associados_universo_agv')
        .select('user_id, nome, placa');

      if (agvError) throw agvError;

      let agvDone = 0;
      let agvPending = 0;

      agvUsers?.forEach(u => {
        if (u.user_id) {
          agvDone++;
        } else {
          agvPending++;
        }
      });

      // Add AGV pending to association chart
      if (agvPending > 0) {
        assocMap['Universo AGV (Pendentes)'] = (assocMap['Universo AGV (Pendentes)'] || 0) + agvPending;
      }
      if (agvDone > 0) {
        assocMap['Universo AGV (Ativos)'] = (assocMap['Universo AGV (Ativos)'] || 0) + agvDone;
      }

      const byAssociation = Object.entries(assocMap).map(([name, count]) => ({ name, count }));

      // Total = registered associates + AGV pending (all people in the system)
      const totalFromAssociates = associates?.length || 0;
      const totalAgv = agvUsers?.length || 0;
      const totalAll = totalFromAssociates + totalAgv;

      setData({
        totalAssociates: totalAll,
        byAssociation,
        completeProfile: complete,
        incompleteProfile: incomplete + agvPending, // AGV pending = incomplete profile
        agvFirstAccessDone: agvDone,
        agvFirstAccessPending: agvPending
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gold-500">Gerando relatórios...</div>;
  }

  return (
    <div className="space-y-5 sm:space-y-6 animate-fade-in pb-20 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <SectionTitle title="Relatórios Gerenciais" subtitle="Estatísticas detalhadas de associados e uso do sistema" />
        <button onClick={fetchReports} className="text-gray-400 hover:text-white flex items-center text-sm shrink-0 min-h-[44px] px-4 py-2 rounded-xl hover:bg-white/5 border border-white/10">
          <Database size={18} className="mr-2" /> Atualizar Dados
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-obsidian-800 border-l-4 border-l-blue-500 p-4 overflow-hidden relative">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="text-theme-muted text-xs uppercase mb-1 leading-tight break-words font-medium">Total de Associados</p>
              <h3 className="text-2xl font-bold text-white">{data.totalAssociates}</h3>
            </div>
            <div className="p-3 bg-obsidian-900 rounded-xl text-blue-500 shrink-0">
              <Users size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-obsidian-800 border-l-4 border-l-green-500 p-4 overflow-hidden relative">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="text-theme-muted text-xs uppercase mb-1 leading-tight break-words font-medium">Cadastros Completos</p>
              <h3 className="text-2xl font-bold text-white">{data.completeProfile}</h3>
            </div>
            <div className="p-3 bg-obsidian-900 rounded-xl text-green-500 shrink-0">
              <FileCheck size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-obsidian-800 border-l-4 border-l-red-500 p-4 overflow-hidden relative">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="text-theme-muted text-xs uppercase mb-1 leading-tight break-words font-medium">Cadastros Incompletos</p>
              <h3 className="text-2xl font-bold text-white">{data.incompleteProfile}</h3>
            </div>
            <div className="p-3 bg-obsidian-900 rounded-xl text-red-500 shrink-0">
              <FileX size={20} />
            </div>
          </div>
        </Card>

        <Card className="bg-obsidian-800 border-l-4 border-l-gold-500 p-4 overflow-hidden relative">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1">
              <p className="text-theme-muted text-xs uppercase mb-1 leading-tight break-words font-medium">1º Acesso AGV</p>
              <h3 className="text-2xl font-bold text-white">{data.agvFirstAccessDone}</h3>
              <p className="text-xs text-gray-500 mt-1 break-words">Pendentes: {data.agvFirstAccessPending}</p>
            </div>
            <div className="p-3 bg-obsidian-900 rounded-xl text-gold-500 shrink-0">
              <BarChart3 size={20} />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Associados por Associação */}
        <Card className="bg-obsidian-800 border-none p-4 sm:p-5">
          <h3 className="text-base font-semibold text-white mb-4">Associados por Associação</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.byAssociation} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#666" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#D4AF37' }}
                  cursor={{ fill: '#ffffff10' }}
                />
                <Bar dataKey="count" fill="#D4AF37" radius={[0, 4, 4, 0]} barSize={20}>
                  {data.byAssociation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Universo AGV */}
        <Card className="bg-obsidian-800 border-none p-4 sm:p-5 flex flex-col">
          <h3 className="text-base font-semibold text-white mb-4">Status Integração Universo AGV</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <Pie
                  data={[
                    { name: 'Vinculados (App)', value: data.agvFirstAccessDone },
                    { name: 'Não Vinculados', value: data.agvFirstAccessPending }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#666', strokeWidth: 1 }}
                  fontSize={11}
                >
                  <Cell fill="#10B981" />
                  <Cell fill="#3F3F46" />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
