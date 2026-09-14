import React, { useState } from 'react';
import { 
  Laptop, 
  Boxes, 
  History, 
  Volume2, 
  VolumeX, 
  Scan, 
  Cpu, 
  Layers, 
  Activity,
  UserCheck
} from 'lucide-react';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';
import { soundFx } from '../services/audioService';

interface HeaderBarProps {
  activeTab: 'inventory' | 'stock_tracker' | 'jira' | 'audit_trail';
  onSelectTab: (tab: 'inventory' | 'stock_tracker' | 'jira' | 'audit_trail') => void;
  onOpenScanner: () => void;
  openJiraCount: number;
  lowStockCount: number;
  totalAssetsCount: number;
  currentUser: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  openJiraCount,
  lowStockCount,
  totalAssetsCount,
  currentUser
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundFx.soundEnabled = next;
    if (next) soundFx.playMechanicalClick();
  };

  return (
    <header className="skeuo-metal-header sticky top-0 z-40 px-4 sm:px-6 py-3 border-b-2 border-black">
      {/* Rackmount Chassis Frame */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: App Logo & System Telemetry */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-[#3b82f6] to-[#1d4ed8] border border-blue-400/50 flex items-center justify-center shadow-[0_4px_12px_rgba(59,130,246,0.5),inset_0_1px_1px_rgba(255,255,255,0.6)]">
            <Cpu className="w-6 h-6 text-white drop-shadow-md" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-widest font-mono text-white text-engraved">
                SYSASSIST
              </h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-400 border border-sky-600/40 font-bold">
                ENTERPRISE v2.5
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span>LAPTOPS & PERIPHERALS INVENTORY</span>
              <span>•</span>
              <span className="text-slate-300">OPERATOR: <strong className="text-sky-300">{currentUser}</strong></span>
            </div>
          </div>
        </div>

        {/* Center: System Status LEDs */}
        <div className="hidden lg:flex items-center gap-4 px-4 py-1.5 rounded-xl skeuo-recessed border border-slate-800">
          <LedIndicator color="green" label="DB ACTIVE" size="sm" />
          <div className="w-[1px] h-3 bg-white/10" />
          <LedIndicator color="blue" label="JIRA CLOUD" size="sm" />
          <div className="w-[1px] h-3 bg-white/10" />
          <LedIndicator color="green" label="APPLE GSX" size="sm" />
        </div>

        {/* Right: Quick Actions & Sound Control */}
        <div className="flex items-center gap-2 ml-auto">
          <SkeuoButton
            size="sm"
            variant="accent"
            onClick={onOpenScanner}
            icon={<Scan className="w-4 h-4" />}
          >
            Barcode Scanner
          </SkeuoButton>

          {/* Tactile Audio Mute/Unmute */}
          <button
            onClick={toggleSound}
            className={`w-9 h-9 rounded-lg skeuo-btn flex items-center justify-center cursor-pointer transition-all ${
              soundEnabled ? 'text-sky-400' : 'text-slate-500'
            }`}
            title={soundEnabled ? 'Tactile Audio Enabled (Click to Mute)' : 'Tactile Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Structural Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto mt-3 pt-2.5 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1">
        <SkeuoButton
          size="sm"
          activeState={activeTab === 'inventory'}
          onClick={() => { soundFx.playMechanicalClick(); onSelectTab('inventory'); }}
          icon={<Laptop className="w-3.5 h-3.5" />}
        >
          Equipment Inventory ({totalAssetsCount})
        </SkeuoButton>

        <SkeuoButton
          size="sm"
          activeState={activeTab === 'stock_tracker'}
          onClick={() => { soundFx.playMechanicalClick(); onSelectTab('stock_tracker'); }}
          icon={<Boxes className="w-3.5 h-3.5" />}
        >
          Automated Stock & Thresholds {lowStockCount > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-black text-[10px] font-bold">{lowStockCount}</span>}
        </SkeuoButton>

        <SkeuoButton
          size="sm"
          activeState={activeTab === 'jira'}
          onClick={() => { soundFx.playMechanicalClick(); onSelectTab('jira'); }}
          icon={<Layers className="w-3.5 h-3.5 text-blue-400" />}
        >
          Jira Hardware Requests {openJiraCount > 0 && <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-500 text-white text-[10px] font-bold">{openJiraCount}</span>}
        </SkeuoButton>

        <SkeuoButton
          size="sm"
          activeState={activeTab === 'audit_trail'}
          onClick={() => { soundFx.playMechanicalClick(); onSelectTab('audit_trail'); }}
          icon={<History className="w-3.5 h-3.5" />}
        >
          Audit Trail & Change Logs
        </SkeuoButton>
      </div>
    </header>
  );
};
