import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Grid, User, Instagram, ShieldCheck, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Hide nav on auth/onboarding pages only - admin can navigate the full app
  const hideNav = ['/', '/login', '/splash', '/register-partner', '/admin-login', '/register', '/forgot-password', '/admin-forgot-password', '/reset-password', '/tc-portal-2024'].includes(location.pathname);

  // Base nav items for all users
  const baseNavItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/home' },
    { icon: <Grid size={20} />, label: 'Clube', path: '/benefits' },
    { icon: <ShoppingBag size={20} />, label: 'Loja', path: '/loja' },
    { icon: <ShieldCheck size={20} />, label: 'Proteção', path: '/protection' },
    { icon: <User size={20} />, label: 'Perfil', path: '/profile' },
  ];

  // Add admin panel link for admin users
  const navItems = role === UserRole.ADMIN
    ? [...baseNavItems, { icon: <ShieldCheck size={22} />, label: 'Admin', path: '/admin' }]
    : baseNavItems;

  return (
    <div className="bg-transparent min-h-screen text-white font-sans w-full relative overflow-x-hidden selection:bg-signal-500/30 selection:text-signal-500">
      <main className="min-h-screen w-full">
        {children}
      </main>

      {/* Mobile Fixed Bottom Bar - Only show if not hidden */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-obsidian-950/90 backdrop-blur-xl border-t border-white/5 pb-safe safe-area-bottom">
          <div className="flex items-center justify-around px-2 py-3">
            {navItems.map((item) => {
              // Exact match for home, startsWith for others to catch sub-routes
              const isActive = item.path === '/home'
                ? location.pathname === '/home'
                : location.pathname.startsWith(item.path);

              const isAdminButton = item.path === '/admin';

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center w-full gap-1 transition-all duration-300 ${isActive ? 'text-gold-500' : 'text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {/* Indicator Line for Active State (Top) */}
                  {isActive && (
                    <motion.div
                      layoutId="bottomBarIndicator"
                      className="absolute -top-3 w-10 h-0.5 bg-gold-500 shadow-[0_0_10px_#D4AF37]"
                    />
                  )}

                  <div className={`transition-transform duration-200 ${isActive ? '-translate-y-1' : ''}`}>
                    {item.icon}
                  </div>

                  <span className={`text-[10px] font-medium tracking-wide transition-opacity duration-200 ${isActive ? 'opacity-100 font-bold' : 'opacity-70'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;