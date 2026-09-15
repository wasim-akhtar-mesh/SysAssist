import React, { useState } from 'react';
import { 
  Laptop, 
  Boxes, 
  History, 
  Volume2, 
  VolumeX, 
  Scan, 
  Layers, 
  User,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { SysAssistWordmark } from './BrandLogo';
import { SkeuoButton, LedIndicator } from './SkeuoComponents';
import { soundFx } from '../services/audioService';

interface HeaderBarProps {
  activeTab: 'inventory' | 'stock_tracker' | 'jira' | 'audit_trail';
  onSelectTab: (tab: 'inventory' | 'stock_tracker' | 'jira' | 'audit_trail') => void;
  onOpenScanner: () => void;
  onOpenAddAsset: () => void;
  openJiraCount: number;
  lowStockCount: number;
  totalAssetsCount: number;
  currentUser: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenAddAsset,
  openJiraCount,
  lowStockCount,
  totalAssetsCount,
  currentUser
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.soundEnabled = next;
    if (next) soundFx.playMechanicalClick();
  };

  const navItems = [
    {
      id: 'inventory' as const,
      label: 'Inventory',
      count: totalAssetsCount,
      icon: <Laptop className="w-3.5 h-3.5" />
    },
    {
      id: 'stock_tracker' as const,
      label: 'Stock Reserves',
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'amber',
      icon: <Boxes className="w-3.5 h-3.5" />
    },
    {
      id: 'jira' as const,
      label: 'Jira Requests',
      badge: openJiraCount > 0 ? `${openJiraCount}` : undefined,
      badgeColor: 'blue',
      icon: <Layers className="w-3.5 h-3.5" />
    },
    {
      id: 'audit_trail' as const,
      label: 'Audit Log',
      icon: <History className="w-3.5 h-3.5" />
    }
  ];

  return (
    <header className="instrument-header sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        
        {/* Left: Custom SVG Brand Lockup */}
        <div className="flex items-center gap-4">
          <SysAssistWordmark size={30} variant="accent" />

          {/* Calibrated Connection Status Group (Subtle & Honest) */}
          <div className="hidden xl:flex items-center gap-3.5 px-3 py-1 rounded-md instrument-well text-[11px]">
            <div className="flex items-center gap-1.5" title="Local browser Indexed/Local store active">
              <LedIndicator color="green" size="sm" />
              <span className="text-slate-400 font-sans">Storage: <span className="text-slate-200">Active</span></span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5" title="Simulated Jira Cloud Service Desk API">
              <LedIndicator color="blue" size="sm" />
              <span className="text-slate-400 font-sans">Jira: <span className="text-slate-300">Sandbox</span></span>
            </div>
            <div className="w-[1px] h-3 bg-white/10" />
            <div className="flex items-center gap-1.5" title="Simulated Apple GSX Warranty Verification API">
              <LedIndicator color="green" size="sm" />
              <span className="text-slate-400 font-sans">GSX: <span className="text-slate-300">Demo API</span></span>
            </div>
          </div>
        </div>

        {/* Center: Desktop Navigation Tabs */}
        <nav aria-label="Primary Navigation" className="hidden md:flex items-center gap-1 bg-[#101318] p-1 rounded-lg border border-white/[0.05]">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundFx.playMechanicalClick();
                  onSelectTab(item.id);
                }}
                className={`relative px-3 py-1.5 rounded-md text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1e2634] text-white border border-blue-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-blue-500/30 text-blue-200' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.count}
                  </span>
                )}
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-sans font-semibold ${
                    item.badgeColor === 'amber'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Primary Hierarchy Actions */}
        <div className="flex items-center gap-2">
          {/* Add Hardware Button */}
          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={onOpenAddAsset}
            icon={<Plus className="w-3.5 h-3.5" />}
            className="hidden sm:inline-flex"
            title="Intake new equipment into inventory"
          >
            Add Hardware
          </SkeuoButton>

          {/* Primary Action: Optical Barcode Scanner */}
          <SkeuoButton
            size="sm"
            variant="primary"
            onClick={onOpenScanner}
            icon={<Scan className="w-3.5 h-3.5" />}
            title="Scan asset barcode or serial number"
          >
            <span className="hidden xs:inline">Scan</span> Asset
          </SkeuoButton>

          {/* Operator Badge (Quiet & Compact) */}
          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/10 text-xs font-sans text-slate-400">
            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-3 h-3" />
            </div>
            <span className="text-slate-300 truncate max-w-[120px]">{currentUser.split(' ')[0]}</span>
          </div>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            className={`w-8 h-8 rounded-lg instrument-btn flex items-center justify-center cursor-pointer transition-all ${
              soundEnabled ? 'text-blue-400' : 'text-slate-500'
            }`}
            title={soundEnabled ? 'Tactile Audio Enabled (Click to Mute)' : 'Tactile Audio Muted'}
            aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-lg instrument-btn flex items-center justify-center text-slate-300 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Responsive Navigation Drawer / Control */}
      {mobileMenuOpen && (
        <div className="md:hidden pt-3 pb-2 border-t border-white/10 mt-2.5 space-y-1 animate-fade-in">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#101318] rounded-lg border border-white/[0.05] mb-2">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    soundFx.playMechanicalClick();
                    onSelectTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-3 py-2 rounded-md text-xs font-sans font-medium flex items-center justify-between transition-all ${
                    isActive
                      ? 'bg-[#1e2634] text-white border border-blue-500/40 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  {item.badge ? (
                    <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300">
                      {item.badge}
                    </span>
                  ) : item.count !== undefined ? (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.count}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
            <span className="font-sans">Operator: <strong className="text-slate-200">{currentUser}</strong></span>
            <button
              onClick={() => {
                onOpenAddAsset();
                setMobileMenuOpen(false);
              }}
              className="text-blue-400 font-sans font-medium hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> Add Hardware
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
