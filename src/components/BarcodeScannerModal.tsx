import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, Scan, Zap, RefreshCw, AlertCircle, CheckCircle, Search, Laptop, Monitor, Radio } from 'lucide-react';
import { Asset } from '../types';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';

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
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera stream
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      {/* Skeuomorphic Scanner Enclosure */}
      <div className="w-full max-w-2xl skeuo-metal-panel rounded-2xl p-6 relative flex flex-col border-2 border-[#333b49] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)]">
        
        {/* Chassis corner screws */}
        <div className="absolute top-3.5 left-3.5"><ScrewHead rotation={28} /></div>
        <div className="absolute top-3.5 right-3.5"><ScrewHead rotation={112} /></div>
        <div className="absolute bottom-3.5 left-3.5"><ScrewHead rotation={74} /></div>
        <div className="absolute bottom-3.5 right-3.5"><ScrewHead rotation={195} /></div>

        {/* Scanner Head Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeuo-recessed flex items-center justify-center border border-slate-700/60">
              <Scan className="w-5 h-5 text-sky-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-wide uppercase text-slate-100 text-engraved font-mono">
                  Optical Barcode & Tag Scanner
                </h3>
                <LedIndicator 
                  color={scanStatus === 'success' ? 'green' : scanStatus === 'not_found' ? 'red' : 'blue'} 
                  pulse={scanStatus === 'scanning'} 
                />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Model: SYS-SCN-4K • Code 128 / EAN / QR / GSX Serial
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg skeuo-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Optical Sensor Glass Bay */}
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden skeuo-recessed border-2 border-slate-700/80 flex items-center justify-center">
          
          {/* Glass glare effect */}
          <div className="absolute inset-0 scanner-lens pointer-events-none z-20" />

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
              <div className="w-14 h-14 rounded-full skeuo-recessed flex items-center justify-center border border-slate-700 mb-3">
                <Camera className="w-7 h-7 text-slate-500" />
              </div>
              <p className="text-sm text-slate-300 font-mono mb-1 font-semibold">
                {cameraError ? 'Optical Stream Standby' : 'Initializing High-Speed Sensor...'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {cameraError 
                  ? 'Camera permission denied or device not detected. Use test presets or manual input below.'
                  : 'Align barcode inside the red target zone for automated recognition.'}
              </p>
              {cameraError && (
                <div className="mt-3">
                  <SkeuoButton size="sm" onClick={startCamera} icon={<RefreshCw className="w-3.5 h-3.5" />}>
                    Retry Sensor
                  </SkeuoButton>
                </div>
              )}
            </div>
          )}

          {/* Red Laser Sweep */}
          <div className="laser-line z-30 pointer-events-none" />

          {/* Target Reticle Brackets */}
          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-64 h-36 border border-sky-400/40 rounded-lg relative shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              {/* Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-sky-400" />
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-sky-400" />
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-sky-400" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-sky-400" />
              
              {/* Center Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500/80 animate-ping" />
              </div>

              <div className="absolute bottom-1 right-2 text-[9px] font-mono text-sky-400/80 uppercase">
                TARGET ACQUISITION
              </div>
            </div>
          </div>

          {/* Status Overlay */}
          {scanStatus === 'success' && detectedAsset && (
            <div className="absolute inset-0 z-40 bg-emerald-950/80 backdrop-blur-xs flex flex-col items-center justify-center p-4">
              <CheckCircle className="w-12 h-12 text-emerald-400 mb-2 animate-bounce" />
              <div className="text-base font-bold text-white font-mono">ASSET IDENTIFIED!</div>
              <div className="text-xs text-emerald-300 font-mono mt-1">
                {detectedAsset.assetTag} • {detectedAsset.name}
              </div>
              <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                Serial: {detectedAsset.serialNumber} • Status: {detectedAsset.status}
              </div>
            </div>
          )}

          {scanStatus === 'not_found' && (
            <div className="absolute inset-0 z-40 bg-red-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
              <AlertCircle className="w-10 h-10 text-red-400 mb-2" />
              <div className="text-sm font-bold text-white font-mono">UNKNOWN TAG / BARCODE</div>
              <p className="text-xs text-red-200 mt-1 max-w-xs">
                No matching hardware found in SysAssist database for &ldquo;{manualInput}&rdquo;.
              </p>
              <div className="flex gap-2 mt-3">
                <SkeuoButton size="sm" onClick={() => setScanStatus('scanning')}>
                  Scan Again
                </SkeuoButton>
                {onNewAssetScan && (
                  <SkeuoButton 
                    size="sm" 
                    variant="emerald" 
                    onClick={() => {
                      onNewAssetScan(manualInput);
                      onClose();
                    }}
                  >
                    Provision as New Asset
                  </SkeuoButton>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manual Barcode / Serial Direct Input */}
        <form onSubmit={handleManualSubmit} className="mt-4 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter Barcode, Serial (e.g. C02G4190MD6R), or Tag (AST-8821)..."
              className="w-full h-11 px-4 skeuo-recessed rounded-xl text-sm font-mono text-sky-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/80 border border-slate-700/60"
            />
            <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>
          <SkeuoButton type="submit" variant="accent">
            Lookup
          </SkeuoButton>
        </form>

        {/* Quick Test Barcode Presets */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
              Test Presets (Simulate Hardware Laser Scan):
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Click to instant-scan
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {assets.slice(0, 4).map(asset => (
              <button
                key={asset.id}
                type="button"
                onClick={() => processBarcodeValue(asset.barcode)}
                className="p-2.5 rounded-lg skeuo-card border border-slate-700/60 hover:border-sky-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono text-sky-400 font-bold">
                    {asset.assetTag}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                    {asset.category}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                  {asset.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                  BAR: {asset.barcode}
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
