import React, { useState } from 'react';
import { X, Plus, ShieldCheck, Cpu, HardDrive, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Asset, AssetCategory, ChangeLogEntry } from '../types';
import { AppleApiService } from '../services/appleService';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl my-auto skeuo-metal-panel rounded-2xl p-6 relative border-2 border-[#374151] shadow-2xl">
        <div className="absolute top-3 left-3"><ScrewHead rotation={33} /></div>
        <div className="absolute top-3 right-3"><ScrewHead rotation={140} /></div>
        <div className="absolute bottom-3 left-3"><ScrewHead rotation={80} /></div>
        <div className="absolute bottom-3 right-3"><ScrewHead rotation={210} /></div>

        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl skeuo-recessed flex items-center justify-center border border-slate-700">
              <Plus className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold font-mono uppercase text-slate-100">
                Provision New Hardware Asset
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Log equipment barcode, serial, and fetch Apple specifications
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">EQUIPMENT CATEGORY *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              >
                <option value="Laptop">Laptop (MacBook / PC)</option>
                <option value="Display">Display / 4K Monitor</option>
                <option value="Dock">Thunderbolt 4 Dock</option>
                <option value="Keyboard">Mechanical Keyboard</option>
                <option value="Mouse">Ergonomic Mouse</option>
                <option value="Audio/Headset">Audio / Headset</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">MANUFACTURER *</label>
              <select
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              >
                <option value="Apple">Apple</option>
                <option value="Dell">Dell</option>
                <option value="Lenovo">Lenovo</option>
                <option value="CalDigit">CalDigit</option>
                <option value="Logitech">Logitech</option>
                <option value="Sony">Sony</option>
                <option value="Keychron">Keychron</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">EQUIPMENT MODEL NAME *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">SERIAL NUMBER *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="e.g. C02G4190MD6R"
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700 uppercase"
                />
                {manufacturer.toLowerCase() === 'apple' && (
                  <SkeuoButton
                    type="button"
                    size="sm"
                    variant="accent"
                    onClick={handleQueryAppleSpecs}
                    disabled={isQueryingApple}
                    title="Query Apple Coverage API"
                  >
                    {isQueryingApple ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'GSX'}
                  </SkeuoButton>
                )}
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">BARCODE VALUE *</label>
              <input
                type="text"
                required
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">STORAGE / DEPOT BAY</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">PURCHASE PRICE ($)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-100 border border-slate-700"
              />
            </div>
          </div>

          {/* Specs Panel */}
          <div className="skeuo-card p-3.5 rounded-xl border border-slate-700/60 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <span className="text-slate-300 font-bold uppercase">Hardware Specifications</span>
              {appleQueried && (
                <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                  <CheckCircle2 className="w-3 h-3" /> Populated from Apple API
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block">PROCESSOR</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  className="w-full h-8 px-2.5 skeuo-recessed rounded text-slate-200 border border-slate-800 text-[11px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block">RAM</label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  className="w-full h-8 px-2.5 skeuo-recessed rounded text-slate-200 border border-slate-800 text-[11px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block">INTERNAL SSD</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  className="w-full h-8 px-2.5 skeuo-recessed rounded text-slate-200 border border-slate-800 text-[11px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
            <SkeuoButton type="button" size="sm" onClick={onClose}>
              Cancel
            </SkeuoButton>
            <SkeuoButton type="submit" variant="emerald" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
              Commit to Inventory
            </SkeuoButton>
          </div>
        </form>
      </div>
    </div>
  );
};
