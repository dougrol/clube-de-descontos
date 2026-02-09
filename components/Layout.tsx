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
    { icon: <Home size={22} />, label: 'Home', path: '/home' },
    { icon: <Grid size={22} />, label: 'Clube', path: '/benefits' },
    { icon: <ShoppingBag size={22} />, label: 'Loja', path: '/loja' },
    { icon: <Instagram size={22} />, label: 'Social', path: '/social' },
    { icon: <User size={22} />, label: 'Perfil', path: '/profile' },
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

      {/* Floating Dock Navigation - Only show if not hidden */}
      {!hideNav && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-2 py-2 bg-obsidian-900/80 backdrop-blur-xl border border-white/10 rounded-full shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/home' && location.pathname.startsWith(item.path));
              const isAdminButton = item.path === '/admin';

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative group flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${isActive
                    ? isAdminButton
                      ? 'bg-gold-500 text-obsidian-950 shadow-[0_0_20px_rgba(212,175,55,0.4)] scale-110'
                      : 'bg-signal-500 text-white shadow-[0_0_20px_rgba(255,69,0,0.4)] scale-110'
                    : isAdminButton
                      ? 'text-gold-500 hover:text-gold-400 hover:bg-gold-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {item.icon}

                  {/* Tooltip for Desktop */}
                  <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-obsidian-800 text-white text-[10px] px-2 py-1 rounded border border-white/10 whitespace-nowrap hidden md:block">
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