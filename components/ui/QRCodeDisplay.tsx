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

    // QR Code contains a structured payload for validation
    const qrPayload = JSON.stringify({
        code,
        partner: partnerName,
        benefit,
        expires: expiresAt,
        type: 'TAVARES_CAR_COUPON'
    });

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
        <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center animate-slide-up shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <h3 className="text-black font-bold text-lg mb-2">
                Cupom Ativo
            </h3>

            {/* QR Code - Functional */}
            <div className="border-2 border-dashed border-gray-300 p-3 rounded-lg mb-4 bg-white">
                <QRCodeSVG
                    value={qrPayload}
                    size={180}
                    level="H"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
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
