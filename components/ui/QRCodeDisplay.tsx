import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Clock, CheckCircle } from 'lucide-react';
import { getCouponRemainingTime } from '../../services/couponService';

interface QRCodeDisplayProps {
    code: string;
    expiresAt: string;
    benefit: string;
    partnerName: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ code, expiresAt, benefit, partnerName }) => {
    const [remainingTime, setRemainingTime] = useState(getCouponRemainingTime(expiresAt));
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const time = getCouponRemainingTime(expiresAt);
            setRemainingTime(time);

            if (time === 'Expirado') {
                setIsExpired(true);
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    const baseUrl = window.location.origin;
    const qrUrl = `${baseUrl}/#/?validate=${code}`;

    if (isExpired) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                <div className="text-red-500 text-4xl mb-2">⏰</div>
                <h3 className="text-red-500 font-bold text-lg mb-1">Cupom Expirado</h3>
                <p className="text-gray-400 text-sm">Gere um novo cupom para usar o desconto</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center animate-slide-up shadow-[0_0_50px_rgba(255,255,255,0.15)] border border-white/5">
            <div className="w-full flex justify-between items-center mb-4 px-2">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="mx-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">Cupom Oficial</span>
                <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* QR Code - Functional & Branded */}
            <div className="p-4 rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-4 group transition-all">
                <QRCodeSVG
                    value={qrUrl}
                    size={200}
                    level="H"
                    includeMargin={false}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    imageSettings={{
                        src: "/images/logo_shield.png", // Usando o escudo oficial da Tavares Car
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        excavate: true,
                    }}
                />
            </div>

            {/* Coupon Code */}
            <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={16} className="text-green-500" />
                <span className="font-mono text-2xl font-bold text-black tracking-widest">
                    {code}
                </span>
            </div>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${remainingTime.includes('min') && !remainingTime.includes('h')
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                <Clock size={14} />
                <span className="text-sm font-bold">
                    Válido por: {remainingTime}
                </span>
            </div>

            {/* Instructions */}
            <p className="text-gray-500 text-xs mt-4 text-center max-w-[250px]">
                Apresente este QR Code no caixa. O parceiro irá escanear para validar seu desconto.
            </p>
        </div>
    );
};

export default QRCodeDisplay;
