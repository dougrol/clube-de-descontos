import React from 'react';
import { trackAffiliateClick, formatBRL, AffiliateProduct } from '../../services/affiliate';
import { Loader2 } from 'lucide-react';

interface AffiliateProductCardProps {
  product: AffiliateProduct;
}

const AffiliateProductCard: React.FC<AffiliateProductCardProps> = ({ product }) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    // Optimistic navigation - try to track but don't block navigation too long
    try {
      await trackAffiliateClick(product.id);
    } catch (error) {
      console.error("Failed to track click", error);
    } finally {
      setIsLoading(false);
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-white/10 bg-obsidian-900 overflow-hidden shadow-lg shadow-black/50 hover:border-white/20 hover:shadow-gold-500/5 transition-all duration-300 h-full">
      {/* Image Container */}
      <div className="relative h-32 md:h-40 w-full overflow-hidden bg-white/5">
        <img
          src={product.image_url}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/400x400/1a1a1a/d4af37?text=Oferta';
          }}
        />
        {/* Badge Category */}
        {product.category && (
          <div className="absolute top-2 left-2 z-10">
            <span className="inline-flex items-center rounded-md bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white border border-white/10">
              {product.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Title */}
        <h3 className="line-clamp-2 text-sm font-bold text-white mb-2 leading-snug min-h-[2.5rem]" title={product.title}>
          {product.title}
        </h3>

        {/* Price */}
        <div className="mt-auto mb-3">
          <p className="text-xs text-gray-400">A partir de</p>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gold-500">
              {formatBRL(product.price)}
            </span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleClick}
          disabled={isLoading}
          className="w-full h-10 rounded-lg bg-signal-500 hover:bg-signal-600 active:scale-95 text-white text-xs font-bold tracking-wide uppercase transition-all flex items-center justify-center gap-2 shadow-lg shadow-signal-500/20"
        >
          {isLoading ? <Loader2 className="animate-spin" size={14} /> : 'COMPRAR COM DESCONTO'}
        </button>
      </div>
    </div>
  );
};

export default AffiliateProductCard;
