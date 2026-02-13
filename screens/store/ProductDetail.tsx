import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Tag, Package, Store, Wrench, Percent, Star, Clock } from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { fetchProductById } from '../../services/storeService';
import { Product, ProductType } from '../../types';

const ProductDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (id) {
            fetchProductById(id).then(data => {
                setProduct(data);
                setLoading(false);
            });
        }
    }, [id]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const calculateDiscount = (original: number, discount: number) => {
        return Math.round(((original - discount) / original) * 100);
    };

    const handleQuantityChange = (delta: number) => {
        const newQty = quantity + delta;
        if (newQty >= 1 && newQty <= (product?.stock || 1)) {
            setQuantity(newQty);
        }
    };

    const handleBuy = () => {
        if (product) {
            navigate(`/checkout/${product.id}?qty=${quantity}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-gold-500">
                Carregando...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10">
                <Package size={48} className="text-gray-600 mb-4" />
                <p>Produto não encontrado</p>
                <Button className="mt-4" onClick={() => navigate('/loja')}>
                    Voltar à Loja
                </Button>
            </div>
        );
    }

    const isService = product.productType === ProductType.SERVICE;
    const hasDiscount = product.priceOriginal > product.priceDiscount;
    const discountPercent = hasDiscount ? calculateDiscount(product.priceOriginal, product.priceDiscount) : 0;
    const totalPrice = product.priceDiscount * quantity;

    return (
        <div className="min-h-screen bg-black pb-40 animate-fade-in">
            {/* Header Image */}
            <div className="relative h-80 w-full">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-20 h-10 w-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>

                <img
                    src={product.imageUrl || 'https://placehold.co/800x600/1a1a1a/d4af37?text=Produto'}
                    alt={product.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/800x600/1a1a1a/d4af37?text=Produto';
                    }}
                />

                {/* Type Badge */}
                {isService ? (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg flex items-center gap-2">
                        <Wrench size={16} /> SERVIÇO
                    </div>
                ) : hasDiscount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-lg">
                        -{discountPercent}% OFF
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="px-5 -mt-10 relative z-10 space-y-6">
                {/* Partner & Type */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Store size={14} className="text-gold-500" />
                        <span className="text-gold-500 text-sm font-medium">{product.partnerName}</span>
                    </div>
                    {isService && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Serviço
                        </Badge>
                    )}
                </div>

                {/* Title & Price */}
                <div>
                    <h1 className="text-2xl font-bold text-white mb-3">{product.title}</h1>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-bold text-gold-500">
                            {formatPrice(product.priceDiscount)}
                        </span>
                        {hasDiscount && (
                            <span className="text-gray-500 text-lg line-through">
                                {formatPrice(product.priceOriginal)}
                            </span>
                        )}
                    </div>

                    {/* Service: Member Discount Highlight */}
                    {isService && hasDiscount && (
                        <div className="mt-3 flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-lg px-3 py-2">
                            <Percent size={18} className="text-gold-500" />
                            <span className="text-gold-500 font-semibold">
                                {discountPercent}% de desconto exclusivo para associados
                            </span>
                        </div>
                    )}
                </div>

                {/* Description */}
                <Card className="bg-obsidian-900/50 border-obsidian-800">
                    <h3 className="font-semibold text-white mb-2">Descrição</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {product.description || 'Sem descrição disponível.'}
                    </p>
                </Card>

                {/* Service: How it works */}
                {isService && (
                    <Card className="bg-blue-500/10 border-blue-500/30">
                        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                            <Clock size={18} className="text-blue-400" />
                            Como funciona
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">1.</span>
                                Realize a compra do serviço
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">2.</span>
                                Apresente o cupom no parceiro
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-blue-400 font-bold">3.</span>
                                Aproveite o serviço com desconto exclusivo!
                            </li>
                        </ul>
                    </Card>
                )}

                {/* Product: Stock Info */}
                {!isService && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Package size={16} />
                            <span>
                                {product.stock > 0
                                    ? `${product.stock} disponíveis`
                                    : 'Produto esgotado'}
                            </span>
                        </div>
                        {product.stock > 0 && product.stock <= 5 && (
                            <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                                Últimas unidades!
                            </Badge>
                        )}
                    </div>
                )}

                {/* Product: Quantity Selector (Only for products, not services) */}
                {!isService && product.stock > 0 && (
                    <Card className="bg-obsidian-900/50 border-obsidian-800">
                        <div className="flex items-center justify-between">
                            <span className="text-white font-medium">Quantidade</span>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleQuantityChange(-1)}
                                    disabled={quantity <= 1}
                                    className="h-10 w-10 rounded-lg bg-obsidian-800 text-white flex items-center justify-center disabled:opacity-50 hover:bg-obsidian-700 transition-colors"
                                >
                                    <Minus size={18} />
                                </button>
                                <span className="text-xl font-bold text-white w-8 text-center">
                                    {quantity}
                                </span>
                                <button
                                    onClick={() => handleQuantityChange(1)}
                                    disabled={quantity >= product.stock}
                                    className="h-10 w-10 rounded-lg bg-obsidian-800 text-white flex items-center justify-center disabled:opacity-50 hover:bg-obsidian-700 transition-colors"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Service: Member Benefits */}
                {isService && (
                    <Card className="bg-gold-500/10 border-gold-500/30">
                        <div className="flex items-center gap-3">
                            <Star size={24} className="text-gold-500 fill-gold-500" />
                            <div>
                                <p className="text-white font-semibold">Benefício Exclusivo</p>
                                <p className="text-gray-400 text-sm">Apenas para associados Tavares Car</p>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Fixed Bottom Bar */}
            {(isService || product.stock > 0) && (
                <div className="fixed bottom-20 left-0 right-0 bg-obsidian-950/95 backdrop-blur-md border-t border-obsidian-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-gray-400 text-sm">
                            {isService ? 'Valor:' : 'Total:'}
                        </span>
                        <span className="text-2xl font-bold text-gold-500">
                            {isService ? formatPrice(product.priceDiscount) : formatPrice(totalPrice)}
                        </span>
                    </div>
                    <Button onClick={handleBuy} className="w-full">
                        {isService ? (
                            <>
                                <Tag size={18} className="mr-2" />
                                ADQUIRIR SERVIÇO
                            </>
                        ) : (
                            <>
                                <ShoppingCart size={18} className="mr-2" />
                                COMPRAR AGORA
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default ProductDetail;
