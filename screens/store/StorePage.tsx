import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag, Tag, Loader2, Package,
    ChevronLeft, ChevronRight, Sparkles, Flame, Zap, Star,
    Car, Utensils, Shirt, Gamepad2, Heart, Gift, Wrench, Percent
} from 'lucide-react';
import { Card } from '../../components/ui';
import { fetchActiveProducts } from '../../services/storeService';
import { Product, ProductType } from '../../types';

// Quick Access Categories Data
const QUICK_CATEGORIES = [
    { id: 'automotive', label: 'Automotivo', icon: Car, color: 'from-amber-500 to-orange-600' },
    { id: 'food', label: 'Alimentação', icon: Utensils, color: 'from-red-500 to-pink-600' },
    { id: 'lifestyle', label: 'Lifestyle', icon: Shirt, color: 'from-purple-500 to-indigo-600' },
    { id: 'entertainment', label: 'Lazer', icon: Gamepad2, color: 'from-green-500 to-emerald-600' },
    { id: 'health', label: 'Saúde', icon: Heart, color: 'from-rose-500 to-red-600' },
    { id: 'gifts', label: 'Presentes', icon: Gift, color: 'from-yellow-500 to-amber-600' },
];

// Banner Slides Data
const BANNER_SLIDES = [
    {
        id: 1,
        title: 'SUPER OFERTAS',
        subtitle: 'Até 70% OFF para membros',
        gradient: 'from-gold-600 via-gold-500 to-amber-500',
        icon: Sparkles,
    },
    {
        id: 2,
        title: 'FRETE GRÁTIS',
        subtitle: 'Em produtos selecionados',
        gradient: 'from-emerald-600 via-green-500 to-teal-500',
        icon: Tag,
    },
    {
        id: 3,
        title: 'EXCLUSIVO GOLD',
        subtitle: 'Descontos especiais para você',
        gradient: 'from-amber-600 via-yellow-500 to-gold-500',
        icon: Star,
    },
];

const StorePage: React.FC = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const slideInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchActiveProducts().then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    // Auto-slide carousel
    useEffect(() => {
        slideInterval.current = setInterval(() => {
            setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
        }, 4000);
        return () => {
            if (slideInterval.current) clearInterval(slideInterval.current);
        };
    }, []);

    const nextSlide = () => {
        setCurrentSlide(prev => (prev + 1) % BANNER_SLIDES.length);
    };

    const prevSlide = () => {
        setCurrentSlide(prev => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
    };

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.description.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const calculateDiscount = (original: number, discount: number) => {
        return Math.round(((original - discount) / original) * 100);
    };

    // Organize products into sections
    const hotProducts = filteredProducts.slice(0, 4);
    const newProducts = filteredProducts.slice(4, 8);
    const allProducts = filteredProducts;

    return (
        <div className="pb-24 min-h-screen bg-black animate-fade-in">
            {/* Hero Carousel */}
            <div className="relative h-[180px] w-full overflow-hidden">
                {BANNER_SLIDES.map((slide, index) => {
                    const IconComponent = slide.icon;
                    return (
                        <div
                            key={slide.id}
                            className={`absolute inset-0 transition-all duration-700 ease-out ${index === currentSlide
                                ? 'opacity-100 translate-x-0'
                                : index < currentSlide
                                    ? 'opacity-0 -translate-x-full'
                                    : 'opacity-0 translate-x-full'
                                }`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient}`} />
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                                <IconComponent size={36} className="text-black/80 mb-2 animate-pulse" />
                                <h2 className="text-2xl font-black text-black tracking-tight">{slide.title}</h2>
                                <p className="text-black/70 text-sm font-medium">{slide.subtitle}</p>
                            </div>
                        </div>
                    );
                })}

                {/* Carousel Controls */}
                <button
                    onClick={prevSlide}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
                >
                    <ChevronRight size={18} />
                </button>

                {/* Slide Indicators */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                    {BANNER_SLIDES.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-6 bg-white'
                                : 'w-2 bg-white/50 hover:bg-white/70'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Quick Access Categories */}
            <div className="px-4 py-5 border-b border-white/5">
                <div className="grid grid-cols-6 gap-3">
                    {QUICK_CATEGORIES.map((cat) => {
                        const IconComponent = cat.icon;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                className={`flex flex-col items-center gap-1.5 transition-all duration-200 ${selectedCategory === cat.id ? 'scale-95' : 'hover:scale-105'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg ${selectedCategory === cat.id ? 'ring-2 ring-gold-500 ring-offset-2 ring-offset-black' : ''
                                    }`}>
                                    <IconComponent size={20} className="text-white" />
                                </div>
                                <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">
                                    {cat.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="px-4">
                {/* Sticky Search Bar */}
                <div className="sticky top-0 z-40 py-3 -mx-1">
                    <div className="bg-obsidian-900/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-3">
                        <div className="relative">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Buscar na loja..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/50 border border-obsidian-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:border-gold-500 focus:ring-1 focus:ring-gold-500/50 transition-all outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Loader2 className="animate-spin text-gold-500 mb-4" size={40} />
                        <p className="text-gray-500">Carregando produtos...</p>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Package size={56} className="text-gray-700 mb-4" />
                        <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
                        <p className="text-gray-600 text-sm mt-1">Tente buscar por outro termo</p>
                    </div>
                ) : (
                    <>
                        {/* 🔥 Hot Products Section */}
                        {hotProducts.length > 0 && (
                            <section className="mt-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Flame size={20} className="text-orange-500" />
                                    <h2 className="text-lg font-bold text-white">Mais Vendidos</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {hotProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            navigate={navigate}
                                            formatPrice={formatPrice}
                                            calculateDiscount={calculateDiscount}
                                            badge="hot"
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* ⚡ New Products Section */}
                        {newProducts.length > 0 && (
                            <section className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap size={20} className="text-gold-500" />
                                    <h2 className="text-lg font-bold text-white">Novidades</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {newProducts.map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            navigate={navigate}
                                            formatPrice={formatPrice}
                                            calculateDiscount={calculateDiscount}
                                            badge="new"
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* 📦 All Products */}
                        {allProducts.length > 8 && (
                            <section className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <ShoppingBag size={20} className="text-gray-400" />
                                    <h2 className="text-lg font-bold text-white">Todos os Produtos</h2>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {allProducts.slice(8).map((product) => (
                                        <ProductCard
                                            key={product.id}
                                            product={product}
                                            navigate={navigate}
                                            formatPrice={formatPrice}
                                            calculateDiscount={calculateDiscount}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Premium Product Card Component
interface ProductCardProps {
    product: Product;
    navigate: (path: string) => void;
    formatPrice: (price: number) => string;
    calculateDiscount: (original: number, discount: number) => number;
    badge?: 'hot' | 'new';
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    navigate,
    formatPrice,
    calculateDiscount,
    badge
}) => {
    const hasDiscount = product.priceOriginal > product.priceDiscount;
    const discountPercent = hasDiscount ? calculateDiscount(product.priceOriginal, product.priceDiscount) : 0;
    const isService = product.productType === ProductType.SERVICE;

    return (
        <Card
            onClick={() => navigate(`/loja/produto/${product.id}`)}
            className="overflow-hidden cursor-pointer group bg-obsidian-900/60 hover:bg-obsidian-800 transition-all duration-300 border border-obsidian-800 hover:border-gold-500/40 hover:shadow-xl hover:shadow-gold-500/10 hover:-translate-y-1"
        >
            {/* Product Image */}
            <div className="relative h-36 bg-gradient-to-br from-obsidian-900 to-obsidian-800 overflow-hidden">
                <img
                    src={product.imageUrl || 'https://placehold.co/400x300/1a1a1a/d4af37?text=Produto'}
                    alt={product.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/400x300/1a1a1a/d4af37?text=Produto';
                    }}
                />

                {/* Service Badge */}
                {isService && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Wrench size={10} /> SERVIÇO
                    </div>
                )}

                {/* Discount Badge - Only for products */}
                {hasDiscount && !isService && (
                    <div className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                        -{discountPercent}% OFF
                    </div>
                )}

                {/* Hot/New Badge */}
                {badge === 'hot' && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Flame size={10} /> TOP
                    </div>
                )}
                {badge === 'new' && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-gold-600 to-amber-500 text-black text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <Zap size={10} /> NOVO
                    </div>
                )}

                {/* Service: Member Discount Badge */}
                {isService && hasDiscount && (
                    <div className="absolute bottom-2 left-2 bg-gradient-to-r from-gold-600 to-amber-500 text-black text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                        <Percent size={10} /> {discountPercent}% ASSOCIADO
                    </div>
                )}

                {/* Product: Free Shipping Badge */}
                {!isService && (
                    <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded">
                        FRETE GRÁTIS
                    </div>
                )}
            </div>

            {/* Product Info */}
            <div className="p-3">
                {/* Partner Name */}
                <p className="text-[10px] text-gold-500/80 uppercase tracking-widest mb-1 truncate">
                    {product.partnerName}
                </p>

                {/* Title */}
                <h3 className="font-medium text-white text-sm leading-tight line-clamp-2 mb-2 min-h-[2.5rem]">
                    {product.title}
                </h3>

                {/* Price Section */}
                <div className="space-y-0.5">
                    {hasDiscount && (
                        <span className="text-gray-500 text-xs line-through block">
                            {formatPrice(product.priceOriginal)}
                        </span>
                    )}
                    <div className="flex items-baseline gap-1">
                        <span className="text-gold-500 font-bold text-xl">
                            {formatPrice(product.priceDiscount)}
                        </span>
                    </div>

                    {/* Service: Member exclusive message */}
                    {isService ? (
                        <p className="text-gold-500 text-[10px] font-medium flex items-center gap-1">
                            <Star size={10} className="fill-gold-500" />
                            Exclusivo para associados
                        </p>
                    ) : (
                        /* Product: Installments */
                        <p className="text-emerald-500 text-[10px] font-medium">
                            em até 12x sem juros
                        </p>
                    )}
                </div>

                {/* Stock Warning - Only for products */}
                {!isService && product.stock <= 5 && product.stock > 0 && (
                    <p className="text-orange-400 text-[10px] mt-2 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" />
                        Restam apenas {product.stock}!
                    </p>
                )}
                {!isService && product.stock === 0 && (
                    <p className="text-red-500 text-[10px] mt-2 font-medium">Esgotado</p>
                )}
            </div>
        </Card>
    );
};

export default StorePage;
