import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, User, Mail, Phone, Calendar, MapPin, Shield, Crown, Pencil, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
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
    const { showToast } = useToast();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // Editable fields
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');
    const [editCpf, setEditCpf] = useState('');

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
                    const parsed: UserData = {
                        name: data.name || user.user_metadata?.name || 'Não informado',
                        email: data.email || user.email || 'Não informado',
                        phone: data.phone || '',
                        cpf: data.cpf || '',
                        created_at: data.created_at || user.created_at || new Date().toISOString(),
                        association_name: (() => {
                            const assoc = data.association as { name: string } | { name: string }[] | null;
                            if (Array.isArray(assoc)) return assoc[0]?.name;
                            return assoc?.name;
                        })(),
                        role: data.role || 'USER'
                    };
                    setUserData(parsed);
                    setEditName(parsed.name);
                    setEditPhone(parsed.phone || '');
                    setEditCpf(parsed.cpf || '');
                } else {
                    const fallback: UserData = {
                        name: user.user_metadata?.name || 'Não informado',
                        email: user.email || 'Não informado',
                        created_at: user.created_at || new Date().toISOString(),
                        role: userRole
                    };
                    setUserData(fallback);
                    setEditName(fallback.name);
                }
            } catch (err) {
                console.error('Erro ao buscar dados do usuário:', err);
                const fallback: UserData = {
                    name: user.user_metadata?.name || 'Não informado',
                    email: user.email || 'Não informado',
                    created_at: user.created_at || new Date().toISOString(),
                    role: userRole
                };
                setUserData(fallback);
                setEditName(fallback.name);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [user?.id, userRole, user?.user_metadata?.name, user?.email, user?.created_at]);

    const handleSave = async () => {
        if (!user?.id) return;
        setSaving(true);

        try {
            const updates: Record<string, string> = {};
            if (editName.trim()) updates.name = editName.trim();
            if (editPhone.trim()) updates.phone = editPhone.replace(/\D/g, '');
            if (editCpf.trim() && !userData?.cpf) updates.cpf = editCpf.replace(/\D/g, '');

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', user.id);

            if (error) throw error;

            // Also update auth metadata for name
            if (updates.name) {
                await supabase.auth.updateUser({
                    data: { name: updates.name }
                });
            }

            setUserData(prev => prev ? {
                ...prev,
                name: updates.name || prev.name,
                phone: updates.phone || prev.phone,
                cpf: updates.cpf || prev.cpf,
            } : prev);

            setEditing(false);
            showToast('Dados atualizados com sucesso!', 'success');
        } catch (err) {
            console.error('Erro ao salvar:', err);
            showToast('Erro ao salvar dados. Tente novamente.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditName(userData?.name || '');
        setEditPhone(userData?.phone || '');
        setEditCpf(userData?.cpf || '');
        setEditing(false);
    };

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
        const digits = cpf.replace(/\D/g, '');
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    };

    const formatPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 2) return digits;
        if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    };

    const badge = getRoleBadge(userData?.role || 'USER');
    const BadgeIcon = badge.icon;

    return (
        <div className="min-h-screen bg-black animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-black/90 backdrop-blur-lg border-b border-white/5">
                <div className="flex items-center p-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-theme-muted hover:text-theme-text">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="flex-1 text-center text-theme-text text-sm font-bold tracking-[0.2em] uppercase">Dados Pessoais</h1>
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="p-2 text-gold-500 hover:text-gold-400 transition-colors"
                        >
                            <Pencil size={18} />
                        </button>
                    ) : (
                        <div className="flex gap-1">
                            <button
                                onClick={handleCancel}
                                className="p-2 text-red-400 hover:text-red-300 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-theme-muted text-sm">Carregando dados...</p>
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
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <User size={20} className="text-gold-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-theme-muted text-[10px] uppercase tracking-widest">Nome Completo</p>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full bg-transparent text-theme-text font-medium border-b border-gold-500/50 focus:border-gold-500 outline-none py-1 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-theme-text font-medium">{userData?.name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Email (read-only) */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Mail size={20} className="text-gold-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-theme-muted text-[10px] uppercase tracking-widest">E-mail</p>
                                    <p className="text-theme-text font-medium break-all">{userData?.email}</p>
                                    {editing && <p className="text-theme-muted text-[10px] mt-1">E-mail não pode ser alterado</p>}
                                </div>
                            </div>
                        </div>

                        {/* Phone */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Phone size={20} className="text-gold-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-theme-muted text-[10px] uppercase tracking-widest">Telefone</p>
                                    {editing ? (
                                        <input
                                            type="tel"
                                            value={formatPhone(editPhone)}
                                            onChange={(e) => setEditPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            placeholder="(00) 00000-0000"
                                            className="w-full bg-transparent text-theme-text font-medium border-b border-gold-500/50 focus:border-gold-500 outline-none py-1 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-theme-text font-medium">
                                            {userData?.phone ? formatPhone(userData.phone) : <span className="text-theme-muted italic">Não informado</span>}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CPF */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Shield size={20} className="text-gold-500" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-theme-muted text-[10px] uppercase tracking-widest">CPF</p>
                                    {editing && !userData?.cpf ? (
                                        <input
                                            type="text"
                                            value={formatCPF(editCpf)}
                                            onChange={(e) => setEditCpf(e.target.value.replace(/\D/g, '').slice(0, 11))}
                                            placeholder="000.000.000-00"
                                            className="w-full bg-transparent text-theme-text font-medium border-b border-gold-500/50 focus:border-gold-500 outline-none py-1 transition-colors"
                                        />
                                    ) : (
                                        <p className="text-theme-text font-medium">
                                            {userData?.cpf ? formatCPF(userData.cpf) : <span className="text-theme-muted italic">Não informado</span>}
                                        </p>
                                    )}
                                    {editing && userData?.cpf && <p className="text-theme-muted text-[10px] mt-1">CPF não pode ser alterado</p>}
                                </div>
                            </div>
                        </div>

                        {/* Association */}
                        {userData?.association_name && (
                            <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin size={20} className="text-gold-500" />
                                    </div>
                                    <div>
                                        <p className="text-theme-muted text-[10px] uppercase tracking-widest">Associação</p>
                                        <p className="text-theme-text font-medium">{userData.association_name}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Member Since */}
                        <div className="bg-obsidian-900 border border-white/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0">
                                    <Calendar size={20} className="text-gold-500" />
                                </div>
                                <div>
                                    <p className="text-theme-muted text-[10px] uppercase tracking-widest">Membro Desde</p>
                                    <p className="text-theme-text font-medium">
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

                    {/* Save Button (when editing) */}
                    {editing && (
                        <div className="mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                {saving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    )}

                    {/* Privacy Note */}
                    <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-theme-muted text-xs text-center">
                            🔒 Seus dados estão protegidos de acordo com a LGPD
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonalData;
