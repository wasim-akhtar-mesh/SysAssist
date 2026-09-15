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
      newValue: `Enrolled into ${location} (In Stock)`,
      reason: `New hardware intake. Serial: ${serialNumber}`
    };

    newAsset.changeLogs = [initialLog];
    soundFx.playReassignSuccess();
    onAddAsset(newAsset, initialLog);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-modal-title"
    >
      <div className="w-full max-w-xl ti-card rounded-lg p-5 border border-[#C5C3BC] shadow-2xl relative flex flex-col max-h-[92vh] overflow-y-auto text-xs">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DFDDD6] mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 id="add-modal-title" className="text-sm font-bold text-[#181A1B]">
                Intake Hardware Asset
              </h3>
              <p className="text-[11px] text-[#686B6D]">
                Register new equipment into SysAssist depot inventory
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded ti-btn flex items-center justify-center text-[#686B6D] hover:text-[#181A1B] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Quick Apple GSX Serial Lookup */}
          <div className="p-2.5 rounded ti-surface border border-[#C5C3BC] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <div>
                <span className="text-xs font-semibold text-[#181A1B] block">Apple GSX Entitlement Check</span>
                <span className="text-[10px] text-[#686B6D]">Auto-populate hardware specs via serial query</span>
              </div>
            </div>

            <SkeuoButton
              type="button"
              size="sm"
              variant="standard"
              onClick={handleQueryAppleSpecs}
              disabled={isQueryingApple || !serialNumber}
              icon={<RefreshCw className={`w-3 h-3 ${isQueryingApple ? 'animate-spin' : ''}`} />}
            >
              {isQueryingApple ? 'Querying...' : 'Lookup Serial'}
            </SkeuoButton>
          </div>

          {appleQueried && (
            <div className="p-2 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-[11px] text-[#0F682C] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apple GSX verified: {name} ({processor})</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Device Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full h-8 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
              >
                <option value="Laptop">Laptop</option>
                <option value="Display">Display / Monitor</option>
                <option value="Dock">Thunderbolt Dock</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Audio/Headset">Audio / Headset</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Hardware Model</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Serial Number</label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Chassis Barcode</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Depot Storage Bay</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded ti-surface border border-[#C5C3BC] space-y-2">
            <span className="text-[10px] uppercase text-[#686B6D] font-bold block">Detailed Technical Specs</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">CPU / SoC</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">RAM</label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Storage SSD</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFDDD6]">
            <SkeuoButton size="sm" variant="subtle" type="button" onClick={onClose}>
              Cancel
            </SkeuoButton>
            <SkeuoButton size="sm" variant="primary" type="submit">
              Register Hardware Asset
            </SkeuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
