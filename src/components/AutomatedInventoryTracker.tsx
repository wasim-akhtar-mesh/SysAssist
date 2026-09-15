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
  ArrowRight,
  TrendingUp,
  Cpu,
  Keyboard,
  Mouse,
  Headphones
} from 'lucide-react';
import { Asset, InventoryThreshold, AssetCategory } from '../types';
import { SkeuoButton, LedIndicator, SegmentedDisplay, StatusBadge } from './SkeuoComponents';
import { getCategoryStockAssessments } from '../utils/inventorySelectors';

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
  const categoryAssessments = getCategoryStockAssessments(assets, thresholds);
  const lowStockAlerts = categoryAssessments.filter(c => c.isLowStock);

  const inStockTotal = assets.filter(a => a.status === 'In Stock').length;
  const inUseTotal = assets.filter(a => a.status === 'In Use').length;
  const maintenanceTotal = assets.filter(a => a.status === 'Maintenance').length;

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'Laptop': return <Laptop className="w-4 h-4 text-[#C66A2B]" />;
      case 'Display': return <Monitor className="w-4 h-4 text-[#2C6E9B]" />;
      case 'Dock': return <Boxes className="w-4 h-4 text-[#10B981]" />;
      case 'Keyboard': return <Keyboard className="w-4 h-4 text-[#686B6D]" />;
      case 'Mouse': return <Mouse className="w-4 h-4 text-[#686B6D]" />;
      case 'Audio/Headset': return <Headphones className="w-4 h-4 text-[#686B6D]" />;
      default: return <Layers className="w-4 h-4 text-[#686B6D]" />;
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Compact Metric Strip Across Top */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={inStockTotal} 
            label="In Depot Reserves" 
            color="emerald" 
            unit={`of ${assets.length}`}
          />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={inUseTotal} 
            label="Deployed In Field" 
            color="blue" 
            unit={`${Math.round((inUseTotal / (assets.length || 1)) * 100)}% active`}
          />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={maintenanceTotal} 
            label="Under Maintenance" 
            color="amber" 
            unit="bench test"
          />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={lowStockAlerts.length} 
            label="Buffer Quota Alerts" 
            color={lowStockAlerts.length > 0 ? 'red' : 'emerald'} 
            unit={lowStockAlerts.length > 0 ? 'Action required' : 'Nominal'}
          />
        </div>
      </div>

      {/* Low Stock Threshold Alert Banner if applicable */}
      {lowStockAlerts.length > 0 && (
        <div className="p-3.5 rounded-lg ti-surface border border-[#D97706]/40 bg-[#FFFDF7] shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-[#D97706]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#B45309]">
              Low Inventory Buffer Warning ({lowStockAlerts.length} Categories Below Safe Quota)
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-2">
            {lowStockAlerts.map(alert => (
              <div key={alert.category} className="p-2.5 rounded ti-well flex items-center justify-between gap-3 border border-[#E8DFC8]">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#181A1B] truncate text-xs">
                    {alert.category} • {alert.modelName}
                  </div>
                  <div className="text-[11px] text-[#8C4F00] font-medium mt-0.5">
                    {alert.inStock} unit(s) in depot (Buffer threshold: {alert.minQuantity})
                  </div>
                </div>

                <SkeuoButton
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onDraftProcurementTicket({
                      category: alert.category,
                      modelName: alert.modelName,
                      quantityToOrder: alert.deficit > 0 ? alert.deficit + 2 : 3
                    });
                  }}
                  icon={<ShoppingCart className="w-3.5 h-3.5" />}
                >
                  Draft PO
                </SkeuoButton>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Horizontally Efficient Category Analysis (Dense Table) */}
      <div className="ti-surface rounded-lg border border-[#D8D6CF] overflow-hidden">
        <div className="p-3 border-b border-[#D8D6CF] flex items-center justify-between bg-[#EAE8E2]">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[#C66A2B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
              Fleet Equipment Stock & Reserve Breakdown
            </h3>
          </div>
          <span className="text-xs text-[#686B6D]">
            {assets.length} total units cataloged
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D8D6CF] bg-[#FAF9F5] text-[#686B6D] font-medium text-[11px]">
                <th className="py-2.5 px-3">Equipment Class</th>
                <th className="py-2.5 px-3">Depot Stock</th>
                <th className="py-2.5 px-3">In Field</th>
                <th className="py-2.5 px-3">Maintenance</th>
                <th className="py-2.5 px-3">Total Fleet</th>
                <th className="py-2.5 px-3">Target Buffer</th>
                <th className="py-2.5 px-3 min-w-[120px]">Allocation</th>
                <th className="py-2.5 px-3 text-right">Quota Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E2] text-[#181A1B]">
              {categoryAssessments.map(stat => {
                const percentInUse = Math.round((stat.inUse / (stat.total || 1)) * 100);
                return (
                  <tr key={stat.category} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded ti-well">{getCategoryIcon(stat.category)}</div>
                        <div>
                          <div className="font-semibold text-xs text-[#181A1B]">{stat.category}</div>
                          <div className="text-[10px] text-[#686B6D]">{stat.modelName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#0F682C]">
                      {stat.inStock} units
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#1956A6]">
                      {stat.inUse} units
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#8C4F00]">
                      {stat.maintenance} units
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-[#181A1B]">
                      {stat.total}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-xs text-[#505457]">
                      {stat.minQuantity} min ({stat.criticalThreshold} crit)
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#D8D6CF] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#C66A2B] rounded-full" 
                            style={{ width: `${percentInUse}%` }} 
                          />
                        </div>
                        <span className="font-mono text-[10px] text-[#686B6D] w-8">
                          {percentInUse}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {stat.isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FFF8E6] text-[#8C4F00] border border-[#FFE299]">
                          <AlertTriangle className="w-3 h-3 text-[#D97706]" /> Low Buffer ({stat.inStock}/{stat.minQuantity})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF7EE] text-[#0F682C] border border-[#B7E5C3]">
                          <CheckCircle2 className="w-3 h-3 text-[#10B981]" /> Adequate ({stat.inStock})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
