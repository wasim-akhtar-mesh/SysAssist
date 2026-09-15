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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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
        throw new Error('Camera device access not available in this browser context.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
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
      }, 700);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scanner-modal-title"
    >
      <div className="w-full max-w-md ti-card rounded-lg p-4 border border-[#C5C3BC] shadow-2xl relative flex flex-col text-xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#DFDDD6]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 id="scanner-modal-title" className="text-sm font-bold text-[#181A1B]">
                Barcode & Serial Scanner
              </h3>
              <div className="text-[11px] text-[#686B6D]">
                Optical barcode reader and tag detector
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded ti-btn flex items-center justify-center text-[#686B6D] hover:text-[#181A1B] cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Area (Clean, functional calibration frame - NO theatrical glowing lasers) */}
        <div className="relative aspect-4/3 w-full bg-[#151719] rounded border border-[#2B3036] overflow-hidden flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-4 text-center text-[#8C8F92] space-y-1.5">
              <Camera className="w-6 h-6 mx-auto text-[#686B6D]" />
              <div className="text-xs font-medium text-[#C8CACD]">
                {cameraError ? 'Camera Access Restricted' : 'Initializing Optical Stream...'}
              </div>
              <p className="text-[10px] text-[#686B6D] max-w-xs">
                {cameraError || 'Allow camera permissions or enter barcode manually below.'}
              </p>
              {cameraError && (
                <button
                  onClick={startCamera}
                  className="px-2 py-1 rounded bg-[#23272B] hover:bg-[#2B3036] text-[#FAF9F5] text-[10px] cursor-pointer border border-[#3A4048]"
                >
                  Retry Camera
                </button>
              )}
            </div>
          )}

          {/* Calibrated Reticle Box */}
          <div className="absolute inset-x-8 inset-y-6 border border-[#FAF9F5]/40 rounded-sm pointer-events-none flex flex-col justify-between p-1.5">
            <div className="flex justify-between">
              <span className="w-2.5 h-2.5 border-t-2 border-l-2 border-[#C66A2B]" />
              <span className="w-2.5 h-2.5 border-t-2 border-r-2 border-[#C66A2B]" />
            </div>
            <div className="text-center text-[10px] font-mono text-[#FAF9F5]/70 bg-black/40 px-2 py-0.5 rounded mx-auto">
              ALIGN BARCODE OR SERIAL
            </div>
            <div className="flex justify-between">
              <span className="w-2.5 h-2.5 border-b-2 border-l-2 border-[#C66A2B]" />
              <span className="w-2.5 h-2.5 border-b-2 border-r-2 border-[#C66A2B]" />
            </div>
          </div>
        </div>

        {/* Scan Status Feedback */}
        {scanStatus === 'success' && detectedAsset && (
          <div className="p-2 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-[#0F682C] flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold truncate">
              Detected [{detectedAsset.assetTag}] {detectedAsset.name}
            </span>
          </div>
        )}

        {scanStatus === 'not_found' && (
          <div className="p-2 rounded bg-[#FDF0EE] border border-[#F6B8B3] text-[#A81F1A] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="truncate">Hardware not found in fleet catalog.</span>
            </div>
            {onNewAssetScan && (
              <button
                onClick={() => {
                  onClose();
                  onNewAssetScan(manualInput);
                }}
                className="font-bold underline text-[11px] shrink-0 cursor-pointer"
              >
                Intake
              </button>
            )}
          </div>
        )}

        {/* Manual Barcode / Serial Entry */}
        <form onSubmit={handleManualSubmit} className="space-y-1.5">
          <label className="block text-[10px] uppercase text-[#686B6D] font-bold">
            Direct Barcode / Serial Lookup
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="Scan or enter AST-8821, serial..."
                className="w-full h-8 pl-7 pr-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
              <Search className="w-3.5 h-3.5 text-[#7A7D80] absolute left-2 top-2.5 pointer-events-none" />
            </div>
            <SkeuoButton size="sm" variant="primary" type="submit">
              Lookup
            </SkeuoButton>
          </div>
        </form>

        {/* Quick Simulation Trigger Buttons */}
        <div className="pt-2 border-t border-[#DFDDD6]">
          <span className="text-[10px] uppercase text-[#686B6D] block mb-1">
            Simulate Scan (Test Triggers):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {assets.slice(0, 3).map(asset => (
              <button
                key={asset.id}
                type="button"
                onClick={() => processBarcodeValue(asset.assetTag)}
                className="px-2 py-1 rounded ti-btn font-mono text-[10px] text-[#181A1B] hover:text-[#C66A2B] cursor-pointer"
              >
                {asset.assetTag}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
