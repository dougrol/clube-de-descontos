import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Gem, Users, Wallet, Headphones, Tag, ChevronRight } from 'lucide-react';

interface GridItemProps {
    icon: React.ElementType;
    label: string;
    path: string;
    color?: string;
    isExternal?: boolean;
}

const GridItem: React.FC<GridItemProps> = ({ icon: Icon, label, path, color = "text-gold-500" }) => {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-3 cursor-pointer group w-full"
        >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-obsidian-900 border border-white/5 shadow-lg flex items-center justify-center group-hover:border-gold-500/50 group-hover:shadow-gold-500/10 group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <Icon className={`w-7 h-7 md:w-9 md:h-9 ${color} relative z-10 group-hover:scale-110 transition-transform duration-300`} />
            </div>
            <span className="text-xs md:text-sm font-medium text-gray-300 group-hover:text-white text-center leading-tight max-w-[80px]">
                {label}
            </span>
        </div>
    );
};

export const AppGrid: React.FC = () => {
    const items = [
        { icon: ShoppingBag, label: "Loja", path: "/loja", color: "text-white" }, // White for primary action
        { icon: ShieldCheck, label: "Proteção", path: "/protection" },
        { icon: Tag, label: "Clube", path: "/benefits" },
        { icon: Wallet, label: "Financeiro", path: "/partnership" },
        { icon: Gem, label: "Consultoria", path: "/consultancy" },
        { icon: Users, label: "Quem Somos", path: "/about" },
        { icon: Headphones, label: "Ajuda", path: "/social" }, // Using social as support/contact for now
    ];

    return (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-y-8 gap-x-2 w-full px-2">
            {items.map((item, idx) => (
                <GridItem key={idx} {...item} />
            ))}
        </div>
    );
};
