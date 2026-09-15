import React, { useState, useEffect } from 'react';
import { X, Plus, ShieldCheck, Cpu, HardDrive, RefreshCw, CheckCircle2, Laptop } from 'lucide-react';
import { Asset, AssetCategory, ChangeLogEntry } from '../types';
import { AppleApiService } from '../services/appleService';
import { soundFx } from '../services/audioService';
import { SkeuoButton } from './SkeuoComponents';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: Asset, initialLog: ChangeLogEntry) => void;
  initialBarcode?: string;
  currentUser: string;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
  initialBarcode = '',
  currentUser
}) => {
  const [name, setName] = useState<string>('MacBook Pro 16" M3 Max');
  const [manufacturer, setManufacturer] = useState<string>('Apple');
  const [model, setModel] = useState<string>('MacBookPro18,2 (A2485)');
  const [category, setCategory] = useState<AssetCategory>('Laptop');
  const [serialNumber, setSerialNumber] = useState<string>('C02G4190MD6R');
  const [barcode, setBarcode] = useState<string>(initialBarcode || `88${Date.now().toString().slice(-8)}`);
  const [location, setLocation] = useState<string>('IT Depot - Rack Bay 01');
  const [purchasePrice, setPurchasePrice] = useState<number>(3499.00);
  const [supplier, setSupplier] = useState<string>('Apple Direct Enterprise');
  const [processor, setProcessor] = useState<string>('Apple M3 Max (16-core CPU, 40-core GPU)');
  const [ram, setRam] = useState<string>('64 GB Unified Memory');
  const [storage, setStorage] = useState<string>('2 TB NVMe Solid State Drive');
  const [isQueryingApple, setIsQueryingApple] = useState<boolean>(false);
  const [appleQueried, setAppleQueried] = useState<boolean>(false);

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

  if (!isOpen) return null;

  const handleQueryAppleSpecs = async () => {
    if (!serialNumber.trim()) return;
    setIsQueryingApple(true);
    soundFx.playMechanicalClick();
    try {
      const result = await AppleApiService.fetchCoverageBySerial(serialNumber);
      setName(result.modelName);
      setProcessor(result.specs.processor);
      setRam(result.specs.ram);
      setStorage(result.specs.storage);
      setAppleQueried(true);
      soundFx.playReassignSuccess();
    } finally {
      setIsQueryingApple(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetTag = `AST-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const isApple = manufacturer.toLowerCase() === 'apple';

    const newAsset: Asset = {
      id: `ast-${Date.now()}`,
      assetTag,
      barcode: barcode || `88${Date.now().toString().slice(-8)}`,
      name,
      manufacturer,
      model,
      category,
      serialNumber,
      status: 'In Stock',
      location,
      assignedTo: null,
      purchaseDate: now.slice(0, 10),
      purchasePrice,
      supplier,
      warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      specs: {
        processor,
        ram,
        storage
      },
      appleCoverage: isApple ? {
        isAppleDevice: true,
        modelName: name,
        serialNumber,
        purchaseDate: now.slice(0, 10),
        warrantyStatus: 'Active AppleCare+',
        coverageEndDate: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
        agreementNumber: `AGR-ACPLUS-${Math.floor(1000000 + Math.random() * 9000000)}`,
        appleCareEligible: false,
        hardwareCoverage: 'Covered',
        techSupportCoverage: 'Active',
        lastSyncTimestamp: now
      } : undefined,
      changeLogs: []
    };

    const initialLog: ChangeLogEntry = {
      id: `log-${Date.now()}`,
      assetId: newAsset.id,
      assetTag: newAsset.assetTag,
      assetName: newAsset.name,
      timestamp: now,
      performedBy: currentUser,
      action: 'CREATED',
      property: 'Fleet Record',
      oldValue: 'Unregistered',
      newValue: `Provisioned into ${location} (Status: In Stock)`,
      reason: `New hardware intake. Serial: ${serialNumber}`
    };

    newAsset.changeLogs = [initialLog];

    soundFx.playReassignSuccess();
    onAddAsset(newAsset, initialLog);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intake-modal-title"
    >
      <div className="w-full max-w-2xl max-h-[92vh] flex flex-col instrument-panel rounded-2xl border border-white/[0.09] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.07] bg-[#12151b] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl instrument-well flex items-center justify-center border border-white/[0.05] text-emerald-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 id="intake-modal-title" className="text-base font-sans font-bold text-slate-100">
                Provision New Hardware Asset
              </h3>
              <p className="text-xs font-sans text-slate-400">
                Log equipment barcode, serial number, and query Apple specifications
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg instrument-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close intake modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Quick Apple GSX Serial Lookup */}
          <div className="p-3.5 rounded-xl instrument-well border border-blue-600/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-semibold text-blue-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                Apple GSX Serial Number Auto-Detection (Demo)
              </span>
              {appleQueried && (
                <span className="text-[10px] text-emerald-400 font-sans font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Specs Verified
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. C02G4190MD6R"
                className="flex-1 h-9 px-3 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.08] focus:border-blue-500 focus:outline-none"
              />
              <SkeuoButton
                type="button"
                size="sm"
                variant="primary"
                disabled={isQueryingApple || !serialNumber}
                onClick={handleQueryAppleSpecs}
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isQueryingApple ? 'animate-spin' : ''}`} />}
              >
                {isQueryingApple ? 'Querying...' : 'Fetch Specs'}
              </SkeuoButton>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Enter any Apple serial to auto-populate Processor, RAM, Storage, and model name.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Asset Name / Description *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Hardware Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="Laptop">Laptop / Workstation</option>
                <option value="Monitor">Monitor / Display</option>
                <option value="Peripheral">Peripheral / Dock / Input</option>
                <option value="Storage">Storage / Network Device</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                required
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Model Identifier
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Barcode Number
              </label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Initial Depot Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Purchase Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Supplier / Channel
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Specifications Breakdown */}
          <div className="p-3.5 rounded-xl instrument-card space-y-3">
            <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-200">
              Technical Hardware Specifications
            </h4>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-sans text-slate-400 mb-1">Processor / SoC</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  className="w-full h-8 px-2.5 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-sans text-slate-400 mb-1">Memory (RAM)</label>
                  <input
                    type="text"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    className="w-full h-8 px-2.5 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-sans text-slate-400 mb-1">Storage (SSD / NVMe)</label>
                  <input
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    className="w-full h-8 px-2.5 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <SkeuoButton
              type="button"
              variant="subtle"
              onClick={onClose}
            >
              Cancel
            </SkeuoButton>

            <SkeuoButton
              type="submit"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Provision into Stock
            </SkeuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
