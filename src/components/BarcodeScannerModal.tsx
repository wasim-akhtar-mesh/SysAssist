import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, RefreshCw, AlertCircle, CheckCircle, Search, Laptop } from 'lucide-react';
import { Asset } from '../types';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator } from './SkeuoComponents';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onNewAssetScan?: (barcode: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onNewAssetScan
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'not_found'>('idle');
  const [detectedAsset, setDetectedAsset] = useState<Asset | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Camera stream lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setScanStatus('idle');
      setDetectedAsset(null);
      return;
    }

    startCamera();
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    setScanStatus('scanning');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported by browser in this context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Camera unavailable or permission denied';
      setCameraError(errMsg);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const processBarcodeValue = (code: string) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    // Search by barcode, assetTag, or serialNumber
    const found = assets.find(
      a => a.barcode.toUpperCase() === trimmed || 
           a.assetTag.toUpperCase() === trimmed || 
           a.serialNumber.toUpperCase() === trimmed
    );

    if (found) {
      soundFx.playScanBeep();
      setDetectedAsset(found);
      setScanStatus('success');
      setTimeout(() => {
        onSelectAsset(found);
        onClose();
      }, 900);
    } else {
      soundFx.playScanError();
      setScanStatus('not_found');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processBarcodeValue(manualInput);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div className="w-full max-w-2xl instrument-panel rounded-2xl p-5 sm:p-6 relative flex flex-col border border-white/[0.09] shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Scanner Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl instrument-well flex items-center justify-center border border-white/[0.05] text-blue-400">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="scanner-modal-title" className="text-base font-sans font-bold text-slate-100">
                  Optical Barcode & Tag Scanner
                </h3>
                <LedIndicator 
                  color={scanStatus === 'success' ? 'green' : scanStatus === 'not_found' ? 'red' : 'blue'} 
                  pulse={scanStatus === 'scanning'} 
                />
              </div>
              <p className="text-xs font-sans text-slate-400">
                Code 128 • Code 39 • GSX Serial Number • Hardware Asset Tags
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg instrument-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close scanner modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Bay */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden reticle-lens flex items-center justify-center">
          {/* Camera Feed */}
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-6 z-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full instrument-well flex items-center justify-center border border-white/[0.05] mb-2.5 text-slate-500">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-xs font-sans text-slate-300 font-semibold mb-1">
                {cameraError ? 'Optical Stream Offline' : 'Initializing Optical Viewfinder...'}
              </p>
              <p className="text-[11px] font-sans text-slate-400 max-w-sm">
                {cameraError 
                  ? 'Camera permission unavailable in current browser frame. Use manual input or quick test presets below.'
                  : 'Position the hardware barcode or serial number label inside the viewfinder reticle.'}
              </p>
              {cameraError && (
                <div className="mt-3">
                  <SkeuoButton size="sm" variant="standard" onClick={startCamera} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                    Retry Camera
                  </SkeuoButton>
                </div>
              )}
            </div>
          )}

          {/* Precision Laser Sweep Line */}
          <div className="optical-laser z-30 pointer-events-none" />

          {/* Calibrated Target Reticle Brackets */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-32 border border-blue-400/30 rounded-lg relative">
              {/* Precision Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-2 border-l-2 border-blue-400" />
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-2 border-r-2 border-blue-400" />
              <div className="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-2 border-l-2 border-blue-400" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-2 border-r-2 border-blue-400" />
              
              <div className="absolute bottom-1 right-2 text-[9px] font-mono text-blue-300/80">
                CALIBRATED RETICLE
              </div>
            </div>
          </div>

          {/* Success Result Overlay */}
          {scanStatus === 'success' && detectedAsset && (
            <div className="absolute inset-0 z-40 bg-emerald-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
              <div className="text-sm font-sans font-bold text-white">Hardware Asset Verified</div>
              <div className="text-xs font-mono text-emerald-300 mt-1">
                {detectedAsset.assetTag} • {detectedAsset.name}
              </div>
              <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                Serial: <span className="font-mono">{detectedAsset.serialNumber}</span> • Status: {detectedAsset.status}
              </div>
            </div>
          )}

          {/* Not Found Overlay */}
          {scanStatus === 'not_found' && (
            <div className="absolute inset-0 z-40 bg-red-950/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-9 h-9 text-rose-400 mb-2" />
              <div className="text-sm font-sans font-bold text-white">Unregistered Barcode / Tag</div>
              <p className="text-xs text-rose-200 mt-1 max-w-xs font-sans">
                No existing hardware record matches &ldquo;{manualInput}&rdquo;.
              </p>
              <div className="flex gap-2 mt-3">
                <SkeuoButton size="sm" variant="standard" onClick={() => setScanStatus('scanning')}>
                  Scan Again
                </SkeuoButton>
                {onNewAssetScan && (
                  <SkeuoButton 
                    size="sm" 
                    variant="primary" 
                    onClick={() => {
                      onNewAssetScan(manualInput);
                      onClose();
                    }}
                  >
                    Intake as New Hardware
                  </SkeuoButton>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manual Barcode & Tag Input */}
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Enter Asset Tag (e.g. AST-8821), Barcode, or Serial Number..."
                className="w-full h-9 pl-9 pr-3 instrument-well rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>

            <SkeuoButton
              type="submit"
              size="sm"
              variant="primary"
            >
              Verify Tag
            </SkeuoButton>
          </form>
        </div>

        {/* Quick Simulator Test Barcodes */}
        <div className="mt-3 p-3 rounded-lg instrument-well">
          <span className="text-[10px] uppercase font-sans tracking-wide text-slate-400 block mb-2 font-medium">
            Quick Test Barcode Simulation (One-Click Verification)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {assets.slice(0, 4).map(sample => (
              <button
                key={sample.id}
                type="button"
                onClick={() => {
                  setManualInput(sample.barcode);
                  processBarcodeValue(sample.barcode);
                }}
                className="px-2.5 py-1 rounded-md instrument-btn text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
              >
                <span className="text-blue-300 font-bold">{sample.assetTag}</span>
                <span className="text-slate-400 font-sans truncate max-w-[120px]">{sample.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
