import React from 'react';
import { 
  Boxes, 
  AlertTriangle, 
  CheckCircle2, 
  ShoppingCart, 
  Laptop, 
  Monitor, 
  Layers, 
  ShieldAlert, 
  UserCheck,
  ArrowRight
} from 'lucide-react';
import { Asset, InventoryThreshold } from '../types';
import { SkeuoButton, LedIndicator, SegmentedDisplay, StatusBadge } from './SkeuoComponents';
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
  // Category stock metrics
  const categoryStats = [
    { category: 'Laptop', label: 'Laptops', icon: <Laptop className="w-4 h-4 text-blue-400" /> },
    { category: 'Display', label: 'Displays & Monitors', icon: <Monitor className="w-4 h-4 text-emerald-400" /> },
    { category: 'Dock', label: 'Thunderbolt Docks', icon: <Boxes className="w-4 h-4 text-amber-400" /> },
    { category: 'Keyboard', label: 'Keyboards', icon: <Layers className="w-4 h-4 text-purple-400" /> },
    { category: 'Mouse', label: 'Precision Mice', icon: <Layers className="w-4 h-4 text-cyan-400" /> },
    { category: 'Audio/Headset', label: 'Headsets & Audio', icon: <Layers className="w-4 h-4 text-rose-400" /> }
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

  const lowStockAlerts = categoryStats.filter(c => c.isLowStock);
  const assignedAssets = assets.filter(a => a.assignedTo !== null);

  return (
    <div className="space-y-4">
      {/* Top Automated Overview Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'In Stock').length} 
            label="In Depot Reserves" 
            color="emerald" 
          />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'In Use').length} 
            label="Deployed in Field" 
            color="sky" 
          />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={assets.filter(a => a.status === 'Maintenance').length} 
            label="Under Maintenance" 
            color="amber" 
          />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={lowStockAlerts.length} 
            label="Low Reserve Alerts" 
            color={lowStockAlerts.length > 0 ? 'red' : 'emerald'} 
          />
        </div>
      </div>

      {/* Low Stock Procurement Trigger Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 rounded-xl instrument-panel border border-amber-500/40 bg-[#161413]/60 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-950/80 border border-amber-500/40 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold text-amber-200">
                  Buffer Threshold Warning: {lowStockAlerts.length} Categories Below Safe Reserve
                </h3>
                <p className="text-xs font-sans text-slate-400">
                  Available equipment count has dropped below minimum recommended pool threshold.
                </p>
              </div>
            </div>
            <LedIndicator color="amber" pulse={true} label="RESERVE ALERT" size="sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockAlerts.map(alert => (
              <div key={alert.category} className="instrument-well p-3 rounded-lg flex items-center justify-between gap-3 border border-amber-900/30">
                <div>
                  <div className="text-xs font-sans font-semibold text-slate-200">
                    {alert.label}
                  </div>
                  <div className="text-[11px] text-amber-300 font-sans mt-0.5">
                    {alert.inStock} unit(s) remaining in stock (Recommended buffer: 2+)
                  </div>
                </div>

                <SkeuoButton
                  size="sm"
                  variant="primary"
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
      <div className="instrument-panel p-5 rounded-xl">
        <div className="flex items-center justify-between mb-4 pb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-sans font-bold text-slate-100">
              Fleet Equipment Stock & Reserve Breakdown
            </h3>
          </div>
          <span className="text-xs font-sans text-slate-400">
            {assets.length} total units tracked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categoryStats.map(stat => (
            <div key={stat.category} className="instrument-well p-4 rounded-xl border border-white/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {stat.icon}
                  <span className="text-xs font-sans font-semibold text-slate-200">
                    {stat.label}
                  </span>
                </div>
                <LedIndicator 
                  color={stat.inStock > 1 ? 'green' : stat.inStock === 1 ? 'amber' : 'red'} 
                  size="sm" 
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-white/[0.04] text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-wide">Total</span>
                  <span className="text-sm font-bold font-mono text-slate-200">{stat.total}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 block uppercase font-sans tracking-wide">In Stock</span>
                  <span className="text-sm font-bold font-mono text-emerald-400">{stat.inStock}</span>
                </div>
                <div>
                  <span className="text-[10px] text-blue-400 block uppercase font-sans tracking-wide">In Field</span>
                  <span className="text-sm font-bold font-mono text-blue-300">{stat.inUse}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custodian Verification & Loss Prevention */}
      <div className="instrument-panel p-5 rounded-xl">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-sans font-bold text-slate-100">
              Assigned Equipment Custody & Loss Prevention Watchlist
            </h3>
          </div>
          <span className="text-xs font-sans text-slate-400">
            {assignedAssets.length} active assignments
          </span>
        </div>

        <p className="text-xs font-sans text-slate-400 mb-4">
          All high-value laptops and peripherals with verified custodians. Regular reconciliation helps streamline procurement and minimize lost or unaccounted inventory.
        </p>

        <div className="space-y-2">
          {assignedAssets.map(asset => (
            <div 
              key={asset.id} 
              className="p-3 rounded-lg instrument-well flex flex-wrap items-center justify-between gap-3 hover:border-white/[0.1] transition-all"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenAssetDetail(asset)}
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#131923] text-blue-300 border border-blue-600/30 hover:bg-blue-900/40 cursor-pointer"
                >
                  {asset.assetTag}
                </button>
                <div>
                  <div className="text-xs font-sans font-semibold text-slate-200">
                    {asset.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans">
                    Custodian: <strong className="text-blue-300">{asset.assignedTo?.name}</strong> ({asset.assignedTo?.department}) • Since {asset.assignedTo?.assignedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-sans text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified Active
                </span>
                <SkeuoButton
                  size="sm"
                  variant="standard"
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
