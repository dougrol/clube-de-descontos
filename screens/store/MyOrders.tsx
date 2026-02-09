import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, ChevronRight, Loader2, Clock, CheckCircle, XCircle, Truck, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../../components/ui';
import { fetchUserOrders } from '../../services/storeService';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

const MyOrders: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchUserOrders(user.id).then(data => {
                setOrders(data);
                setLoading(false);
            });
        }
    }, [user]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusConfig = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.CREATED:
            case OrderStatus.PENDING_PAYMENT:
                return {
                    label: 'Aguardando Pagamento',
                    icon: Clock,
                    color: 'text-yellow-500',
                    bg: 'bg-yellow-500/20',
                    border: 'border-yellow-500/30'
                };
            case OrderStatus.PAID:
                return {
                    label: 'Pago',
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bg: 'bg-green-500/20',
                    border: 'border-green-500/30'
                };
            case OrderStatus.SHIPPED:
                return {
                    label: 'Enviado',
                    icon: Truck,
                    color: 'text-blue-500',
                    bg: 'bg-blue-500/20',
                    border: 'border-blue-500/30'
                };
            case OrderStatus.DELIVERED:
                return {
                    label: 'Entregue',
                    icon: CheckCircle,
                    color: 'text-green-500',
                    bg: 'bg-green-500/20',
                    border: 'border-green-500/30'
                };
            case OrderStatus.CANCELED:
                return {
                    label: 'Cancelado',
                    icon: XCircle,
                    color: 'text-red-500',
                    bg: 'bg-red-500/20',
                    border: 'border-red-500/30'
                };
            case OrderStatus.REFUNDED:
                return {
                    label: 'Reembolsado',
                    icon: AlertCircle,
                    color: 'text-orange-500',
                    bg: 'bg-orange-500/20',
                    border: 'border-orange-500/30'
                };
            default:
                return {
                    label: status,
                    icon: Clock,
                    color: 'text-gray-500',
                    bg: 'bg-gray-500/20',
                    border: 'border-gray-500/30'
                };
        }
    };

    return (
        <div className="min-h-screen bg-black pb-24 animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-obsidian-800 px-4 py-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <ShoppingBag size={24} className="text-gold-500" />
                    Meus Pedidos
                </h1>
            </div>

            <div className="px-5 py-6">
                {loading ? (
                    <div className="flex justify-center py-20 text-gold-500">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <Package size={48} className="mx-auto text-gray-600 mb-4" />
                        <h3 className="text-white font-medium mb-2">Nenhum pedido ainda</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Quando você fizer uma compra, seus pedidos aparecerão aqui.
                        </p>
                        <button
                            onClick={() => navigate('/loja')}
                            className="text-gold-500 font-medium hover:underline"
                        >
                            Ir para a Loja →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const statusConfig = getStatusConfig(order.status);
                            const StatusIcon = statusConfig.icon;

                            return (
                                <Card
                                    key={order.id}
                                    className="bg-obsidian-900/50 border-obsidian-800 cursor-pointer hover:border-gold-500/30 transition-all"
                                    onClick={() => {/* Could navigate to order detail */ }}
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-gray-500 text-xs mb-1">
                                                {formatDate(order.createdAt)}
                                            </p>
                                            <p className="text-white font-medium">{order.partnerName}</p>
                                        </div>
                                        <Badge className={`${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                            <StatusIcon size={12} className="mr-1" />
                                            {statusConfig.label}
                                        </Badge>
                                    </div>

                                    {/* Items Preview */}
                                    {order.items && order.items.length > 0 && (
                                        <div className="flex gap-2 mb-3 overflow-x-auto">
                                            {order.items.slice(0, 3).map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex-shrink-0 w-16 h-16 rounded-lg bg-obsidian-800 overflow-hidden"
                                                >
                                                    <img
                                                        src={item.productImageUrl || 'https://placehold.co/64x64/1a1a1a/d4af37?text=P'}
                                                        alt={item.productTitle}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.onerror = null;
                                                            target.src = 'https://placehold.co/64x64/1a1a1a/d4af37?text=P';
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-obsidian-800 flex items-center justify-center">
                                                    <span className="text-gray-500 text-sm">+{order.items.length - 3}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-3 border-t border-obsidian-800">
                                        <div>
                                            <p className="text-gray-500 text-xs">Total</p>
                                            <p className="text-gold-500 font-bold">{formatPrice(order.totalAmount)}</p>
                                        </div>
                                        <ChevronRight size={20} className="text-gray-600" />
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyOrders;
