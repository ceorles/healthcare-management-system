import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = 'referral-qr-reader';

export default function ReferralQRScanner({ isOpen, onClose, onScan }) {
    const scannerRef = useRef(null);
    const scannedRef = useRef(false);

    useEffect(() => {
        if (!isOpen) return;

        scannedRef.current = false;
        const html5QrCode = new Html5Qrcode(SCANNER_ID);
        scannerRef.current = html5QrCode;

        html5QrCode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
            (decodedText) => {
                if (scannedRef.current) return;
                scannedRef.current = true;
                onScan(decodedText);
            },
            () => {}
        ).catch((err) => {
            console.error('QR scanner failed to start:', err);
            alert('Could not access the camera. Please allow camera permission and try again.');
            onClose();
        });

        return () => {
            const scanner = scannerRef.current;
            if (scanner?.isScanning) {
                scanner.stop().catch(() => {}).finally(() => scanner.clear());
            } else {
                scanner?.clear();
            }
            scannerRef.current = null;
        };
    }, [isOpen, onClose, onScan]);

    if (!isOpen) return null;

    return (
        <div className="ref-qr-scanner-overlay" onClick={onClose} role="presentation">
            <div
                className="ref-qr-scanner-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="ref-qr-scanner-title"
            >
                <div className="ref-qr-scanner-header">
                    <h3 id="ref-qr-scanner-title">Scan Referral QR Code</h3>
                    <button type="button" className="ref-qr-scanner-close" onClick={onClose} aria-label="Close scanner">
                        <X size={20} />
                    </button>
                </div>
                <p className="ref-qr-scanner-hint">Point your camera at the referral QR code on the print slip.</p>
                <div id={SCANNER_ID} className="ref-qr-scanner-viewport" />
            </div>
        </div>
    );
}
