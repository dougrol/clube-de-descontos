import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Card } from '../ui';
import { Ticket, Search, Filter, RefreshCw, CheckCircle, Clock, XCircle } from 'lucide-react';

interface CouponDB {
    id: string;
    code: string;
    user_name: string;
    partner_name: string;
    benefit: string;
    status: string;
    created_at: string;
    used_at?: string;
    partner_id: string; // To filter by partner if needed
}

export const UsedCouponsList: React.FC = () => {
    const [coupons, setCoupons] = useState<CouponDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'used' | 'expired'>('used');

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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Ticket className="text-gold-500" size={24} />
                        Histórico de Cupons
                    </h2>
                    <p className="text-gray-400 text-sm">Monitore a utilização dos benefícios</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === 'all' ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStatusFilter('used')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${statusFilter === 'used' ? 'bg-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        Usados
                    </button>
                    <button
                        onClick={fetchCoupons}
                        className="p-2 bg-gold-500 text-black rounded-lg hover:bg-gold-400 transition-colors"
                        title="Atualizar"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
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
                                <th className="p-4">Data Uso</th>
                                <th className="p-4">Código</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Parceiro</th>
                                <th className="p-4">Benefício</th>
                                <th className="p-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Carregando histórico...</td></tr>
                            ) : filteredCoupons.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center">Nenhum cupom encontrado com os filtros atuais.</td></tr>
                            ) : (
                                filteredCoupons.map((coupon) => (
                                    <tr key={coupon.id} className="hover:bg-obsidian-700/50 transition-colors">
                                        <td className="p-4 font-mono text-xs">
                                            {coupon.used_at
                                                ? new Date(coupon.used_at).toLocaleDateString() + ' ' + new Date(coupon.used_at).toLocaleTimeString().slice(0, 5)
                                                : <span className="text-gray-600">-</span>
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
