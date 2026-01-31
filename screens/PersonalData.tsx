import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Calendar, MapPin, Shield, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../services/supabaseClient';
import { UserRole } from '../types';

interface UserData {
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    created_at: string;
    association_name?: string;
    role: string;
}

interface PersonalDataProps {
    userRole: UserRole;
}

const PersonalData: React.FC<PersonalDataProps> = ({ userRole }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from('users')
                    .select(`
                        name,
                        email,
                        phone,
                        cpf,
                        created_at,
                        role,
                        association:associations(name)
                    `)
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setUserData({
                        name: data.name || user.user_metadata?.name || 'Não informado',
                        email: data.email || user.email || 'Não informado',
                        phone: data.phone,
                        cpf: data.cpf,
                        created_at: data.created_at || user.created_at || new Date().toISOString(),
                        association_name: (data.association as any)?.name,
                        role: data.role || 'USER'
                    });
                } else {
                    // Fallback to auth user data
                    setUserData({
                        name: user.user_metadata?.name || 'Não informado',
                        email: user.email || 'Não informado',
                        created_at: user.created_at || new Date().toISOString(),
                        role: userRole
                    });
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setUserData({
                    name: user.user_metadata?.name || 'Não informado',
                    email: user.email || 'Não informado',
                    created_at: user.created_at || new Date().toISOString(),
                    role: userRole
                });
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.id, userRole]);

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return { label: 'Administrador', color: 'bg-red-500/20 text-red-400', icon: Shield };
            case 'PARTNER':
                return { label: 'Parceiro', color: 'bg-blue-500/20 text-blue-400', icon: Crown };
            default:
                return { label: 'Associado', color: 'bg-gold-500/20 text-gold-400', icon: User };
        }
    };

    const formatCPF = (cpf: string) => {
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    const formatPhone = (phone: string) => {
        if (phone.length === 11) {
            return phone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return phone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    };

    const badge = getRoleBadge(userData?.role || 'USER');
    const BadgeIcon = badge.icon;

    return (
        <div className="min-h-screen bg-black animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center p-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="flex-1 text-center text-white text-sm font-bold tracking-[0.2em] uppercase">Dados Pessoais</h1>
                    <div className="w-10" />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-500 text-sm">Carregando dados...</p>
                </div>
            ) : (
                <div className="p-4 pb-24 space-y-4">
                    {/* Role Badge */}
                    <div className="flex justify-center mb-6">
                        <span className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${badge.color}`}>
                            <BadgeIcon size={16} />
                            {badge.label}
                        </span>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-3">
                        {/* Name */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                    <User size={20} className="text-gold-500" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Nome Completo</p>
                                    <p className="text-white font-medium">{userData?.name}</p>
                                </div>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                    <Mail size={20} className="text-gold-500" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">E-mail</p>
                                    <p className="text-white font-medium break-all">{userData?.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        {userData?.phone && (
                            <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                        <Phone size={20} className="text-gold-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-widest">Telefone</p>
                                        <p className="text-white font-medium">{formatPhone(userData.phone)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* CPF */}
                        {userData?.cpf && (
                            <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                        <Shield size={20} className="text-gold-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-widest">CPF</p>
                                        <p className="text-white font-medium">{formatCPF(userData.cpf)}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Association */}
                        {userData?.association_name && (
                            <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                        <MapPin size={20} className="text-gold-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-[10px] uppercase tracking-widest">Associação</p>
                                        <p className="text-white font-medium">{userData.association_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Member Since */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center">
                                    <Calendar size={20} className="text-gold-500" />
                                </div>
                                <div>
                                    <p className="text-gray-500 text-[10px] uppercase tracking-widest">Membro Desde</p>
                                    <p className="text-white font-medium">
                                        {new Date(userData?.created_at || '').toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Note */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-gray-500 text-xs text-center">
                            🔒 Seus dados estão protegidos de acordo com a LGPD
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalData;
