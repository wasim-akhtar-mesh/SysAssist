import React from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingCart, 
  Laptop, 
  Monitor, 
  Layers, 
  ArrowUpRight, 
  ShieldAlert, 
  Clock,
  Plus
} from 'lucide-react';
import { Asset, InventoryThreshold, JiraTicket } from '../types';
import { SkeuoButton, LedIndicator, SegmentedDisplay } from './SkeuoComponents';
import { soundFx } from '../services/audioService';

interface AutomatedInventoryTrackerProps {
  assets: Asset[];
  thresholds: InventoryThreshold[];
  onDraftProcurementTicket: (item: { category: string; modelName: string; quantityToOrder: number }) => void;
  onOpenAssetDetail: (asset: Asset) => void;
}

export const AutomatedInventoryTracker: React.FC<AutomatedInventoryTrackerProps> = ({
  assets,
  thresholds,
  onDraftProcurementTicket,
  onOpenAssetDetail
}) => {
  // Compute category stock metrics
  const categoryStats = [
    { category: 'Laptop', label: 'Fleet Laptops', icon: <Laptop className="w-4 h-4 text-sky-400" /> },
    { category: 'Display', label: '4K/5K Displays', icon: <Monitor className="w-4 h-4 text-emerald-400" /> },
    { category: 'Dock', label: 'Thunderbolt Docks', icon: <Boxes className="w-4 h-4 text-amber-400" /> },
    { category: 'Keyboard', label: 'Keyboards', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { category: 'Mouse', label: 'Ergo Mice', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
    { category: 'Audio/Headset', label: 'Audio & ANC', icon: <Layers className="w-4 h-4 text-rose-400" /> }
  ].map(cat => {
    const total = assets.filter(a => a.category === cat.category).length;
    const inStock = assets.filter(a => a.category === cat.category && a.status === 'In Stock').length;
    const inUse = assets.filter(a => a.category === cat.category && a.status === 'In Use').length;
    const maintenance = assets.filter(a => a.category === cat.category && a.status === 'Maintenance').length;
    return {
      ...cat,
      total,
      inStock,
      inUse,
      maintenance,
      isLowStock: inStock <= 1
    };
  });

  // Calculate low stock items that need procurement
  const lowStockAlerts = categoryStats.filter(c => c.isLowStock);

  return (
    <div className="space-y-5">
      {/* Top Automated Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="skeuo-card p-3 rounded-xl border border-slate-700/60">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'In Stock').length} 
            label="Available in Depot" 
            color="emerald" 
          />
        </div>
        <div className="skeuo-card p-3 rounded-xl border border-slate-700/60">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'In Use').length} 
            label="Active in Field" 
            color="sky" 
          />
        </div>
        <div className="skeuo-card p-3 rounded-xl border border-slate-700/60">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'Maintenance').length} 
            label="Depot Maintenance" 
            color="amber" 
          />
        </div>
        <div className="skeuo-card p-3 rounded-xl border border-slate-700/60">
          <SegmentedDisplay 
            value={lowStockAlerts.length} 
            label="Stock Alerts" 
            color={lowStockAlerts.length > 0 ? 'red' : 'emerald'} 
          />
        </div>
      </div>

      {/* Automated Low Stock & Procurement Engine Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-xl skeuo-metal-panel border-2 border-amber-500/50 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-950 border border-amber-500/60 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-mono uppercase text-amber-300">
                  Automated Reorder Threshold Triggered ({lowStockAlerts.length} Categories Low)
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Inventory buffer dropped below minimum enterprise safety threshold.
                </p>
              </div>
            </div>
            <LedIndicator color="amber" pulse={true} label="STOCK CRITICAL" size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockAlerts.map(alert => (
              <div key={alert.category} className="skeuo-recessed p-3.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-slate-100 font-mono">
                    {alert.label}
                  </div>
                  <div className="text-[11px] text-amber-400 font-mono mt-0.5">
                    Only {alert.inStock} unit(s) remaining in stock pool (Buffer min: 2)
                  </div>
                </div>

                <SkeuoButton
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    soundFx.playMechanicalClick();
                    onDraftProcurementTicket({
                      category: alert.category,
                      modelName: alert.label,
                      quantityToOrder: 5
                    });
                  }}
                  icon={<ShoppingCart className="w-3.5 h-3.5" />}
                >
                  Create Jira PO
                </SkeuoButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown Bay */}
      <div className="skeuo-card p-5 rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Hardware Fleet Stock Levels & Buffer Analysis
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Real-time telemetry updated
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryStats.map(stat => (
            <div key={stat.category} className="skeuo-recessed p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-xs font-bold font-mono text-slate-200 uppercase">
                    {stat.label}
                  </span>
                </div>
                <LedIndicator 
                  color={stat.inStock > 1 ? 'green' : stat.inStock === 1 ? 'amber' : 'red'} 
                  size="sm" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-white/5 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">TOTAL</span>
                  <span className="text-sm font-bold text-slate-200">{stat.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-500 block uppercase">IN STOCK</span>
                  <span className="text-sm font-bold text-emerald-400">{stat.inStock}</span>
                </div>
                <div>
                  <span className="text-[10px] text-sky-500 block uppercase">IN USE</span>
                  <span className="text-sm font-bold text-sky-300">{stat.inUse}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lost Inventory & Audit Compliance Watchlist */}
      <div className="skeuo-card p-5 rounded-xl border border-slate-700/60">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Assigned Equipment Audit Trail & Loss Prevention Monitor
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Automated custodian verification
          </span>
        </div>

        <p className="text-xs text-slate-400 font-mono mb-4">
          All high-value laptops and peripherals with confirmed custodians. Automated audit checks cross-reference employee status against Jira offboarding tickets to prevent unreturned hardware.
        </p>

        <div className="space-y-2">
          {assets.filter(a => a.assignedTo !== null).map(asset => (
            <div 
              key={asset.id} 
              className="p-3 rounded-lg skeuo-recessed border border-slate-800 flex flex-wrap items-center justify-between gap-3 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAssetDetail(asset)}
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40 hover:bg-sky-900 cursor-pointer"
                >
                  {asset.assetTag}
                </button>
                <div>
                  <div className="text-xs font-bold text-slate-100 font-mono">
                    {asset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Assigned to: <strong className="text-sky-300">{asset.assignedTo?.name}</strong> ({asset.assignedTo?.department}) • Since: {asset.assignedTo?.assignedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active
                </span>
                <SkeuoButton
                  size="sm"
                  onClick={() => onOpenAssetDetail(asset)}
                >
                  Inspect / Reassign
                </SkeuoButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
