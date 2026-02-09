import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SectionTitle, Card } from '../components/ui';
import Modal from '../components/ui/Modal';
import { Users, DollarSign, Award, ArrowUpRight, CheckCircle, Clock, Save, Pencil, Trash2, Slash, XCircle, Type, Layout, Package, Plus, Eye, EyeOff, Ticket, ShieldCheck, Star, X } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { Partner, PartnerCategory, Product, ProductDB } from '../types';
import { useCMS, SiteContent } from '../contexts/CMSContext';
import { fetchActiveProducts, toggleProductActive, updateProduct } from '../services/storeService';
import { UsedCouponsList } from '../components/admin/UsedCouponsList';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'content' | 'products' | 'coupons' | 'protection'>('dashboard');
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [activePartnersCount, setActivePartnersCount] = useState<number>(0);
  const [partners, setPartners] = useState<ExtendedPartner[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  // CMS State
  const { rawContent, updateContent } = useCMS();
  const [editableContent, setEditableContent] = useState<SiteContent[]>([]);

  // Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<ExtendedPartner | null>(null);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<ProductDB[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductDB | null>(null);
  const [productForm, setProductForm] = useState<Partial<ProductDB>>({});
  const [formData, setFormData] = useState<Partial<ExtendedPartner>>({});

  // Protection Plans State
  interface ProtectionPlan {
    id: string;
    name: string;
    price: number;
    features: string[];
    is_popular: boolean;
    active: boolean;
    display_order: number;
  }
  const [protectionPlans, setProtectionPlans] = useState<ProtectionPlan[]>([]);
  const [protectionLoading, setProtectionLoading] = useState(false);
  const [isProtectionModalOpen, setIsProtectionModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ProtectionPlan | null>(null);
  const [planForm, setPlanForm] = useState<Partial<ProtectionPlan>>({});
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchAllProducts();
    fetchProtectionPlans();
  }, []);

  const fetchProtectionPlans = async () => {
    setProtectionLoading(true);
    try {
      const { data, error } = await supabase
        .from('protection_plans')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setProtectionPlans(data || []);
    } catch (error) {
      console.error('Error fetching protection plans:', error);
    } finally {
      setProtectionLoading(false);
    }
  };

  const handleEditPlan = (plan: ProtectionPlan) => {
    setEditingPlan(plan);
    setPlanForm(plan);
    setIsProtectionModalOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setPlanForm({ active: true, is_popular: false, features: [], display_order: protectionPlans.length + 1 });
    setIsProtectionModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.price) return;

    try {
      if (editingPlan) {
        const { error } = await supabase
          .from('protection_plans')
          .update({
            name: planForm.name,
            price: planForm.price,
            features: planForm.features || [],
            is_popular: planForm.is_popular || false,
            active: planForm.active ?? true,
            display_order: planForm.display_order || 0
          })
          .eq('id', editingPlan.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('protection_plans')
          .insert([{
            name: planForm.name,
            price: planForm.price,
            features: planForm.features || [],
            is_popular: planForm.is_popular || false,
            active: planForm.active ?? true,
            display_order: planForm.display_order || 0
          }]);
        if (error) throw error;
      }

      setIsProtectionModalOpen(false);
      setEditingPlan(null);
      setPlanForm({});
      fetchProtectionPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Erro ao salvar plano.');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este plano?')) return;
    try {
      const { error } = await supabase.from('protection_plans').delete().eq('id', id);
      if (error) throw error;
      setProtectionPlans(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Erro ao excluir plano.');
    }
  };

  const handleTogglePlanActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from('protection_plans')
        .update({ active: !currentActive })
        .eq('id', id);
      if (error) throw error;
      setProtectionPlans(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p));
    } catch (error) {
      console.error('Error toggling plan:', error);
    }
  };

  const addFeature = () => {
    if (!newFeature.trim()) return;
    setPlanForm(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature.trim()]
    }));
    setNewFeature('');
  };

  const removeFeature = (index: number) => {
    setPlanForm(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  const fetchAllProducts = async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          partners (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

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
  const handleUpdateStatus = async (id: string, newStatus: ExtendedPartner['status']) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      setPartners(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
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
    alert('Conteúdo salvo com sucesso!');
  };

  // --- Products Logic ---
  const handleToggleProductActive = async (id: string, currentActive: boolean) => {
    const success = await toggleProductActive(id, !currentActive);
    if (success) {
      setAllProducts(prev => prev.map(p => p.id === id ? { ...p, active: !currentActive } : p));
    }
  };

  const handleEditProduct = (product: ProductDB) => {
    setEditingProduct(product);
    setProductForm(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setAllProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Erro ao excluir produto.');
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm) return;

    try {
      if (editingProduct) {
        // Update existing
        const { error } = await supabase
          .from('products')
          .update({
            title: productForm.title,
            description: productForm.description,
            price_original: productForm.price_original,
            price_discount: productForm.price_discount,
            stock: productForm.stock,
            image_url: productForm.image_url,
            active: productForm.active
          })
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('products')
          .insert([{
            partner_id: productForm.partner_id,
            title: productForm.title,
            description: productForm.description,
            price_original: productForm.price_original,
            price_discount: productForm.price_discount,
            stock: productForm.stock || 0,
            active: productForm.active || false,
            image_url: productForm.image_url
          }]);
        if (error) throw error;
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductForm({});
      fetchAllProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Erro ao salvar produto.');
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductForm({ active: false, stock: 0 });
    setIsProductModalOpen(true);
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
        <div className="flex bg-obsidian-900 rounded-lg p-1 border border-obsidian-700 self-start md:self-auto flex-wrap">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'dashboard' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Layout size={16} /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'products' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Package size={16} /> Produtos
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'content' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Type size={16} /> Site Content
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'coupons' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <Ticket size={16} /> Cupons
          </button>
          <button
            onClick={() => setActiveTab('protection')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'protection' ? 'bg-gold-500 text-black' : 'text-gray-400 hover:text-white'}`}
          >
            <ShieldCheck size={16} /> Proteção
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
      ) : activeTab === 'products' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <SectionTitle title="Gerenciamento de Produtos" subtitle="Adicione, edite ou remova produtos da loja." />
            <button
              onClick={openNewProductModal}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
            >
              <Plus size={18} /> Novo Produto
            </button>
          </div>

          <Card className="bg-obsidian-800 border-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-obsidian-900 uppercase font-medium">
                  <tr>
                    <th className="p-3">Produto</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Estoque</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {productsLoading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Carregando produtos...</td></tr>
                  ) : allProducts.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center">Nenhum produto encontrado.</td></tr>
                  ) : (
                    allProducts.map((product: any) => (
                      <tr key={product.id} className="hover:bg-obsidian-700/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image_url || 'https://placehold.co/40x40/1a1a1a/d4af37?text=P'}
                              alt={product.title}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'https://placehold.co/40x40/1a1a1a/d4af37?text=P';
                              }}
                            />
                            <div>
                              <p className="text-white font-medium">{product.title}</p>
                              <p className="text-xs text-gray-500">{product.partners?.name || 'Sem parceiro'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <span className="text-gold-500 font-bold">R$ {Number(product.price_discount).toFixed(2)}</span>
                            {product.price_original > product.price_discount && (
                              <span className="text-gray-500 text-xs line-through ml-2">R$ {Number(product.price_original).toFixed(2)}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={product.stock <= 5 ? 'text-orange-500' : 'text-white'}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${product.active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                            {product.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleProductActive(product.id, product.active)}
                              className={`p-1 transition-colors ${product.active ? 'hover:text-orange-500' : 'hover:text-green-500'}`}
                              title={product.active ? 'Desativar' : 'Ativar'}
                            >
                              {product.active ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="p-1 hover:text-gold-500 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
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
        </div>
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

      {/* Used Coupons Tab Content */}
      {activeTab === 'coupons' && (
        <UsedCouponsList />
      )}

      {/* Protection Plans Tab Content */}
      {activeTab === 'protection' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <SectionTitle title="Planos de Proteção Veicular" subtitle="Gerencie os planos exibidos na tela de proteção." />
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-lg transition-colors"
            >
              <Plus size={18} /> Novo Plano
            </button>
          </div>

          <Card className="bg-obsidian-800 border-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-obsidian-900 uppercase font-medium">
                  <tr>
                    <th className="p-3">Plano</th>
                    <th className="p-3">Preço</th>
                    <th className="p-3">Coberturas</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {protectionLoading ? (
                    <tr><td colSpan={5} className="p-4 text-center">Carregando planos...</td></tr>
                  ) : protectionPlans.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center">Nenhum plano encontrado.</td></tr>
                  ) : (
                    protectionPlans.map(plan => (
                      <tr key={plan.id} className="hover:bg-obsidian-700/50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{plan.name}</span>
                            {plan.is_popular && (
                              <span className="bg-gold-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Star size={10} fill="black" /> Popular
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-gold-500 font-bold">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                          <span className="text-gray-500 text-xs">/mês</span>
                        </td>
                        <td className="p-3">
                          <span className="text-xs">{plan.features.length} coberturas</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${plan.active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-400'}`}>
                            {plan.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleTogglePlanActive(plan.id, plan.active)}
                              className={`p-1 transition-colors ${plan.active ? 'hover:text-orange-500' : 'hover:text-green-500'}`}
                              title={plan.active ? 'Desativar' : 'Ativar'}
                            >
                              {plan.active ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="p-1 hover:text-gold-500 transition-colors"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
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
              onChange={e => setFormData({ ...formData, status: e.target.value as ExtendedPartner['status'] })}
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

      {/* Product Edit Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          {!editingProduct && (
            <div>
              <label className="block text-sm text-gray-400 mb-1">Parceiro</label>
              <select
                value={productForm.partner_id || ''}
                onChange={e => setProductForm({ ...productForm, partner_id: e.target.value })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                required
              >
                <option value="">Selecione um parceiro</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">Título do Produto</label>
            <input
              type="text"
              value={productForm.title || ''}
              onChange={e => setProductForm({ ...productForm, title: e.target.value })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Descrição</label>
            <textarea
              value={productForm.description || ''}
              onChange={e => setProductForm({ ...productForm, description: e.target.value })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço Original (R$)</label>
              <input
                type="number"
                step="0.01"
                value={productForm.price_original || ''}
                onChange={e => setProductForm({ ...productForm, price_original: parseFloat(e.target.value) })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço com Desconto (R$)</label>
              <input
                type="number"
                step="0.01"
                value={productForm.price_discount || ''}
                onChange={e => setProductForm({ ...productForm, price_discount: parseFloat(e.target.value) })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Estoque</label>
              <input
                type="number"
                value={productForm.stock || 0}
                onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select
                value={productForm.active ? 'true' : 'false'}
                onChange={e => setProductForm({ ...productForm, active: e.target.value === 'true' })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              >
                <option value="false">Inativo</option>
                <option value="true">Ativo</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">URL da Imagem</label>
            <input
              type="text"
              value={productForm.image_url || ''}
              onChange={e => setProductForm({ ...productForm, image_url: e.target.value })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              placeholder="https://..."
            />
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded"
            >
              {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Protection Plan Edit Modal */}
      <Modal
        isOpen={isProtectionModalOpen}
        onClose={() => setIsProtectionModalOpen(false)}
        title={editingPlan ? 'Editar Plano' : 'Novo Plano de Proteção'}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Nome do Plano</label>
            <input
              type="text"
              value={planForm.name || ''}
              onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
              className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              placeholder="Ex: Básico, Ouro, Premium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Preço Mensal (R$)</label>
              <input
                type="number"
                step="0.01"
                value={planForm.price || ''}
                onChange={e => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                placeholder="99.90"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ordem de Exibição</label>
              <input
                type="number"
                value={planForm.display_order || 0}
                onChange={e => setPlanForm({ ...planForm, display_order: parseInt(e.target.value) })}
                className="w-full bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_popular"
                checked={planForm.is_popular || false}
                onChange={e => setPlanForm({ ...planForm, is_popular: e.target.checked })}
                className="w-4 h-4 accent-gold-500"
              />
              <label htmlFor="is_popular" className="text-sm text-gray-300">Marcar como "Mais Vendido"</label>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="plan_active"
                checked={planForm.active ?? true}
                onChange={e => setPlanForm({ ...planForm, active: e.target.checked })}
                className="w-4 h-4 accent-gold-500"
              />
              <label htmlFor="plan_active" className="text-sm text-gray-300">Plano Ativo</label>
            </div>
          </div>

          {/* Features/Coberturas */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Coberturas</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newFeature}
                onChange={e => setNewFeature(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                className="flex-1 bg-black border border-obsidian-700 rounded p-2 text-white focus:border-gold-500 outline-none text-sm"
                placeholder="Ex: Guincho 500km, Assistência 24h..."
              />
              <button
                type="button"
                onClick={addFeature}
                className="px-4 py-2 bg-obsidian-700 hover:bg-obsidian-600 text-white rounded transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {(planForm.features || []).map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between bg-obsidian-900 rounded px-3 py-2">
                  <span className="text-gray-300 text-sm">{feat}</span>
                  <button
                    type="button"
                    onClick={() => removeFeature(idx)}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              {(planForm.features || []).length === 0 && (
                <p className="text-gray-500 text-xs text-center py-2">Nenhuma cobertura adicionada</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={() => setIsProtectionModalOpen(false)}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded"
            >
              {editingPlan ? 'Salvar Alterações' : 'Criar Plano'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Admin;