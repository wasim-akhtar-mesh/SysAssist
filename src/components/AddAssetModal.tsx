import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, ShieldCheck, RefreshCw, CheckCircle2, Laptop, Monitor, Boxes, Keyboard as KeyboardIcon, Mouse as MouseIcon, Headphones, HelpCircle } from 'lucide-react';
import { Asset, AssetCategory, ChangeLogEntry, HardwareSpecs } from '../types';
import { AppleApiService } from '../services/appleService';
import { SkeuoButton } from './SkeuoComponents';
import { 
  generateUniqueAssetTag, 
  generateUniqueAssetId, 
  generateUniqueBarcode, 
  generateUniqueLogId 
} from '../utils/idGenerator';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAsset: (asset: Asset, initialLog: ChangeLogEntry) => void;
  initialBarcode?: string;
  currentUser: string;
  existingAssets?: Asset[];
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAddAsset,
  initialBarcode = '',
  currentUser,
  existingAssets = []
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
  
  // Category-aware specification state
  // Laptop
  const [processor, setProcessor] = useState<string>('');
  const [ram, setRam] = useState<string>('');
  const [storage, setStorage] = useState<string>('');
  const [display, setDisplay] = useState<string>('');
  
  // Display
  const [screenSize, setScreenSize] = useState<string>('');
  const [resolution, setResolution] = useState<string>('');
  const [connectionPorts, setConnectionPorts] = useState<string>('');
  const [refreshRate, setRefreshRate] = useState<string>('');

  // Dock
  const [connectionStandard, setConnectionStandard] = useState<string>('');
  const [dockPorts, setDockPorts] = useState<string>('');
  const [powerDelivery, setPowerDelivery] = useState<string>('');

  // Keyboard
  const [keyboardLayout, setKeyboardLayout] = useState<string>('');
  const [switchType, setSwitchType] = useState<string>('');
  const [keyboardConnectivity, setKeyboardConnectivity] = useState<string>('');

  // Mouse
  const [mouseConnectivity, setMouseConnectivity] = useState<string>('');
  const [sensorType, setSensorType] = useState<string>('');
  const [dpi, setDpi] = useState<string>('');

  // Audio / Headset
  const [audioConnectivity, setAudioConnectivity] = useState<string>('');
  const [batteryLife, setBatteryLife] = useState<string>('');
  const [audioFeatures, setAudioFeatures] = useState<string>('');

  // Other / Generic
  const [generalSpecs, setGeneralSpecs] = useState<string>('');

  const [isQueryingApple, setIsQueryingApple] = useState<boolean>(false);
  const [appleQueried, setAppleQueried] = useState<boolean>(false);

  const prevIsOpenRef = useRef(false);

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
    setDisplay('');
    setScreenSize('');
    setResolution('');
    setConnectionPorts('');
    setRefreshRate('');
    setConnectionStandard('');
    setDockPorts('');
    setPowerDelivery('');
    setKeyboardLayout('');
    setSwitchType('');
    setKeyboardConnectivity('');
    setMouseConnectivity('');
    setSensorType('');
    setDpi('');
    setAudioConnectivity('');
    setBatteryLife('');
    setAudioFeatures('');
    setGeneralSpecs('');
    setAppleQueried(false);
    setIsQueryingApple(false);
  };

  // Apply initial barcode ONCE when a new intake session opens, and initialize defaults
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      // Fresh intake session
      resetForm();
      setManufacturer('Apple');
      setCategory('Laptop');
      setSupplier('Apple Direct Enterprise');
      // Apply initialBarcode if passed from scanner, otherwise generate fresh collision-safe barcode
      const initialBc = initialBarcode.trim() || generateUniqueBarcode(existingAssets);
      setBarcode(initialBc);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialBarcode, existingAssets]);

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
      if (result.specs.processor) setProcessor(result.specs.processor);
      if (result.specs.ram) setRam(result.specs.ram);
      if (result.specs.storage) setStorage(result.specs.storage);
      setAppleQueried(true);
    } finally {
      setIsQueryingApple(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assetTag = generateUniqueAssetTag(existingAssets);
    const assetId = generateUniqueAssetId(existingAssets);
    const finalBarcode = barcode.trim() || generateUniqueBarcode(existingAssets);
    const now = new Date().toISOString();
    const isApple = manufacturer.toLowerCase() === 'apple';

    // Construct category-aware specs
    const specs: HardwareSpecs = {};
    if (category === 'Laptop') {
      if (processor.trim()) specs.processor = processor.trim();
      if (ram.trim()) specs.ram = ram.trim();
      if (storage.trim()) specs.storage = storage.trim();
      if (display.trim()) specs.display = display.trim();
    } else if (category === 'Display') {
      if (screenSize.trim()) specs.screenSize = screenSize.trim();
      if (resolution.trim()) specs.resolution = resolution.trim();
      if (connectionPorts.trim()) specs.connectionPorts = connectionPorts.trim();
      if (refreshRate.trim()) specs.refreshRate = refreshRate.trim();
    } else if (category === 'Dock') {
      if (connectionStandard.trim()) specs.connectionStandard = connectionStandard.trim();
      if (dockPorts.trim()) specs.ports = dockPorts.trim();
      if (powerDelivery.trim()) specs.powerDelivery = powerDelivery.trim();
    } else if (category === 'Keyboard') {
      if (keyboardLayout.trim()) specs.keyboardLayout = keyboardLayout.trim();
      if (switchType.trim()) specs.switchType = switchType.trim();
      if (keyboardConnectivity.trim()) specs.connectivity = keyboardConnectivity.trim();
    } else if (category === 'Mouse') {
      if (mouseConnectivity.trim()) specs.connectivity = mouseConnectivity.trim();
      if (sensorType.trim()) specs.sensorType = sensorType.trim();
      if (dpi.trim()) specs.dpi = dpi.trim();
    } else if (category === 'Audio/Headset') {
      if (audioConnectivity.trim()) specs.connectivity = audioConnectivity.trim();
      if (batteryLife.trim()) specs.batteryLife = batteryLife.trim();
      if (audioFeatures.trim()) specs.audioFeatures = audioFeatures.trim();
    } else {
      if (generalSpecs.trim()) specs.generalSpecs = generalSpecs.trim();
    }

    const newAsset: Asset = {
      id: assetId,
      assetTag,
      barcode: finalBarcode,
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
      specs,
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
      id: generateUniqueLogId(),
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
            className="p-1 rounded ti-btn text-[#686B6D] hover:text-[#181A1B] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#C66A2B] focus-visible:outline-hidden"
            aria-label="Close dialog"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="intake-category" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Category</label>
              <select
                id="intake-category"
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
              <label htmlFor="intake-manufacturer" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Manufacturer</label>
              <input
                id="intake-manufacturer"
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
              <label htmlFor="intake-name" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Equipment Name</label>
              <input
                id="intake-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. MacBook Pro 16&quot; M3 Max"
                required
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div>
              <label htmlFor="intake-model" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Model Code</label>
              <input
                id="intake-model"
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
              <label htmlFor="intake-serial" className="text-[10px] uppercase text-[#686B6D] font-bold">Serial Number & GSX Validation</label>
              {appleQueried && (
                <span className="text-[10px] text-[#0F682C] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> GSX Verified
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                id="intake-serial"
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
              <label htmlFor="intake-barcode" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">
                Barcode (Code 128)
              </label>
              <input
                id="intake-barcode"
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                required
                className="w-full h-8 px-2 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div>
              <label htmlFor="intake-location" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Depot Storage Location</label>
              <input
                id="intake-location"
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
              <label htmlFor="intake-price" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Purchase Price ($ USD)</label>
              <input
                id="intake-price"
                type="number"
                step="0.01"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>

            <div>
              <label htmlFor="intake-supplier" className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Enterprise Supplier</label>
              <input
                id="intake-supplier"
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Apple Direct, CDW"
                className="w-full h-8 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>

          {/* Category-Specific Technical Specs Section */}
          <div className="p-2.5 rounded ti-surface border border-[#C5C3BC] space-y-2">
            <span className="text-[10px] uppercase text-[#686B6D] font-bold block">
              {category} Technical Specifications
            </span>

            {/* Laptop Specs */}
            {category === 'Laptop' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-cpu" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">CPU / Processor</label>
                  <input
                    id="spec-cpu"
                    type="text"
                    value={processor}
                    onChange={(e) => setProcessor(e.target.value)}
                    placeholder="e.g. Apple M3 Max"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-ram" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">RAM</label>
                  <input
                    id="spec-ram"
                    type="text"
                    value={ram}
                    onChange={(e) => setRam(e.target.value)}
                    placeholder="e.g. 64 GB"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-storage" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Storage SSD</label>
                  <input
                    id="spec-storage"
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="e.g. 2 TB NVMe"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Display Specs */}
            {category === 'Display' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-size-res" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Size & Resolution</label>
                  <input
                    id="spec-size-res"
                    type="text"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="e.g. 27-inch 5K (5120x2880)"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-display-ports" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Connection Ports</label>
                  <input
                    id="spec-display-ports"
                    type="text"
                    value={connectionPorts}
                    onChange={(e) => setConnectionPorts(e.target.value)}
                    placeholder="e.g. Thunderbolt 3, HDMI 2.1"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-refresh" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Refresh Rate</label>
                  <input
                    id="spec-refresh"
                    type="text"
                    value={refreshRate}
                    onChange={(e) => setRefreshRate(e.target.value)}
                    placeholder="e.g. 60 Hz or 144 Hz"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Dock Specs */}
            {category === 'Dock' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-dock-std" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Connection Standard</label>
                  <input
                    id="spec-dock-std"
                    type="text"
                    value={connectionStandard}
                    onChange={(e) => setConnectionStandard(e.target.value)}
                    placeholder="e.g. Thunderbolt 4 / USB4"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-dock-ports" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">I/O Ports</label>
                  <input
                    id="spec-dock-ports"
                    type="text"
                    value={dockPorts}
                    onChange={(e) => setDockPorts(e.target.value)}
                    placeholder="e.g. 18 Ports (TB4, USB-A, 2.5GbE)"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-dock-pd" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Power Delivery</label>
                  <input
                    id="spec-dock-pd"
                    type="text"
                    value={powerDelivery}
                    onChange={(e) => setPowerDelivery(e.target.value)}
                    placeholder="e.g. 98W Host PD"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Keyboard Specs */}
            {category === 'Keyboard' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-kb-layout" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Keyboard Layout</label>
                  <input
                    id="spec-kb-layout"
                    type="text"
                    value={keyboardLayout}
                    onChange={(e) => setKeyboardLayout(e.target.value)}
                    placeholder="e.g. 75% ANSI (82 Keys)"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-kb-switch" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Switch Type</label>
                  <input
                    id="spec-kb-switch"
                    type="text"
                    value={switchType}
                    onChange={(e) => setSwitchType(e.target.value)}
                    placeholder="e.g. Tactile Brown, Linear Red"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-kb-conn" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Connectivity</label>
                  <input
                    id="spec-kb-conn"
                    type="text"
                    value={keyboardConnectivity}
                    onChange={(e) => setKeyboardConnectivity(e.target.value)}
                    placeholder="e.g. Bluetooth 5.1 & USB-C Wired"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Mouse Specs */}
            {category === 'Mouse' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-mouse-conn" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Connectivity</label>
                  <input
                    id="spec-mouse-conn"
                    type="text"
                    value={mouseConnectivity}
                    onChange={(e) => setMouseConnectivity(e.target.value)}
                    placeholder="e.g. 2.4GHz Wireless & Bluetooth"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-mouse-sensor" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Sensor Type</label>
                  <input
                    id="spec-mouse-sensor"
                    type="text"
                    value={sensorType}
                    onChange={(e) => setSensorType(e.target.value)}
                    placeholder="e.g. Darkfield Optical Sensor"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-mouse-dpi" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">DPI / Precision</label>
                  <input
                    id="spec-mouse-dpi"
                    type="text"
                    value={dpi}
                    onChange={(e) => setDpi(e.target.value)}
                    placeholder="e.g. 8,000 DPI"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Audio / Headset Specs */}
            {category === 'Audio/Headset' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label htmlFor="spec-audio-conn" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Connectivity</label>
                  <input
                    id="spec-audio-conn"
                    type="text"
                    value={audioConnectivity}
                    onChange={(e) => setAudioConnectivity(e.target.value)}
                    placeholder="e.g. Bluetooth 5.2 / 3.5mm"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-audio-battery" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Battery Life</label>
                  <input
                    id="spec-audio-battery"
                    type="text"
                    value={batteryLife}
                    onChange={(e) => setBatteryLife(e.target.value)}
                    placeholder="e.g. 30 Hours ANC Active"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
                <div>
                  <label htmlFor="spec-audio-features" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">Audio Features</label>
                  <input
                    id="spec-audio-features"
                    type="text"
                    value={audioFeatures}
                    onChange={(e) => setAudioFeatures(e.target.value)}
                    placeholder="e.g. Active Noise Canceling"
                    className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                  />
                </div>
              </div>
            )}

            {/* Other Specs */}
            {category === 'Other' && (
              <div>
                <label htmlFor="spec-general" className="block text-[9px] uppercase text-[#686B6D] mb-0.5">General Metadata & Specifications</label>
                <input
                  id="spec-general"
                  type="text"
                  value={generalSpecs}
                  onChange={(e) => setGeneralSpecs(e.target.value)}
                  placeholder="e.g. USB-C to DisplayPort 1.4 Adapter Cable, 2m"
                  className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC]"
                />
              </div>
            )}
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
