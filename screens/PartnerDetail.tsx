import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Info, CheckCircle, Globe, Copy } from 'lucide-react';
import { Button, Card, Badge, QRCodeDisplay } from '../components/ui';
import { fetchPartnerById } from '../services/partners';
import { Partner } from '../types';
import { generateCoupon, Coupon } from '../services/couponService';
import { useAuth } from '../contexts/AuthContext';

const PartnerDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCoupon, setShowCoupon] = useState(false);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPartnerById(id).then(data => {
        setPartner(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleRedeemCoupon = async () => {
    if (!partner || !user) return;

    setGeneratingCoupon(true);

    const userName = user.user_metadata?.name || user.email || 'Cliente';
    const newCoupon = await generateCoupon(
      user.id,
      userName,
      partner.id,
      partner.name,
      partner.benefit
    );

    if (newCoupon) {
      setCoupon(newCoupon);
      setShowCoupon(true);
    } else {
      alert('Erro ao gerar cupom. Tente novamente.');
    }

    setGeneratingCoupon(false);
  };

  const handleCopyCode = () => {
    if (coupon) {
      navigator.clipboard.writeText(coupon.code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black text-gold-500">Carregando...</div>;
  if (!partner) return <div className="p-10 text-center text-white bg-black h-screen">Parceiro não encontrado</div>;

  return (
    <div className="min-h-screen bg-black pb-24 relative animate-fade-in">
      {/* Header Image */}
      <div className="relative h-72 w-full">
        <div className="absolute top-4 left-4 z-20">
          <button
            onClick={() => navigate(-1)}
            className="h-10 w-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
        </div>
        <img src={partner.coverUrl} className="w-full h-full object-cover" alt="Cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

        {/* Logo Overlay */}
        <div className="absolute -bottom-10 left-5 h-24 w-24 bg-white rounded-2xl p-2 shadow-xl border-4 border-black">
          <img src={partner.logoUrl} className="w-full h-full object-contain" alt="Logo" />
        </div>
      </div>

      {/* Content */}
      <div className="mt-12 px-5 space-y-6">
        <div>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl font-bold text-white mb-1 w-3/4 leading-tight">{partner.name}</h1>
            <Badge>{partner.category}</Badge>
          </div>

          {partner.isOnline ? (
            <div className="flex items-center text-gray-400 text-sm gap-1 mt-1">
              <Globe size={14} className="text-gold-500" /> Loja Online
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center text-gray-400 text-sm gap-1">
                <MapPin size={14} className="text-gold-500" /> {partner.address || partner.city}
              </div>
              <Button
                variant="outline"
                className="h-8 text-xs w-auto self-start px-4 border-gold-500/50 text-gold-500 hover:bg-gold-500 hover:text-black"
                onClick={() => {
                  const destination = partner.coordinates
                    ? `${partner.coordinates.lat},${partner.coordinates.lng}`
                    : `${partner.address}, ${partner.city}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`, '_blank');
                }}
              >
                TRAÇAR ROTA
              </Button>
            </div>
          )}
        </div>

        <Card className="bg-gradient-to-r from-obsidian-900 to-obsidian-800 border-gold-500/30">
          <div className="text-center p-2">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Benefício Exclusivo</p>
            <p className="text-3xl font-bold text-gold-500">{partner.benefit}</p>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="flex gap-3">
            <Info className="text-gray-500 flex-shrink-0 mt-1" size={18} />
            <div>
              <h3 className="font-semibold text-white text-sm">Regras de Uso</h3>
              <p className="text-gray-400 text-sm leading-relaxed mt-1">{partner.fullRules}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <CheckCircle className="text-gray-500 flex-shrink-0 mt-1" size={18} />
            <div>
              <h3 className="font-semibold text-white text-sm">Como usar</h3>
              <p className="text-gray-400 text-sm leading-relaxed mt-1">
                {partner.isOnline
                  ? 'Clique em resgatar para gerar o código promocional e use no site do parceiro.'
                  : 'Apresente o QR Code gerado abaixo no momento do pagamento. O parceiro irá escanear para validar seu desconto.'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          {!showCoupon ? (
            <Button onClick={handleRedeemCoupon} isLoading={generatingCoupon}>
              RESGATAR BENEFÍCIO
            </Button>
          ) : coupon ? (
            partner.isOnline ? (
              // Online Partner - Show promotional code
              <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center animate-slide-up shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                <h3 className="text-black font-bold text-lg mb-2">
                  Código Promocional
                </h3>
                <div
                  className="w-full bg-gray-100 p-4 rounded-lg flex items-center justify-between mb-4 border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                  onClick={handleCopyCode}
                >
                  <span className="font-mono text-xl font-bold text-black tracking-widest">{coupon.code}</span>
                  <Copy size={20} className={codeCopied ? 'text-green-500' : 'text-gray-500'} />
                </div>
                {codeCopied && (
                  <p className="text-green-600 text-sm font-medium mb-2">Código copiado!</p>
                )}
                <p className="text-gray-500 text-xs text-center">
                  Copie o código e aplique no carrinho de compras.
                </p>
                {partner.website && (
                  <Button variant="primary" className="mt-4 h-12" onClick={() => window.open(partner.website, '_blank')}>
                    IR PARA O SITE
                  </Button>
                )}
              </div>
            ) : (
              // Physical Partner - Show QR Code
              <QRCodeDisplay
                code={coupon.code}
                expiresAt={coupon.expires_at}
                benefit={partner.benefit}
                partnerName={partner.name}
              />
            )
          ) : (
            <div className="text-center text-red-500 p-4">
              Erro ao gerar cupom. Tente novamente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PartnerDetail;