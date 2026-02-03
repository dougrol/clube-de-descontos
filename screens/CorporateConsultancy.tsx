import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, Shield, Search, Handshake } from 'lucide-react';
import { Button, Card } from '../components/ui';

const CorporateConsultancy: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-black pb-24 animate-fade-in">
            {/* Header */}
            <div className="bg-gradient-to-b from-purple-900/20 to-black pt-10 pb-10 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

                <button onClick={() => navigate(-1)} className="text-white mb-6 relative z-10"><ArrowLeft /></button>

                <div className="relative z-10">
                    <div className="inline-block px-3 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-purple-500/20 mb-4">
                        B2B Services
                    </div>
                    <h1 className="text-3xl font-serif font-bold text-white mb-2">
                        Consultoria para <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">Associações</span>
                    </h1>
                    <p className="text-gray-400 text-sm max-w-[90%]">
                        Gestão comercial estratégica e treinamentos de alta performance para o mercado de Proteção Veicular.
                    </p>
                </div>
            </div>

            <div className="px-5 space-y-12">

                {/* 1. ASSOCIAÇÕES & PARCEIROS */}
                <section>
                    <div className="text-center mb-6">
                        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-4">Parceiros Oficiais & Cases</p>
                        <div className="flex justify-center gap-4">
                            <div className="bg-obsidian-800 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 min-w-[130px] justify-center shadow-lg">
                                <Shield size={18} className="text-blue-500" />
                                <span className="font-bold text-white tracking-wider text-sm">PROTBEM</span>
                            </div>
                            <div className="bg-obsidian-800 px-4 py-3 rounded-xl border border-white/5 flex items-center gap-2 min-w-[130px] justify-center shadow-lg">
                                <Shield size={18} className="text-green-500" />
                                <span className="font-bold text-white tracking-wider text-sm">ELEVAMAIS</span>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-obsidian-900/50 rounded-xl p-4 border border-white/5 mb-8">
                        <div className="flex justify-between items-center">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">+50</p>
                                <p className="text-[9px] text-gray-500 uppercase">Associações</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">+10k</p>
                                <p className="text-[9px] text-gray-500 uppercase">Vendas/Mês</p>
                            </div>
                            <div className="w-px h-8 bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-white">360º</p>
                                <p className="text-[9px] text-gray-500 uppercase">Soluções</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. TREINAMENTOS CORPORATIVOS FOCADOS */}
                <section className="space-y-6">
                    <h3 className="text-white font-bold text-sm border-l-2 border-gold-500 pl-3">Treinamento Especializado</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                        Metodologia exclusiva para transformar <span className="text-white font-medium">atendentes em vendedores de elite</span>.
                        Foco total em conversão e resultados.
                    </p>

                    <div className="grid gap-4">
                        <Card className="flex items-center gap-4 bg-obsidian-800 border-l-4 border-l-gold-500">
                            <div className="bg-black p-3 rounded-full text-gold-500"><Search size={24} /></div>
                            <div>
                                <h3 className="text-white font-bold">Consultores e Vendedores</h3>
                                <p className="text-gray-400 text-xs mt-1">Formação completa: do zero ao avançado em vendas de proteção veicular.</p>
                            </div>
                        </Card>

                        <Card className="flex items-center gap-4 bg-obsidian-800 border-l-4 border-l-purple-500">
                            <div className="bg-black p-3 rounded-full text-purple-500"><Target size={24} /></div>
                            <div>
                                <h3 className="text-white font-bold">Técnicas de Vendas</h3>
                                <p className="text-gray-400 text-xs mt-1">Scripts persuasivos, gatilhos mentais e funil de vendas eficiente.</p>
                            </div>
                        </Card>

                        <Card className="flex items-center gap-4 bg-obsidian-800 border-l-4 border-l-white">
                            <div className="bg-black p-3 rounded-full text-white"><Shield size={24} /></div>
                            <div>
                                <h3 className="text-white font-bold">Quebra de Objeções</h3>
                                <p className="text-gray-400 text-xs mt-1">Domine a arte de contornar o "não" e fechar mais contratos.</p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Overall CTA */}
                <div className="bg-obsidian-900 rounded-xl p-6 text-center border border-dashed border-gray-700 mt-8">
                    <Handshake size={32} className="text-gold-500 mx-auto mb-3 opacity-50" />
                    <p className="text-gray-500 text-xs mb-4">
                        Sua equipe comercial precisa vender mais?
                    </p>
                    <div className="grid grid-cols-1 gap-3">
                        <Button onClick={() => window.open('https://wa.me/?text=Quero%20treinar%20minha%20equipe%20comercial', '_blank')} className="bg-white text-black hover:bg-gray-200 shadow-none text-xs w-full">
                            SOLICITAR TREINAMENTO
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CorporateConsultancy;
