import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Users, QrCode, Ticket, Settings, LogOut, Save, X, Edit3, CheckCircle, MapPin, Camera, Upload } from 'lucide-react';
import { Card, SectionTitle, Badge, Button, Input, AvatarUpload, ImageWithFallback, QRScanner } from '../components/ui';
import { validateCoupon, markCouponAsUsed, Coupon as CouponType } from '../services/couponService';
import { Partner } from '../types';
import { uploadPartnerImage } from '../services/avatarService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchPartnerById, updatePartner as updatePartnerSupabase } from '../services/partners';

const PartnerDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, signOut, loading: authLoading } = useAuth();
    const { showToast } = useToast();
    const [partner, setPartner] = useState<Partner | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal States
    const [isEditing, setIsEditing] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [validationStep, setValidationStep] = useState(0); // 0: Scan, 1: Success
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const [isValidatingLoading, setIsValidatingLoading] = useState(false);
    const [validatedCoupon, setValidatedCoupon] = useState<CouponType | null>(null);

    // Form State
    const [editForm, setEditForm] = useState<Partner | null>(null);

    useEffect(() => {
        const loadPartnerData = async () => {
            if (authLoading) return;

            if (!user) {
                navigate('/login');
                return;
            }

            // Check if user is partner (optional strict check, relies on metadata or DB)
            // For now, proceed to try fetching partner profile.

            try {
                console.log('PartnerDashboard: Fetching partner for user:', user.id);
                // 1. Try fetching by User ID (New Flow)
                let foundPartner = await fetchPartnerById(user.id);
                console.log('PartnerDashboard: Search result:', foundPartner);

                // 2. Fallback for Demo User (Legacy Flow)
                if (!foundPartner && user.email === 'parceiro@teste.com') {
                    foundPartner = await fetchPartnerById('p_demo_1');
                }

                if (foundPartner) {
                    setPartner(foundPartner);
                    setEditForm(foundPartner);
                } else {
                    console.error('PartnerDashboard: Partner profile not found for ID:', user.id);
                }
            } catch (error) {
                console.error('Error loading partner profile:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPartnerData();
    }, [user, authLoading, navigate]);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editForm && partner) {
            try {
                const updated = await updatePartnerSupabase(partner.id, editForm);
                if (updated) {
                    setPartner(updated);
                    setIsEditing(false);
                    showToast("Perfil atualizado com sucesso!", "success");
                } else {
                    showToast("Erro ao atualizar: resposta vazia.", "error");
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showToast("Erro ao atualizar perfil.", "error");
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (editForm) {
            setEditForm({ ...editForm, [e.target.name]: e.target.value });
        }
    };

    const handleValidateCoupon = async (code?: string) => {
        setValidationMessage(null);
        setValidatedCoupon(null);
        setIsValidatingLoading(true);
        setValidationStep(1);

        let toValidate = code ?? couponCodeInput;

        // Clean input if it's a scanned QR Code JSON or URL
        try {
            if (toValidate.trim().startsWith('{')) {
                const parsed = JSON.parse(toValidate);
                if (parsed.code) {
                    toValidate = parsed.code;
                }
            } else if (toValidate.includes('validate=')) {
                // Robust extraction: find 'validate=' and get the code after it
                // This works even if the param is in the search, hash, or both
                const url = toValidate.trim();
                
                // Try to find it via a simple regex first (most reliable)
                const match = url.match(/[?&]validate=([^&/#?]+)/);
                if (match && match[1]) {
                    toValidate = match[1];
                } else {
                    // Fallback to URL parsing if regex fails
                    const urlObj = new URL(url.replace('#/', '/')); 
                    const codeParam = urlObj.searchParams.get('validate');
                    if (codeParam) {
                        toValidate = codeParam;
                    }
                }
            }
        } catch (err) {
            console.warn('Error parsing QR payload:', err);
        }

        // Final trim and cleanup
        toValidate = toValidate.trim();


        try {
            const result = await validateCoupon(toValidate);

            if (result.valid && result.coupon) {
                // Mark as used immediately
                const marked = await markCouponAsUsed(result.coupon.id);
                if (marked) {
                    setValidatedCoupon(result.coupon);
                    setValidationStep(2);
                    setValidationMessage(`Cupom válido — ${result.coupon.benefit}`);
                } else {
                    setValidationStep(0);
                    setValidationMessage('Erro ao consumir o cupom. Tente novamente.');
                }
            } else {
                setValidationStep(0);
                setValidationMessage(result.error || 'Cupom inválido');
            }
        } catch (err: unknown) {
            console.error('Validation error:', err);
            setValidationMessage('Erro ao validar. Tente novamente.');
            setValidationStep(0);
        } finally {
            setIsValidatingLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Carregando painel...</div>;

    if (!partner) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 text-center">
                <h2 className="text-xl font-bold text-red-500 mb-2">Erro de Acesso</h2>
                <p className="text-gray-400 mb-6">Não foi possível carregar o perfil do parceiro. Seus dados locais podem estar desatualizados.</p>

                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Button onClick={() => navigate('/login')} variant="outline">
                        Voltar para Login
                    </Button>
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                        Resetar Banco de Dados (Correção)
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-obsidian-950 font-sans text-white pb-32">
            {/* Header */}
            <header className="bg-obsidian-900 border-b border-white/5 p-6 md:px-12 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-opacity-80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold-500/10 rounded-lg flex items-center justify-center border border-gold-500/20">
                        <Settings className="text-gold-500" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold leading-tight">{partner.name}</h1>
                        <p className="text-[10px] text-gray-400 tracking-wider uppercase">Painel do Parceiro</p>
                    </div>
                </div>
                <button onClick={handleLogout} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                    Sair <LogOut size={16} />
                </button>
            </header>

            <div className="p-6 md:p-12 max-w-[1600px] mx-auto space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Users size={20} /></div>
                            <Badge variant="outline" className="text-xs">Hoje</Badge>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold">24</h3>
                            <p className="text-gray-500 text-sm">Visitas de Clientes</p>
                        </div>
                    </Card>

                    <Card className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-500"><Ticket size={20} /></div>
                            <Badge variant="outline" className="text-xs">+12%</Badge>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold">8</h3>
                            <p className="text-gray-500 text-sm">Cupons Validados</p>
                        </div>
                    </Card>

                    <Card className="flex flex-col gap-4">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-gold-500/10 rounded-lg text-gold-500"><QrCode size={20} /></div>
                            <Badge variant="outline" className="text-xs">Ativo</Badge>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold">QR</h3>
                            <p className="text-gray-500 text-sm">Validar Desconto</p>
                        </div>
                    </Card>

                    <Card className="bg-gold-500 text-black border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><BarChart3 size={100} /></div>
                        <div className="h-full flex flex-col justify-between relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="font-bold opacity-70">Status</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium opacity-80 mb-1">Benefício Atual</p>
                                <h3 className="text-2xl font-black truncate">{partner.benefit}</h3>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <section>
                    <SectionTitle title="Ações Rápidas" subtitle="Gerencie sua parceria" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <button onClick={() => { setIsValidating(true); setValidationStep(0); setValidatedCoupon(null); setValidationMessage(null); setCouponCodeInput(''); }} className="bg-obsidian-900 border border-white/10 hover:border-gold-500/50 p-8 rounded-xl flex items-center gap-6 transition-all group text-left hover:bg-white/5">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-gold-500 group-hover:text-black transition-colors shadow-lg">
                                <QrCode size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-1">Validar Cupom</h4>
                                <p className="text-sm text-gray-500">Ler QR Code do cliente para aplicar desconto</p>
                            </div>
                        </button>

                        <button onClick={() => setIsEditing(true)} className="bg-obsidian-900 border border-white/10 hover:border-gold-500/50 p-8 rounded-xl flex items-center gap-6 transition-all group text-left hover:bg-white/5">
                            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-gold-500 group-hover:text-black transition-colors shadow-lg">
                                <Edit3 size={32} />
                            </div>
                            <div>
                                <h4 className="font-bold text-xl mb-1">Editar Perfil</h4>
                                <p className="text-sm text-gray-500">Alterar benefício, regras, fotos e descrição</p>
                            </div>
                        </button>
                    </div>
                </section>
            </div>

            {/* --- MODALS --- */}

            {/* EDIT PROFILE MODAL */}
            {isEditing && editForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-obsidian-900 w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Settings size={20} className="text-gold-500" /> Editar Dados da Loja</h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>

                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Informações Básicas</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Nome da Loja" name="name" value={editForm.name} onChange={handleChange} />
                                    <Input label="Benefício (Destaque)" name="benefit" value={editForm.benefit} onChange={handleChange} placeholder="Ex: 10% OFF" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Descrição</label>
                                    <textarea
                                        name="description"
                                        value={editForm.description}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:border-gold-500 focus:bg-obsidian-900 outline-none transition-all min-h-[80px]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Regras de Uso</label>
                                    <textarea
                                        name="fullRules"
                                        value={editForm.fullRules}
                                        onChange={handleChange}
                                        className="w-full bg-white/5 border border-white/10 rounded-sm px-4 py-3 text-sm text-white focus:border-gold-500 focus:bg-obsidian-900 outline-none transition-all min-h-[80px]"
                                    />
                                </div>
                            </div>

                            {/* Images with Upload */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Imagens</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Logo Upload */}
                                    <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Logo</p>
                                        <AvatarUpload
                                            currentImageUrl={editForm.logoUrl || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(editForm.name) + '&background=333&color=D4AF37'}
                                            onUpload={async (file) => {
                                                if (!partner?.id) return;
                                                const url = await uploadPartnerImage(partner.id, file, 'logo');
                                                setEditForm(prev => prev ? { ...prev, logoUrl: url } : null);
                                            }}
                                            size="lg"
                                        />
                                        <p className="text-[10px] text-gray-500">Clique para alterar</p>
                                    </div>

                                    {/* Cover Upload */}
                                    <div className="flex flex-col items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Capa</p>
                                        <div
                                            className="w-full aspect-video rounded-lg border-2 border-dashed border-white/20 overflow-hidden relative cursor-pointer hover:border-gold-500 transition-colors group"
                                            onClick={() => {
                                                const input = document.createElement('input');
                                                input.type = 'file';
                                                input.accept = 'image/jpeg,image/png,image/webp,image/gif';
                                                input.onchange = async (e) => {
                                                    const file = (e.target as HTMLInputElement).files?.[0];
                                                    if (file && partner?.id) {
                                                        try {
                                                            const url = await uploadPartnerImage(partner.id, file, 'cover');
                                                            setEditForm(prev => prev ? { ...prev, coverUrl: url } : null);
                                                        } catch (err: unknown) {
                                                            const message = err instanceof Error ? err.message : 'Erro no upload';
                                                            showToast(message, "error");
                                                        }
                                                    }
                                                };
                                                input.click();
                                            }}
                                        >
                                            {editForm.coverUrl ? (
                                                <ImageWithFallback
                                                    src={editForm.coverUrl}
                                                    alt="Cover"
                                                    className="w-full h-full object-cover"
                                                    fallbackSrc="https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=800&q=80"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 group-hover:text-gold-500">
                                                    <Upload size={24} />
                                                    <span className="text-xs mt-1">Adicionar capa</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Camera size={24} className="text-white" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-gray-500">Clique para alterar</p>
                                    </div>
                                </div>
                            </div>

                            {/* Location Section - CONSOLIDATED */}
                            <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/10">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-sm font-bold text-white flex items-center gap-2"><MapPin size={16} className="text-gold-500" /> Localização e Endereço</h4>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition((pos) => {
                                                    setEditForm(prev => prev ? ({
                                                        ...prev,
                                                        coordinates: {
                                                            lat: pos.coords.latitude,
                                                            lng: pos.coords.longitude
                                                        }
                                                    }) : null);
                                                    showToast("Coordenadas GPS atualizadas!", "success");
                                                }, (err) => {
                                                    console.error(err);
                                                    showToast("Erro ao obter localização.", "error");
                                                });
                                            } else {
                                                showToast("Geolocalização não suportada.", "error");
                                            }
                                        }}
                                        className="text-[10px] bg-gold-500/10 text-gold-500 border border-gold-500/50 px-3 py-1.5 rounded hover:bg-gold-500 hover:text-black transition-colors font-bold uppercase tracking-wider flex items-center gap-1"
                                        aria-label="Obter localização atual"
                                    >
                                        <MapPin size={12} /> Pegar Minha Localização
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input label="Cidade" name="city" value={editForm.city} onChange={handleChange} />
                                    <Input label="Endereço Completo" name="address" value={editForm.address || ''} onChange={handleChange} placeholder="Rua, Número, Bairro" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Latitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-black/20 border border-white/10 text-gray-300 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-gold-500 font-mono"
                                            value={editForm.coordinates?.lat || ''}
                                            onChange={(e) => setEditForm(prev => prev ? ({ ...prev, coordinates: { ...prev.coordinates, lat: parseFloat(e.target.value) || 0, lng: prev.coordinates?.lng || 0 } }) : null)}
                                            placeholder="0.000000"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Longitude</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-black/20 border border-white/10 text-gray-300 rounded-sm py-2 px-3 text-xs focus:outline-none focus:border-gold-500 font-mono"
                                            value={editForm.coordinates?.lng || ''}
                                            onChange={(e) => setEditForm(prev => prev ? ({ ...prev, coordinates: { ...prev.coordinates, lng: parseFloat(e.target.value) || 0, lat: prev.coordinates?.lat || 0 } }) : null)}
                                            placeholder="0.000000"
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 text-center pt-2">
                                    *As coordenadas são usadas para o botão "Traçar Rota". O endereço é visual.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-white/5 bg-obsidian-950/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
                            <Button onClick={handleSaveProfile} className="px-8"><Save size={18} className="mr-2" /> Salvar Alterações</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* VALIDATE COUPON MODAL */}
            {isValidating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="bg-obsidian-900 w-full max-w-sm rounded-3xl border border-white/10 shadow-2xl overflow-hidden p-8 text-center relative">
                        <button onClick={() => setIsValidating(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>

                        {validationStep === 0 && (
                            <div className="py-4">
                                <h3 className="text-xl font-bold mb-2">Validar Cupom</h3>
                                <p className="text-gray-400 text-sm mb-4">Escaneie o QR Code do cliente ou digite o código</p>

                                {/* Real Camera Scanner */}
                                <QRScanner
                                    onScan={(data) => handleValidateCoupon(data)}
                                    onError={(errMsg) => setValidationMessage(errMsg)}
                                />

                                {/* Divider */}
                                <div className="flex items-center gap-3 my-4">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-gray-500 text-xs uppercase tracking-wider">ou digite</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {/* Manual Input */}
                                <div className="flex gap-2 mb-3">
                                    <Input value={couponCodeInput} onChange={(e) => setCouponCodeInput((e.target as HTMLInputElement).value)} placeholder="TRV-XXXXXX" />
                                    <Button onClick={() => handleValidateCoupon()} isLoading={isValidatingLoading}>VALIDAR</Button>
                                </div>

                                {validationMessage && (
                                    <p className={`text-sm mt-2 font-medium ${validationStep === 0 ? 'text-red-400' : 'text-green-400'}`}>{validationMessage}</p>
                                )}
                            </div>
                        )}

                        {validationStep === 1 && (
                            <div className="py-12">
                                <div className="w-16 h-16 border-4 border-t-gold-500 border-white/10 rounded-full animate-spin mx-auto mb-6"></div>
                                <h3 className="text-lg font-bold">Verificando validade...</h3>
                            </div>
                        )}

                        {validationStep === 2 && validatedCoupon && (
                            <div className="py-8 animate-scale-up">
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                                    <CheckCircle size={48} className="text-black" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-1">Cupom Válido!</h3>
                                <p className="text-green-400 font-bold mb-6">Desconto de {validatedCoupon.benefit} Aplicado</p>

                                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Cliente</p>
                                        <p className="font-bold">{validatedCoupon.user_name || 'Cliente'}</p>
                                    </div>
                                    <div className="h-px bg-white/10"></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Código</p>
                                        <p className="font-mono text-gold-500">{validatedCoupon.code}</p>
                                    </div>
                                    <div className="h-px bg-white/10"></div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Benefício</p>
                                        <p className="text-green-400 font-medium">{validatedCoupon.benefit}</p>
                                    </div>
                                </div>

                                <Button onClick={() => setIsValidating(false)} className="w-full">FINALIZAR</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PartnerDashboard;
