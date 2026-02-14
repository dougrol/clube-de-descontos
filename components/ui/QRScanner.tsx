import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, SwitchCamera } from 'lucide-react';

interface QRScannerProps {
    onScan: (data: string) => void;
    onError?: (error: string) => void;
}

const QR_READER_ID = 'qr-reader-container';

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onError }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const mountedRef = useRef(true);

    const startScanner = async () => {
        try {
            if (scannerRef.current) {
                try { await scannerRef.current.stop(); } catch { /* ignore */ }
                scannerRef.current.clear();
                scannerRef.current = null;
            }

            const scanner = new Html5Qrcode(QR_READER_ID);
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode },
                {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1,
                },
                async (decodedText) => {
                    if (mountedRef.current) {
                        // Crucia: Stop scanner BEFORE notifying parent
                        // Parent state change often unmounts this component immediately
                        try {
                            setIsScanning(false);
                            if (scannerRef.current) {
                                await scannerRef.current.stop();
                                scannerRef.current.clear();
                                scannerRef.current = null;
                            }
                        } catch (stopErr) {
                            console.warn('Silent error stopping scanner after scan:', stopErr);
                        }
                        
                        // Now it's safe to notify parent
                        onScan(decodedText);
                    }
                },
                () => {
                    // QR code not detected yet — silent
                }
            );

            if (mountedRef.current) {
                setIsScanning(true);
                setHasPermission(true);
            }
        } catch (err) {
            console.error('QR Scanner error:', err);
            if (mountedRef.current) {
                setHasPermission(false);
                setIsScanning(false);
                const message = err instanceof Error ? err.message : String(err);
                if (message.includes('NotAllowedError') || message.includes('Permission')) {
                    onError?.('Permissão de câmera negada. Habilite nas configurações do navegador.');
                } else if (message.includes('NotFoundError')) {
                    onError?.('Nenhuma câmera encontrada no dispositivo.');
                } else {
                    onError?.('Erro ao iniciar câmera: ' + message);
                }
            }
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
            } catch { /* ignore */ }
            setIsScanning(false);
        }
    };

    const toggleCamera = async () => {
        await stopScanner();
        const newMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newMode);
    };

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
            if (scannerRef.current) {
                // Use a local copy to avoid closure issues
                const currentScanner = scannerRef.current;
                currentScanner.stop().catch(() => {
                    // Ignore error if already stopped
                }).finally(() => {
                    try { currentScanner.clear(); } catch { /* ignore */ }
                });
            }
        };
    }, []);

    // Restart when facingMode changes and was scanning
    useEffect(() => {
        if (hasPermission === true) {
            startScanner();
        }
    }, [facingMode]);

    return (
        <div className="w-full flex flex-col items-center gap-3">
            {/* Scanner Container */}
            <div className="w-full max-w-[280px] aspect-square rounded-2xl overflow-hidden border-2 border-gold-500/50 bg-black relative">
                <div id={QR_READER_ID} className="w-full h-full" />

                {!isScanning && hasPermission !== false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80">
                        <button
                            onClick={startScanner}
                            className="w-20 h-20 bg-gold-500 rounded-full flex items-center justify-center text-black hover:bg-gold-400 transition-all active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
                        >
                            <Camera size={32} />
                        </button>
                        <p className="text-gray-400 text-xs mt-3">Toque para abrir câmera</p>
                    </div>
                )}

                {hasPermission === false && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-4 text-center">
                        <CameraOff size={32} className="text-red-400 mb-2" />
                        <p className="text-red-400 text-xs font-bold">Câmera não disponível</p>
                        <p className="text-gray-500 text-[10px] mt-1">Habilite a permissão nas configurações do navegador</p>
                        <button
                            onClick={startScanner}
                            className="mt-3 px-4 py-2 bg-gold-500/20 text-gold-500 rounded-lg text-xs font-bold hover:bg-gold-500/30 transition-colors"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            {isScanning && (
                <div className="flex gap-2">
                    <button
                        onClick={toggleCamera}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        <SwitchCamera size={14} /> Trocar câmera
                    </button>
                    <button
                        onClick={stopScanner}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                        <CameraOff size={14} /> Parar
                    </button>
                </div>
            )}
        </div>
    );
};

export default QRScanner;
