import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ShieldCheck, Cpu, HardDrive, RefreshCw, CheckCircle2, Laptop } from 'lucide-react';
import { Asset, AssetCategory, ChangeLogEntry } from '../types';
import { AppleApiService } from '../services/appleService';
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
  const [name, setName] = useState<string>('');
  const [manufacturer, setManufacturer] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [category, setCategory] = useState<AssetCategory>('Laptop');
  const [serialNumber, setSerialNumber] = useState<string>('');
  const [barcode, setBarcode] = useState<string>('');
  const [location, setLocation] = useState<string>('IT Depot - Rack Bay 01');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [supplier, setSupplier] = useState<string>('');
  const [processor, setProcessor] = useState<string>('');
  const [ram, setRam] = useState<string>('');
  const [storage, setStorage] = useState<string>('');
  const [isQueryingApple, setIsQueryingApple] = useState<boolean>(false);
  const [appleQueried, setAppleQueried] = useState<boolean>(false);

  const prevIsOpenRef = useRef(false);

  // Initialize and synchronize form state upon modal opening
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Newly opened: fresh intake state
      setName('');
      setManufacturer('Apple');
      setModel('');
      setCategory('Laptop');
      setSerialNumber('');
      setBarcode(initialBarcode || `88${Math.floor(10000000 + Math.random() * 90000000)}`);
      setLocation('IT Depot - Rack Bay 01');
      setPurchasePrice(0);
      setSupplier('Apple Direct Enterprise');
      setProcessor('');
      setRam('');
      setStorage('');
      setAppleQueried(false);
      setIsQueryingApple(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialBarcode]);

  // Synchronize incoming barcode from scanner if it arrives while modal is opened
  useEffect(() => {
    if (isOpen && initialBarcode && initialBarcode !== barcode) {
      setBarcode(initialBarcode);
    }
  }, [isOpen, initialBarcode, barcode]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setManufacturer('');
    setModel('');
    setCategory('Laptop');
    setSerialNumber('');
    setBarcode('');
    setLocation('IT Depot - Rack Bay 01');
    setPurchasePrice(0);
    setSupplier('');
    setProcessor('');
    setRam('');
    setStorage('');
    setAppleQueried(false);
    setIsQueryingApple(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  const handleQueryAppleSpecs = async () => {
    if (!serialNumber.trim()) return;
    setIsQueryingApple(true);
    try {
      const result = await AppleApiService.fetchCoverageBySerial(serialNumber);
      setName(result.modelName);
      setManufacturer('Apple');
      setProcessor(result.specs.processor);
      setRam(result.specs.ram);
      setStorage(result.specs.storage);
      setAppleQueried(true);
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
      name: name.trim() || `${manufacturer} ${model || category}`.trim() || 'New Equipment',
      manufacturer: manufacturer.trim() || 'Enterprise Hardware',
      model: model.trim() || 'Generic Model',
      category,
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      status: 'In Stock',
      location: location.trim() || 'IT Depot - Rack Bay 01',
      assignedTo: null,
      purchaseDate: now.slice(0, 10),
      purchasePrice: Number(purchasePrice) || 0,
      supplier: supplier.trim() || 'Enterprise Supplier',
      warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 3600 * 1000).toISOString().slice(0, 10),
      specs: {
        processor: processor.trim(),
        ram: ram.trim(),
        storage: storage.trim()
      },
      appleCoverage: isApple ? {
        isAppleDevice: true,
        modelName: name || 'Apple Device',
        serialNumber: serialNumber.trim(),
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
      newValue: `Enrolled into ${newAsset.location} (In Stock)`,
      reason: `New hardware intake. Serial: ${newAsset.serialNumber}`
    };

    newAsset.changeLogs = [initialLog];
    onAddAsset(newAsset, initialLog);
    resetForm();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
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
              <h2 id="add-modal-title" className="text-sm font-bold text-[#181A1B]">
                Hardware Intake & Provisioning
              </h2>
              <span className="text-[10px] text-[#686B6D]">
                Enroll new equipment into the enterprise fleet catalog
              </span>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded ti-btn text-[#686B6D] hover:text-[#181A1B] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AssetCategory)}
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              >
                <option value="Laptop">Laptop</option>
                <option value="Display">Display</option>
                <option value="Dock">Dock</option>
                <option value="Keyboard">Keyboard</option>
                <option value="Mouse">Mouse</option>
                <option value="Audio/Headset">Audio/Headset</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Apple, Dell, Lenovo"
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Equipment Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MacBook Pro 16&quot; M3 Max"
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Model Code</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. MacBookPro18,2 (A2485)"
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>
          </div>

          {/* Serial Number & GSX Lookup Strip */}
          <div className="p-3 rounded ti-surface border border-[#C5C3BC] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase text-[#686B6D] font-bold">Serial Number & GSX Validation</label>
              {appleQueried && (
                <span className="text-[10px] text-[#0F682C] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> GSX Verified
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                placeholder="e.g. C02G4190MD6R"
                required
                className="flex-1 h-8 px-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC] tracking-wider"
              />
              <SkeuoButton
                type="button"
                size="sm"
                variant="accent"
                onClick={handleQueryAppleSpecs}
                disabled={isQueryingApple || !serialNumber.trim()}
                icon={isQueryingApple ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              >
                GSX Query
              </SkeuoButton>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Barcode (Code 128)</label>
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Depot Storage Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Purchase Price ($ USD)</label>
              <input
                type="number"
                step="0.01"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Enterprise Supplier</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Apple Direct, CDW"
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>

          <div className="p-2.5 rounded ti-surface border border-[#C5C3BC] space-y-2">
            <span className="text-[10px] uppercase text-[#686B6D] font-bold block">Detailed Technical Specs</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">CPU / Processor</label>
                <input
                  type="text"
                  value={processor}
                  onChange={(e) => setProcessor(e.target.value)}
                  placeholder="e.g. Apple M3 Max"
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">RAM</label>
                <input
                  type="text"
                  value={ram}
                  onChange={(e) => setRam(e.target.value)}
                  placeholder="e.g. 64 GB"
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Storage SSD</label>
                <input
                  type="text"
                  value={storage}
                  onChange={(e) => setStorage(e.target.value)}
                  placeholder="e.g. 2 TB NVMe"
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFDDD6]">
            <SkeuoButton size="sm" variant="subtle" type="button" onClick={handleCancel}>
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
