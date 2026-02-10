import React, { useState, useEffect } from 'react';
import { Search, MapPin, Tag, Radar, Loader2, Zap } from 'lucide-react';
import { Card, Input } from '../components/ui';
import { PartnerCategory, Partner } from '../types';
import { useNavigate } from 'react-router-dom';
import { fetchPartners } from '../services/partners';

const Benefits: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isScanning, setIsScanning] = useState(false); // New state for Radar effect
  const [isNearMeActive, setIsNearMeActive] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners().then(data => {
      setPartners(data);
      setLoading(false);
    });
  }, []);

  const categories = ['Todos', ...Object.values(PartnerCategory)];

  // Haversine formula to calculate distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const handleRadarClick = () => {
    if (isNearMeActive) {
      // Toggle off
      setIsNearMeActive(false);
      setUserLocation(null);
      setSelectedCategory('Todos'); // Reset category
      return;
    }

    setIsLoadingLocation(true);

    // Simulate finding location then scanning
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLoadingLocation(false);
          setIsScanning(true); // Start Scanning Animation

          // Simulate Scan Delay
          setTimeout(() => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setIsScanning(false);
            setIsNearMeActive(true);

            // Auto-select Automotive for "Radar" context (Gas stations etc)
            setSelectedCategory(PartnerCategory.AUTOMOTIVE);
          }, 2500);
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Não foi possível obter sua localização. Verifique as permissões do navegador.");
          setIsLoadingLocation(false);
        }
      );
    } else {
      alert("Geolocalização não é suportada neste navegador.");
      setIsLoadingLocation(false);
    }
  };

  // 1. Filter by text and category
  let filteredList = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 2. Sort by distance if "Near Me" is active
  if (isNearMeActive && userLocation) {
    filteredList = filteredList.sort((a, b) => {
      // If partner doesn't have coordinates, push to bottom
      if (!a.coordinates) return 1;
      if (!b.coordinates) return -1;

      const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
      const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
      return distA - distB;
    });
  }

  return (
    <div className="pb-24 min-h-screen bg-black animate-fade-in relative selection:bg-gold-500/30">

      {/* Radar Scanning Overlay */}
      {isScanning && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-md">
          <div className="relative flex items-center justify-center">
            {/* Ripples */}
            <div className="absolute h-64 w-64 border border-gold-500/30 rounded-full animate-ping [animation-duration:2s]"></div>
            <div className="absolute h-48 w-48 border border-gold-500/50 rounded-full animate-ping [animation-duration:2s] [animation-delay:0.3s]"></div>
            <div className="absolute h-32 w-32 border border-gold-500/70 rounded-full animate-ping [animation-duration:2s] [animation-delay:0.6s]"></div>

            {/* Core */}
            <div className="relative z-10 bg-gold-500 text-black p-4 rounded-full shadow-[0_0_50px_rgba(212,175,55,0.6)]">
              <Radar size={48} className="animate-spin" />
            </div>
          </div>
          <h2 className="text-white font-bold text-xl mt-8 animate-pulse">Rastreando Ofertas...</h2>
          <p className="text-gold-500 text-sm mt-2 uppercase tracking-widest font-medium">Buscando Postos e Serviços</p>
        </div>
      )}

      {/* --- HERO SECTION --- */}
      <div className="relative h-[250px] md:h-[320px] w-full overflow-hidden mb-8 group">
        <div className="absolute inset-0 bg-obsidian-950/50 z-10"></div>

        {/* Premium Cover Image */}
        <img
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=3000&auto=format&fit=crop"
          alt="Clube de Vantagens Luxo"
          loading="eager"
          // @ts-ignore
          fetchPriority="high"
          className="w-full h-full object-cover scale-105 group-hover:scale-110 transition-transform duration-1000 ease-in-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-20"></div>

        {/* Hero Content */}
        <div className="absolute bottom-6 left-6 right-6 z-30">
          <div className="flex items-center gap-2 mb-2 opacity-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <span className="bg-gold-500/20 text-gold-500 border border-gold-500/30 px-3 py-1 rounded text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
              Exclusive Member
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight opacity-0 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            CLUBE DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">VANTAGENS</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base mt-2 max-w-lg opacity-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            Descontos exclusivos em parceiros selecionados. Viva a experiência Tavares Car.
          </p>
        </div>
      </div>

      <div className="px-5">

        {/* Search & Filter */}
        <div className="sticky top-4 bg-black/80 backdrop-blur-md z-40 py-3 px-3 -mx-2 rounded-xl border border-white/10 shadow-2xl mb-8">
          <div className="space-y-4">
            <Input
              placeholder="Buscar parceiro ou cidade..."
              icon={<Search size={18} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-obsidian-900 border-obsidian-700 focus:border-gold-500 transition-colors"
            />

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide items-center -mx-1 px-1">
              {/* Radar Button */}
              <button
                onClick={handleRadarClick}
                disabled={isLoadingLocation}
                className={`flex items-center justify-center gap-2 px-4 h-10 rounded-full text-xs font-bold whitespace-nowrap transition-all border active:scale-95 shrink-0 ${isNearMeActive
                  ? 'bg-gold-500 text-black border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                  : 'bg-obsidian-800 text-gold-500 border-gold-500/30 hover:bg-gold-500/10 hover:border-gold-500'
                  }`}
              >
                {isLoadingLocation ? (
                  <Loader2 size={14} className="animate-spin shrink-0" />
                ) : (
                  <Radar
                    size={14}
                    className={`shrink-0 transition-all ${isNearMeActive ? "animate-[spin_3s_linear_infinite]" : ""}`}
                  />
                )}
                <span className="hidden sm:inline">{isNearMeActive ? "Radar Ativo" : "Radar de Ofertas"}</span>
                <span className="sm:hidden">{isNearMeActive ? "Ativo" : "Radar"}</span>
              </button>

              <div className="w-px h-5 bg-gray-700 shrink-0" />

              {/* Categories - Fixed width buttons */}
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 sm:px-4 h-10 rounded-full text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 active:scale-95 shrink-0 ${selectedCategory === cat
                    ? 'bg-gold-500 text-black border border-gold-500 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                    : 'bg-obsidian-800 text-gray-400 border border-obsidian-700 hover:border-gold-500/50 hover:text-white'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-20 text-gold-500">
              <Loader2 className="animate-spin" size={32} />
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <p>Nenhum parceiro encontrado.</p>
            </div>
          ) : (
            filteredList.map((partner) => {
              // Calculate distance for display if active
              let distanceDisplay = null;
              if (isNearMeActive && userLocation && partner.coordinates) {
                const dist = calculateDistance(userLocation.lat, userLocation.lng, partner.coordinates.lat, partner.coordinates.lng);
                distanceDisplay = dist < 1 ? `${(dist * 1000).toFixed(0)}m` : `${dist.toFixed(1)}km`;
              }

              return (
                <Card key={partner.id} onClick={() => navigate(`/benefits/${partner.id}`)} className="flex gap-4 p-3 group border-l-4 border-l-transparent hover:border-l-gold-500 transition-all bg-obsidian-900/50 hover:bg-obsidian-900 border-y border-y-transparent hover:border-y-white/5 cursor-pointer">
                  <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img
                      src={partner.logoUrl || 'https://placehold.co/200x200/1a1a1a/d4af37?text=TC'}
                      alt={partner.name}
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://placehold.co/200x200/1a1a1a/d4af37?text=TC';
                      }}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {distanceDisplay && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gold-500 text-black text-[10px] text-center py-1 font-bold shadow-md">
                        {distanceDisplay}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white text-base leading-tight mb-1">{partner.name}</h3>
                        {/* Highlight Best Conditions */}
                        {(partner.benefit.includes("Grátis") || partner.benefit.includes("30%") || partner.benefit.includes("0,15")) && (
                          <Zap size={14} className="text-gold-500 fill-gold-500 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center text-gray-500 text-xs gap-1 mb-2">
                        <MapPin size={12} /> {partner.city}
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">{partner.description}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-gold-500 text-xs font-bold bg-gold-500/10 px-2 py-1 rounded flex items-center gap-1 border border-gold-500/20">
                        <Tag size={12} /> {partner.benefit}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Benefits;