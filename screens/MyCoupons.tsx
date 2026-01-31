import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Ticket, Clock, CheckCircle, XCircle, Store, RefreshCw, X, QrCode } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUserCoupons, getCouponRemainingTime, Coupon } from '../services/couponService';
import { QRCodeDisplay } from '../components/ui';

const MyCoupons: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'used' | 'expired'>('all');

    // QR Code Modal State
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

    const loadCoupons = async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const userCoupons = await getUserCoupons(user.id);
            setCoupons(userCoupons);
        } catch (err) {
            console.error('Error loading coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCoupons();
    }, [user?.id]);

    const filteredCoupons = coupons.filter(c => {
        if (filter === 'all') return true;
        return c.status === filter;
    });

    const getStatusBadge = (status: Coupon['status'], expiresAt: string) => {
        const isExpired = new Date(expiresAt) < new Date();
        const actualStatus = status === 'active' && isExpired ? 'expired' : status;

        switch (actualStatus) {
            case 'active':
                return (
                    <span className="flex items-center gap-1 text-green-400 text-xs bg-green-500/20 px-2 py-1 rounded-full">
                        <Clock size={12} />
                        {getCouponRemainingTime(expiresAt)}
                    </span>
                );
            case 'used':
                return (
                    <span className="flex items-center gap-1 text-blue-400 text-xs bg-blue-500/20 px-2 py-1 rounded-full">
                        <CheckCircle size={12} />
                        Utilizado
                    </span>
                );
            case 'expired':
                return (
                    <span className="flex items-center gap-1 text-red-400 text-xs bg-red-500/20 px-2 py-1 rounded-full">
                        <XCircle size={12} />
                        Expirado
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-black animate-fade-in relative">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center p-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="flex-1 text-center text-white text-sm font-bold tracking-[0.2em] uppercase">Meus Cupons</h1>
                    <button onClick={loadCoupons} className="p-2 -mr-2 text-gold-500 hover:text-gold-400">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 px-4 pb-4 overflow-x-auto">
                    {[
                        { key: 'all', label: 'Todos' },
                        { key: 'active', label: 'Ativos' },
                        { key: 'used', label: 'Usados' },
                        { key: 'expired', label: 'Expirados' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key as typeof filter)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filter === tab.key
                                    ? 'bg-gold-500 text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 pb-24 space-y-3">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
                        <p className="text-gray-500 text-sm">Carregando cupons...</p>
                    </div>
                ) : filteredCoupons.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Ticket size={32} className="text-gray-600" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">Nenhum cupom encontrado</h3>
                        <p className="text-gray-500 text-sm max-w-xs">
                            {filter === 'all'
                                ? 'Acesse nossos parceiros e gere seu primeiro cupom de desconto!'
                                : `Você não tem cupons ${filter === 'active' ? 'ativos' : filter === 'used' ? 'usados' : 'expirados'}.`
                            }
                        </p>
                        <button
                            onClick={() => navigate('/benefits')}
                            className="mt-6 px-6 py-3 bg-gold-500 text-black font-bold rounded-xl"
                        >
                            Ver Parceiros
                        </button>
                    </div>
                ) : (
                    filteredCoupons.map(coupon => {
                        const isExpired = new Date(coupon.expires_at) < new Date();
                        const canShowQR = coupon.status === 'active' && !isExpired;

                        return (
                            <div
                                key={coupon.id}
                                onClick={() => canShowQR && setSelectedCoupon(coupon)}
                                className={`bg-obsidian-900 border rounded-2xl p-4 transition-all ${canShowQR ? 'cursor-pointer hover:border-gold-500/50 active:scale-[0.98]' : ''
                                    } ${canShowQR ? 'border-gold-500/30' : 'border-white/5 opacity-70'
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                            <Store size={20} className="text-gold-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-sm">{coupon.partner_name}</h3>
                                            <p className="text-gray-500 text-xs">{coupon.benefit}</p>
                                        </div>
                                    </div>
                                    {getStatusBadge(coupon.status, coupon.expires_at)}
                                </div>

                                {/* Coupon Code */}
                                <div className="bg-black/50 rounded-xl p-3 text-center border border-dashed border-white/10 flex flex-col items-center justify-center gap-2">
                                    <div>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Código do Cupom</p>
                                        <p className="text-gold-500 font-mono font-bold text-xl tracking-wider">{coupon.code}</p>
                                    </div>
                                    {canShowQR && (
                                        <div className="text-[10px] text-gold-500 flex items-center gap-1 bg-gold-500/10 px-2 py-1 rounded">
                                            <QrCode size={12} />
                                            Toque para ver QR Code
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/5">
                                    <p className="text-gray-600 text-[10px]">
                                        Gerado em {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                    {coupon.used_at && (
                                        <p className="text-gray-600 text-[10px]">
                                            Usado em {new Date(coupon.used_at).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* QR Code Modal */}
            {selectedCoupon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-6 animate-fade-in">
                    <div className="bg-obsidian-900 w-full max-w-sm rounded-3xl border border-gold-500/30 p-8 text-center relative animate-scale-up shadow-[0_0_50px_rgba(212,175,55,0.1)]">
                        <button
                            onClick={() => setSelectedCoupon(null)}
                            className="absolute top-4 right-4 p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-xl font-bold text-white mb-1">{selectedCoupon.partner_name}</h3>
                        <p className="text-gold-500 font-medium mb-6">{selectedCoupon.benefit}</p>

                        <div className="mb-6 flex justify-center">
                            <QRCodeDisplay
                                code={selectedCoupon.code}
                                expiresAt={selectedCoupon.expires_at}
                                benefit={selectedCoupon.benefit}
                                partnerName={selectedCoupon.partner_name}
                            />
                        </div>

                        <p className="text-sm text-gray-400">
                            Apresente este QR Code ao parceiro para validar seu desconto.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyCoupons;
