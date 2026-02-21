import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, ShoppingBag } from 'lucide-react';
import { getAffiliateProducts, AffiliateProduct } from '../services/affiliate';
import AffiliateProductCard from '../components/affiliate/AffiliateProductCard';

const Offers: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      const data = await getAffiliateProducts();
      setProducts(data || []);
      setLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black pb-24 animate-fade-in relative">
      {/* Background Noise/Gradient */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-obsidian-900/40 via-black to-black z-0"></div>

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-16 max-w-7xl mx-auto">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-full flex items-center justify-center text-theme-muted hover:text-theme-text hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          
          <h1 className="text-sm font-bold text-theme-text uppercase tracking-[0.2em]">
            Ofertas Exclusivas
          </h1>
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="relative z-10 px-4 py-6 max-w-7xl mx-auto">
        {/* Header Hero */}
        <div className="mb-8 text-center space-y-2">
           <div className="inline-flex items-center justify-center p-3 bg-gold-500/10 rounded-full mb-4 ring-1 ring-gold-500/30">
              <ShoppingBag className="text-gold-500" size={24} />
           </div>
           <h2 className="text-2xl md:text-3xl font-bold text-theme-text font-serif">
             Achadinhos <span className="text-gold-500">Shopee</span>
           </h2>
           <p className="text-theme-muted text-sm max-w-md mx-auto">
             Seleção especial de produtos com descontos imperdíveis para você aproveitar.
           </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="animate-spin text-gold-500" size={40} />
            <p className="text-theme-muted text-xs uppercase tracking-widest">Carregando ofertas...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-2xl bg-white/5 border border-white/10 border-dashed">
            <p className="text-theme-muted mb-2">Sem ofertas no momento.</p>
            <p className="text-xs text-gray-600">Volte em breve para novidades!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <AffiliateProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Disclaimer Footer */}
        <div className="mt-12 pt-8 border-t border-white/5 text-center px-4">
          <p className="text-[10px] text-theme-muted uppercase tracking-wider leading-relaxed">
            Ao clicar em comprar, você será redirecionado para a Shopee.<br/>
            Somos parceiros afiliados e podemos receber comissão por compras qualificadas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Offers;
