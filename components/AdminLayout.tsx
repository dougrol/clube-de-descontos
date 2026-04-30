import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileSpreadsheet, LogOut, ShieldAlert, BarChart3, Package, Type, Ticket, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { UserRole } from '../types';

const AdminLayout: React.FC = () => {
    const { session, role, loading, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    
    const [isAdminVerified, setIsAdminVerified] = useState<boolean>(false);
    const [isVerifying, setIsVerifying] = useState<boolean>(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

    useEffect(() => {
        const verifyAdminStatus = async () => {
            if (!session?.user) {
                setIsVerifying(false);
                return;
            }

            try {
                // Verificar na tabela admin_users se o usuário atual é admin e está ativo
                const { data, error } = await supabase
                    .from('admin_users')
                    .select('id, ativo')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                if (error) {
                    console.error("Erro ao verificar admin_users:", error);
                    setIsAdminVerified(false);
                    showToast("Erro ao verificar permissões.", "error");
                    navigate('/home');
                } else if (!data || !data.ativo) {
                    console.warn("Usuário não encontrado na admin_users ou inativo.", data);
                    setIsAdminVerified(false);
                    showToast("Você não possui permissão de administrador para acessar esta área.", "error");
                    navigate('/home');
                } else {
                    console.log("Admin validado com sucesso:", data);
                    setIsAdminVerified(true);
                }
            } catch (err) {
                console.error("Exceção ao verificar admin:", err);
                setIsAdminVerified(false);
                navigate('/home');
            } finally {
                setIsVerifying(false);
            }
        };

        if (!loading) {
            verifyAdminStatus();
        }
    }, [session, loading, navigate, showToast]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    if (loading || isVerifying) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!session || !isAdminVerified) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
        { name: 'Associados', href: '/admin/associados', icon: Users },
        { name: 'Importações CSV', href: '/admin/importacoes', icon: FileSpreadsheet },
        { name: 'Produtos', href: '/admin/produtos', icon: Package },
        { name: 'Conteúdo', href: '/admin/conteudo', icon: Type },
        { name: 'Cupons', href: '/admin/cupons', icon: Ticket },
        { name: 'Proteção', href: '/admin/protecao', icon: ShieldCheck },
    ];

    const handleLogout = async () => {
        await signOut();
        navigate('/admin/login');
    };

    return (
        <div className="min-h-screen flex bg-black overflow-x-hidden">
            {/* Desktop Sidebar */}
            <aside className="w-64 bg-zinc-950 border-r border-white/5 flex flex-col fixed inset-y-0 z-10 hidden md:flex">
                <div className="h-20 flex items-center px-6 border-b border-white/5 shrink-0">
                    <ShieldAlert className="text-gold-500 mr-3" size={24} />
                    <span className="text-white font-serif font-bold text-lg">Painel Admin</span>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.href);
                        
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigate(item.href)}
                                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${
                                    isActive 
                                    ? 'bg-gold-500/10 text-gold-500 border border-gold-500/20' 
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                <Icon size={20} className="mr-3 shrink-0" />
                                <span className="font-medium text-sm">{item.name}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={20} className="mr-3" />
                        <span className="font-medium text-sm">Sair do Painel</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col relative min-w-0 overflow-x-hidden">
                {/* Mobile header */}
                <div className="md:hidden h-14 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-4 sticky top-0 z-30" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                            className="text-white p-2 bg-white/5 rounded-xl border border-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                        >
                            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <ShieldAlert className="text-gold-500" size={22} />
                        <span className="text-white font-serif font-bold text-base">Painel Admin</span>
                    </div>
                    <button onClick={handleLogout} className="text-red-400 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-red-500/10">
                        <LogOut size={22} />
                    </button>
                </div>
                
                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden fixed inset-0 top-14 z-20 bg-black/95 backdrop-blur-sm flex flex-col border-t border-white/5" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
                        <nav className="flex-1 px-4 pt-4 pb-32 space-y-2 overflow-y-auto overscroll-contain">
                            {navigation.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname.startsWith(item.href);
                                return (
                                    <button
                                        key={item.name}
                                        onClick={() => {
                                            navigate(item.href);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all text-base ${
                                            isActive 
                                            ? 'bg-gold-500 text-black font-bold' 
                                            : 'text-gray-300 hover:text-white bg-white/5 border border-white/5'
                                        }`}
                                    >
                                        <Icon size={22} className="mr-4 shrink-0" />
                                        <span>{item.name}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </div>
                )}

                <div className="p-4 sm:p-5 md:p-8 flex-1 overflow-x-hidden overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
