import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SectionTitle, Card } from '../components/ui';
import Modal from '../components/ui/Modal';
import { Users, DollarSign, Award, ArrowUpRight, CheckCircle, Clock, Save, Pencil, Trash2, Slash, XCircle, Type, Layout } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Partner, PartnerCategory } from '../types';
import { useCMS, SiteContent } from '../contexts/CMSContext';

interface ChartData {
  name: string;
  users: number;
}

interface ExtendedPartner extends Partner {
  status?: 'active' | 'pending' | 'suspended';
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; trend?: string }> = ({ title, value, icon, trend }) => (
  <Card className="bg-obsidian-800 border-l-4 border-l-gold-500">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-xs uppercase mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-white">{value}</h3>
        {trend && <p className="text-green-500 text-xs flex items-center mt-1"><ArrowUpRight size={12} /> {trend}</p>}
      </div>
      <div className="p-2 bg-obsidian-900 rounded-lg text-gold-500">
        {icon}
      </div>
    </div>
  </Card>
);

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content'>('dashboard');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activePartnersCount, setActivePartnersCount] = useState<number>(0);
  const [partners, setPartners] = useState<ExtendedPartner[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // CMS State
  const { rawContent, updateContent, refreshContent } = useCMS();
  const [editableContent, setEditableContent] = useState<SiteContent[]>([]);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ExtendedPartner | null>(null);
  const [formData, setFormData] = useState<Partial<ExtendedPartner>>({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Sync editable content when rawContent loads
    setEditableContent(rawContent);
  }, [rawContent]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total Users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(userCount || 0);

      // 2. Active Partners Count
      const { count: partnerCount } = await supabase
        .from('partners')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      setActivePartnersCount(partnerCount || 0);

      // 3. All Partners for List
      const { data: partnersData } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersData) {
        setPartners(partnersData as ExtendedPartner[]);
      }

      // 4. Chart Data
      const { data: usersData } = await supabase
        .from('users')
        .select('created_at')
        .not('created_at', 'is', null);

      if (usersData) {
        const months: { [key: string]: number } = {};
        const now = new Date();

        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleString('pt-BR', { month: 'short' });
          months[key] = 0;
        }

        usersData.forEach(u => {
          const d = new Date(u.created_at);
          const key = d.toLocaleString('pt-BR', { month: 'short' });
          if (months[key] !== undefined) {
            months[key]++;
          }
        });

        const formattedChartData = Object.keys(months).map(key => ({
          name: key.charAt(0).toUpperCase() + key.slice(1),
          users: months[key]
        }));
        setChartData(formattedChartData);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Partner Logic ---
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p));
      if (newStatus === 'active') setActivePartnersCount(prev => prev + 1);
      if (newStatus === 'suspended' || newStatus === 'pending') fetchDashboardData();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Erro ao atualizar status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este parceiro?')) return;
    try {
      const { error } = await supabase.from('partners').delete().eq('id', id);
      if (error) throw error;
      setPartners(prev => prev.filter(p => p.id !== id));
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting partner:', error);
      alert('Erro ao excluir parceiro.');
    }
  };

  const handleEdit = (partner: ExtendedPartner) => {
    setEditingPartner(partner);
    setFormData(partner);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner || !formData) return;
    try {
      const { error } = await supabase.from('partners').update(formData).eq('id', editingPartner.id);
      if (error) throw error;
      setIsModalOpen(false);
      setEditingPartner(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating partner:', error);
      alert('Erro ao salvar alterações.');
    }
  };

  // --- CMS Logic ---
  const handleContentChange = (key: string, value: string) => {
    setEditableContent(prev => prev.map(item => item.key === key ? { ...item, value } : item));
  };

  const saveContent = async (key: string, value: string) => {
    await updateContent(key, value);
    alert('Conteúdo salvo com sucesso!'); // Feedback simples
  };

  // --- Helpers ---
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'suspended': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'active': return <CheckCircle size={16} />;
      case 'suspended': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  return (
    <div className="p-5 pb-24 min-h-screen bg-black animate-fade-in space-y-8">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Painel Gestor</h1>
          <p className="text-gray-400 text-sm">Visão geral do negócio</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-obsidian-900 rounded-lg p-1 border border-obsidian-700 self-start md:self-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Layout size={16} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Type size={16} /> Site Content
          </button>
        </div>
      </header>

      {activeTab === 'dashboard' ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              title="Total Usuários"
              value={totalUsers.toString()}
              icon={<Users size={20} />}
              trend="+--% este mês"
            />
            <StatCard
              title="Receita Estimada"
              value={`R$ ${(totalUsers * 49.90).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              icon={<DollarSign size={20} />}
              trend="Baseado no plano Basic"
            />
            <StatCard
              title="Parceiros Ativos"
              value={activePartnersCount.toString()}
              icon={<Award size={20} />}
            />
          </div>

          {/* Subscription Growth Chart */}
          <section className="h-64 w-full bg-obsidian-800 rounded-xl p-4 border border-obsidian-700">
            <SectionTitle title="Crescimento de Assinantes (Últimos 6 meses)" />
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.length > 0 ? chartData : [{ name: 'Sem dados', users: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#D4AF37' }}
                  cursor={{ fill: '#ffffff10' }}
                />
                <Bar dataKey="users" fill="#D4AF37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>

          {/* Partner Monitoring List */}
          <section>
            <SectionTitle title="Monitoramento de Parceiros" />
            <Card className="bg-obsidian-800 border-none overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-obsidian-900 uppercase font-medium">
                    <tr>
                      <th className="p-3">Parceiro</th>
                      <th className="p-3">Categoria</th>
                      <th className="p-3">Cidade</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      <tr><td colSpan={5} className="p-4 text-center">Carregando parceiros...</td></tr>
                    ) : partners.length === 0 ? (
                      <tr><td colSpan={5} className="p-4 text-center">Nenhum parceiro encontrado.</td></tr>
                    ) : (
                      partners.map(partner => (
                        <tr key={partner.id} className="hover:bg-obsidian-700/50 transition-colors">
                          <td className="p-3 font-medium text-white flex items-center gap-2">
                            {partner.logoUrl ? (
                              <img src={partner.logoUrl} alt={partner.name} className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-gray-700" />
                            )}
                            {partner.name}
                          </td>
                          <td className="p-3">{partner.category}</td>
                          <td className="p-3">{partner.city || '-'}</td>
                          <td className={`p-3 flex items-center gap-1 font-bold ${getStatusColor(partner.status)}`}>
                            {getStatusIcon(partner.status)}
                            <span className="uppercase text-xs">{partner.status || 'PENDING'}</span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {partner.status !== 'active' && (
                                <button
                                  onClick={() => handleUpdateStatus(partner.id, 'active')}
                                  className="p-1 hover:text-green-500 transition-colors"
                                  title="Aprovar/Ativar"
                                >
                                  <CheckCircle size={18} />
                                </button>
                              )}
                              {partner.status === 'active' && (
                                <button
                                  onClick={() => handleUpdateStatus(partner.id, 'suspended')}
                                  className="p-1 hover:text-red-500 transition-colors"
                                  title="Suspender"
                                >
                                  <Slash size={18} />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(partner)}
                                className="p-1 hover:text-gold-500 transition-colors"
                                title="Editar"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(partner.id)}
                                className="p-1 hover:text-red-600 transition-colors"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>
        </>
      ) : (
        <div className="space-y-6">
          <SectionTitle title="Editor de Conteúdo do Site" subtitle="Altere textos exibidos na Home Page em tempo real." />

          <div className="grid gap-6">
            {editableContent.map(item => (
              <Card key={item.key} className="bg-obsidian-900 border-obsidian-800 p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-medium">{item.label}</h4>
                    <p className="text-xs text-gray-500 font-mono">{item.key}</p>
                  </div>
                  {item.value !== rawContent.find(i => i.key === item.key)?.value && (
                    <span className="text-xs text-yellow-500 animate-pulse font-bold">● Não salvo</span>
                  )}
                </div>
                <div className="flex gap-2 items-start">
                  <textarea
                    value={item.value}
                    onChange={e => handleContentChange(item.key, e.target.value)}
                    className="flex-1 bg-black border border-obsidian-700 rounded p-3 text-white focus:border-gold-500 outline-none min-h-[50px] text-sm"
                  />
                  <button
                    onClick={() => saveContent(item.key, item.value)}
                    className="bg-obsidian-800 hover:bg-gold-500 hover:text-black text-gray-300 border border-obsidian-700 p-3 rounded-lg transition-all"
                    title="Salvar Alteração"
                  >
                    <Save size={20} />
                  </button>
                </div>
              </Card>
            ))}
            {editableContent.length === 0 && !loading && (
              <div className="text-gray-500 text-center py-10 border border-dashed border-gray-800 rounded-xl">
                Nenhum conteúdo editável encontrado no banco de dados.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal (Partners) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Editar Parceiro"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome do Parceiro</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Categoria</label>
            <select
              value={formData.category || ''}
              onChange={e => setFormData({ ...formData, category: e.target.value as PartnerCategory })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
            >
              {Object.values(PartnerCategory).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Benefício (Ex: 20% OFF)</label>
              <input
                type="text"
                value={formData.benefit || ''}
                onChange={e => setFormData({ ...formData, benefit: e.target.value })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cidade</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Status</label>
            <select
              value={formData.status || 'pending'}
              onChange={e => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
            >
              <option value="pending">Pendente</option>
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;