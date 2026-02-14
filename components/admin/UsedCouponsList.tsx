import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui';
import { Ticket, Search, RefreshCw, CheckCircle, Clock, XCircle, Trash2, CheckSquare } from 'lucide-react';

interface CouponDB {
    id: string;
    code: string;
    user_name: string;
    partner_name: string;
    benefit: string;
    status: string;
    created_at: string;
    used_at?: string;
    partner_id: string;
}

export const UsedCouponsList: React.FC = () => {
    const [coupons, setCoupons] = useState<CouponDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchCoupons = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (statusFilter !== 'all') {
                query = query.eq('status', statusFilter);
            }

            const { data, error } = await query;

            if (error) throw error;
            setCoupons(data || []);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoupons();
    }, [statusFilter]);

    const handleDelete = async (couponId: string) => {
        if (!confirm('Excluir este cupom permanentemente?')) return;
        setActionLoading(couponId);
        try {
            const { error } = await supabase.from('coupons').delete().eq('id', couponId);
            if (error) throw error;
            setCoupons(prev => prev.filter(c => c.id !== couponId));
        } catch (error) {
            console.error('Error deleting coupon:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleMarkAsUsed = async (couponId: string) => {
        setActionLoading(couponId);
        try {
            const { error } = await supabase
                .from('coupons')
                .update({ status: 'used', used_at: new Date().toISOString() })
                .eq('id', couponId);
            if (error) throw error;
            setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, status: 'used', used_at: new Date().toISOString() } : c));
        } catch (error) {
            console.error('Error marking coupon as used:', error);
        } finally {
            setActionLoading(null);
        }
    };

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(search.toLowerCase()) ||
        (c.user_name && c.user_name.toLowerCase().includes(search.toLowerCase())) ||
        (c.partner_name && c.partner_name.toLowerCase().includes(search.toLowerCase()))
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'used': return <CheckCircle size={14} />;
            case 'active': return <Clock size={14} />;
            case 'expired': return <XCircle size={14} />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'used': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            case 'active': return 'text-green-400 bg-green-500/10 border-green-500/20';
            case 'expired': return 'text-red-400 bg-red-500/10 border-red-500/20';
            default: return 'text-gray-400';
        }
    };

    const filterTabs = [
        { key: 'all', label: 'Todos', color: 'bg-white text-black' },
        { key: 'active', label: 'Ativos', color: 'bg-green-500 text-white' },
        { key: 'used', label: 'Usados', color: 'bg-blue-500 text-white' },
        { key: 'expired', label: 'Expirados', color: 'bg-red-500 text-white' },
    ] as const;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Ticket className="text-gold-500" size={24} />
                        Gestão de Cupons
                    </h2>
                    <p className="text-gray-400 text-sm">Monitore, edite e gerencie os cupons</p>
                </div>

                <div className="flex gap-2 flex-wrap">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setStatusFilter(tab.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === tab.key ? tab.color : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                    <button
                        onClick={fetchCoupons}
                        className="p-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex gap-4 bg-obsidian-900 p-4 rounded-xl border border-white/5">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por código, cliente ou parceiro..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black border border-obsidian-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gold-500 outline-none"
                    />
                </div>
            </div>

            {/* Table */}
            <Card className="bg-obsidian-800 border-none overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-obsidian-900 uppercase font-medium">
                            <tr>
                                <th className="p-4">Data</th>
                                <th className="p-4">Código</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Parceiro</th>
                                <th className="p-4">Benefício</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center">Carregando...</td></tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center">Nenhum cupom encontrado.</td></tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-obsidian-700/50 transition-colors">
                                        <td className="p-4 font-mono text-xs">
                                            {coupon.used_at
                                                ? new Date(coupon.used_at).toLocaleDateString() + ' ' + new Date(coupon.used_at).toLocaleTimeString().slice(0, 5)
                                                : new Date(coupon.created_at).toLocaleDateString()
                                            }
                                        </td>
                                        <td className="p-4 font-mono text-gold-500 font-bold">{coupon.code}</td>
                                        <td className="p-4 text-white font-medium">{coupon.user_name || 'Desconhecido'}</td>
                                        <td className="p-4">{coupon.partner_name}</td>
                                        <td className="p-4 text-green-400">{coupon.benefit}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(coupon.status)}`}>
                                                {getStatusIcon(coupon.status)}
                                                {coupon.status === 'used' ? 'Utilizado' : coupon.status === 'active' ? 'Ativo' : 'Expirado'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {coupon.status === 'active' && (
                                                    <button
                                                        onClick={() => handleMarkAsUsed(coupon.id)}
                                                        disabled={actionLoading === coupon.id}
                                                        className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50"
                                                        title="Marcar como usado"
                                                    >
                                                        <CheckSquare size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(coupon.id)}
                                                    disabled={actionLoading === coupon.id}
                                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                                                    title="Excluir cupom"
                                                >
                                                    <Trash2 size={14} />
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
    );
};
