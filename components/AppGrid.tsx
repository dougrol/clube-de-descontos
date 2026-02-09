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
            {/* Circular Icon with Gradient Border */}
            <div className="relative">
                {/* Animated glow on hover */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 opacity-0 group-hover:opacity-100 blur-xl transition-all duration-500 scale-75 group-hover:scale-100"></div>

                {/* Outer gradient ring */}
                <div className="relative w-[72px] h-[72px] md:w-20 md:h-20 p-[2px] rounded-full bg-gradient-to-br from-white/20 via-gold-500/30 to-white/5 group-hover:from-gold-400 group-hover:via-gold-500 group-hover:to-gold-600 transition-all duration-300">
                    {/* Inner circle with icon */}
                    <div className="w-full h-full rounded-full bg-obsidian-900 flex items-center justify-center group-hover:bg-obsidian-800 transition-all duration-300 relative overflow-hidden">
                        {/* Shine effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 translate-x-[-100%] group-hover:translate-x-[100%] transition-all duration-700"></div>

                        <Icon className={`w-7 h-7 md:w-8 md:h-8 ${color} relative z-10 group-hover:scale-110 group-active:scale-95 transition-transform duration-300`} />
                    </div>
                </div>
            </div>

            <span className="text-xs md:text-sm font-medium text-gray-400 group-hover:text-white text-center leading-tight max-w-[80px] transition-colors duration-300">
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
