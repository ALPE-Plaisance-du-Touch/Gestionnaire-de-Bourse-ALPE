import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrScannerProps {
  onScan: (barcode: string) => void;
  disabled?: boolean;
}

export function QrScanner({ onScan, disabled = false }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const stopScanning = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch {
        // Ignore stop errors
      }
    }
    setIsScanning(false);
  }, []);

  const startScanning = useCallback(async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          onScan(decodedText);
          stopScanning();
        },
        () => {
          // QR code not detected, ignore
        },
      );
      setIsScanning(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access denied';
      setCameraError(message);
      setIsScanning(false);
    }
  }, [onScan, stopScanning]);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = manualBarcode.trim();
    if (trimmed) {
      onScan(trimmed);
      setManualBarcode('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera scanner */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div id={scannerContainerId} className="w-full" />
        {!isScanning && (
          <div className="p-8 text-center bg-gray-50">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
            </svg>
            <p className="text-sm text-gray-500 mb-3">
              Scanner un QR code avec la camera
            </p>
            <button
              type="button"
              onClick={startScanning}
              disabled={disabled}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Activer la camera
            </button>
          </div>
        )}
        {isScanning && (
          <div className="p-2 text-center">
            <button
              type="button"
              onClick={stopScanning}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Arreter la camera
            </button>
          </div>
        )}
      </div>

      {cameraError && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          Camera indisponible : {cameraError}. Utilisez la saisie manuelle ci-dessous.
        </div>
      )}

      {/* Manual input */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          value={manualBarcode}
          onChange={(e) => setManualBarcode(e.target.value)}
          placeholder="Saisir le code-barres manuellement"
          disabled={disabled}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          autoFocus
        />
        <button
          type="submit"
          disabled={disabled || !manualBarcode.trim()}
          className="px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded-md hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Rechercher
        </button>
      </form>
    </div>
  );
}
