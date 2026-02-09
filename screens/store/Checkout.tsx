import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CreditCard, QrCode, Loader2, CheckCircle, Copy, ExternalLink } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { fetchProductById, createPayment } from '../../services/storeService';
import { Product, PaymentMethod } from '../../types';

const Checkout: React.FC = () => {
    const { productId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
    const [paymentResult, setPaymentResult] = useState<{
        orderId?: string;
        pixQrCode?: string;
        pixQrCodeBase64?: string;
        checkoutUrl?: string;
    } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const quantity = parseInt(searchParams.get('qty') || '1', 10);

    useEffect(() => {
        if (productId) {
            fetchProductById(productId).then(data => {
                setProduct(data);
                setLoading(false);
            });
        }
    }, [productId]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    const handlePayment = async () => {
        if (!product || !selectedMethod) return;

        setProcessing(true);
        setError(null);

        const result = await createPayment({
            productId: product.id,
            quantity,
            method: selectedMethod
        });

        setProcessing(false);

        if (result.success) {
            setPaymentResult({
                orderId: result.orderId,
                pixQrCode: result.pixQrCode,
                pixQrCodeBase64: result.pixQrCodeBase64,
                checkoutUrl: result.checkoutUrl
            });

            // If card payment, redirect to checkout
            if (selectedMethod === PaymentMethod.CARD && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            }
        } else {
            setError(result.error || 'Erro ao processar pagamento');
        }
    };

    const handleCopyPix = () => {
        if (paymentResult?.pixQrCode) {
            navigator.clipboard.writeText(paymentResult.pixQrCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-gold-500">
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-10">
                <p>Produto não encontrado</p>
                <Button className="mt-4" onClick={() => navigate('/loja')}>
                    Voltar à Loja
                </Button>
            </div>
        );
    }

    const totalPrice = product.priceDiscount * quantity;

    // Show PIX QR Code result
    if (paymentResult?.pixQrCodeBase64) {
        return (
            <div className="min-h-screen bg-black pb-24 animate-fade-in">
                {/* Header */}
                <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-obsidian-800 px-4 py-3">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/meus-pedidos')}
                            className="h-10 w-10 rounded-full flex items-center justify-center text-white hover:bg-obsidian-800 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-lg font-bold text-white">Pagamento PIX</h1>
                    </div>
                </div>

                <div className="px-5 py-6 space-y-6">
                    {/* Success Message */}
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Pedido Criado!</h2>
                        <p className="text-gray-400 text-sm">Escaneie o QR Code ou copie o código PIX</p>
                    </div>

                    {/* QR Code */}
                    <Card className="bg-white p-6 flex flex-col items-center">
                        <img
                            src={`data:image/png;base64,${paymentResult.pixQrCodeBase64}`}
                            alt="QR Code PIX"
                            className="w-48 h-48 mb-4"
                        />
                        <p className="text-black text-sm font-medium mb-4">
                            {formatPrice(totalPrice)}
                        </p>
                        <Button
                            onClick={handleCopyPix}
                            variant="outline"
                            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
                        >
                            <Copy size={16} className="mr-2" />
                            {copied ? 'Copiado!' : 'Copiar Código PIX'}
                        </Button>
                    </Card>

                    {/* Order Info */}
                    <Card className="bg-obsidian-900/50 border-obsidian-800">
                        <p className="text-gray-400 text-sm mb-2">Número do Pedido</p>
                        <p className="text-white font-mono text-sm">{paymentResult.orderId}</p>
                    </Card>

                    <div className="text-center text-gray-500 text-sm">
                        <p>Após o pagamento, seu pedido será confirmado automaticamente.</p>
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => navigate('/meus-pedidos')}
                        className="w-full"
                    >
                        Ver Meus Pedidos
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black pb-24 animate-fade-in">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-obsidian-800 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white hover:bg-obsidian-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-bold text-white">Checkout</h1>
                </div>
            </div>

            <div className="px-5 py-6 space-y-6">
                {/* Product Summary */}
                <Card className="bg-obsidian-900/50 border-obsidian-800 flex gap-4">
                    <img
                        src={product.imageUrl || 'https://placehold.co/100x100/1a1a1a/d4af37?text=P'}
                        alt={product.title}
                        className="w-20 h-20 rounded-lg object-cover"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://placehold.co/100x100/1a1a1a/d4af37?text=P';
                        }}
                    />
                    <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{product.title}</h3>
                        <p className="text-gray-500 text-sm mb-2">Qtd: {quantity}</p>
                        <p className="text-gold-500 font-bold">{formatPrice(totalPrice)}</p>
                    </div>
                </Card>

                {/* Payment Method Selection */}
                <div>
                    <h2 className="text-white font-bold mb-4">Forma de Pagamento</h2>
                    <div className="space-y-3">
                        {/* PIX Option */}
                        <Card
                            onClick={() => setSelectedMethod(PaymentMethod.PIX)}
                            className={`cursor-pointer transition-all ${selectedMethod === PaymentMethod.PIX
                                    ? 'border-gold-500 bg-gold-500/10'
                                    : 'border-obsidian-800 bg-obsidian-900/50 hover:border-obsidian-700'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === PaymentMethod.PIX ? 'bg-gold-500' : 'bg-obsidian-800'
                                    }`}>
                                    <QrCode size={24} className={selectedMethod === PaymentMethod.PIX ? 'text-black' : 'text-white'} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-medium">PIX</h3>
                                    <p className="text-gray-500 text-sm">Pagamento instantâneo</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 ${selectedMethod === PaymentMethod.PIX
                                        ? 'border-gold-500 bg-gold-500'
                                        : 'border-gray-600'
                                    }`}>
                                    {selectedMethod === PaymentMethod.PIX && (
                                        <CheckCircle size={16} className="text-black" />
                                    )}
                                </div>
                            </div>
                        </Card>

                        {/* Card Option */}
                        <Card
                            onClick={() => setSelectedMethod(PaymentMethod.CARD)}
                            className={`cursor-pointer transition-all ${selectedMethod === PaymentMethod.CARD
                                    ? 'border-gold-500 bg-gold-500/10'
                                    : 'border-obsidian-800 bg-obsidian-900/50 hover:border-obsidian-700'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedMethod === PaymentMethod.CARD ? 'bg-gold-500' : 'bg-obsidian-800'
                                    }`}>
                                    <CreditCard size={24} className={selectedMethod === PaymentMethod.CARD ? 'text-black' : 'text-white'} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-white font-medium">Cartão de Crédito</h3>
                                    <p className="text-gray-500 text-sm">Via Mercado Pago</p>
                                </div>
                                <div className={`w-5 h-5 rounded-full border-2 ${selectedMethod === PaymentMethod.CARD
                                        ? 'border-gold-500 bg-gold-500'
                                        : 'border-gray-600'
                                    }`}>
                                    {selectedMethod === PaymentMethod.CARD && (
                                        <CheckCircle size={16} className="text-black" />
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <Card className="bg-red-500/20 border-red-500/30">
                        <p className="text-red-400 text-sm text-center">{error}</p>
                    </Card>
                )}

                {/* Total & Pay Button */}
                <div className="space-y-4 pt-4">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400">Total a pagar:</span>
                        <span className="text-2xl font-bold text-gold-500">{formatPrice(totalPrice)}</span>
                    </div>

                    <Button
                        onClick={handlePayment}
                        disabled={!selectedMethod || processing}
                        isLoading={processing}
                        className="w-full"
                    >
                        {processing ? 'Processando...' : (
                            selectedMethod === PaymentMethod.CARD ? (
                                <>
                                    <ExternalLink size={18} className="mr-2" />
                                    Ir para Pagamento
                                </>
                            ) : (
                                'Gerar QR Code PIX'
                            )
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
