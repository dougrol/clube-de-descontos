import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileSpreadsheet, LogOut, ShieldAlert, BarChart3, Package, Type, Ticket, ShieldCheck } from 'lucide-react';
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
                    .maybeSingle(); // Changed from single() to maybeSingle() to avoid PGRST116 on 0 rows

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

    if (loading || isVerifying) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Rely entirely on admin_users table for admin access, ignore old role
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
        <div className="min-h-screen flex bg-black">
            {/* Sidebar */}
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
            <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
                {/* Mobile header */}
                <div className="md:hidden h-16 bg-zinc-950 border-b border-white/5 flex items-center justify-between px-4">
                    <div className="flex items-center">
                        <ShieldAlert className="text-gold-500 mr-2" size={20} />
                        <span className="text-white font-serif font-bold">Painel Admin</span>
                    </div>
                    {/* Simplified mobile menu or just logout */}
                    <button onClick={handleLogout} className="text-red-400 p-2">
                        <LogOut size={20} />
                    </button>
                </div>
                
                {/* Mobile horizontal scroll nav */}
                <div className="md:hidden bg-zinc-900 border-b border-white/5 overflow-x-auto scrollbar-hide">
                    <div className="flex p-2 min-w-max gap-2">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname.startsWith(item.href);
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => navigate(item.href)}
                                    className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                                        isActive 
                                        ? 'bg-gold-500 text-black' 
                                        : 'text-gray-400 hover:text-white bg-white/5'
                                    }`}
                                >
                                    <Icon size={14} className="mr-1.5" />
                                    {item.name}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="p-4 md:p-8 flex-1 overflow-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
