import React, { useState, useMemo } from 'react';
import { 
  Laptop, 
  Monitor, 
  Boxes, 
  Layers, 
  Search, 
  Filter, 
  User, 
  Plus, 
  Tag, 
  ShieldCheck, 
  LayoutGrid, 
  List, 
  CheckCircle2, 
  Scan,
  X,
  ArrowRight,
  HardDrive,
  Cpu
} from 'lucide-react';
import { Asset, AssetCategory, AssetStatus } from '../types';
import { SkeuoButton, LedIndicator, StatusBadge } from './SkeuoComponents';
import { soundFx } from '../services/audioService';

interface AssetListViewProps {
  assets: Asset[];
  onSelectAsset: (asset: Asset) => void;
  onOpenScanner: () => void;
  onNewAssetClick: () => void;
}

export const AssetListView: React.FC<AssetListViewProps> = ({
  assets,
  onSelectAsset,
  onOpenScanner,
  onNewAssetClick
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const categories: { label: string; value: string; count: number }[] = useMemo(() => [
    { label: 'All Equipment', value: 'ALL', count: assets.length },
    { label: 'Laptops', value: 'Laptop', count: assets.filter(a => a.category === 'Laptop').length },
    { label: 'Displays', value: 'Display', count: assets.filter(a => a.category === 'Display').length },
    { label: 'Docks', value: 'Dock', count: assets.filter(a => a.category === 'Dock').length },
    { label: 'Keyboards', value: 'Keyboard', count: assets.filter(a => a.category === 'Keyboard').length },
    { label: 'Mice', value: 'Mouse', count: assets.filter(a => a.category === 'Mouse').length },
    { label: 'Audio', value: 'Audio/Headset', count: assets.filter(a => a.category === 'Audio/Headset').length }
  ], [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        asset.name.toLowerCase().includes(q) ||
        asset.assetTag.toLowerCase().includes(q) ||
        asset.serialNumber.toLowerCase().includes(q) ||
        asset.barcode.toLowerCase().includes(q) ||
        asset.model.toLowerCase().includes(q) ||
        (asset.assignedTo && asset.assignedTo.name.toLowerCase().includes(q)) ||
        (asset.assignedTo && asset.assignedTo.department.toLowerCase().includes(q))
      );

      const matchesCategory = selectedCategory === 'ALL' || asset.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, searchQuery, selectedCategory, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
    soundFx.playMechanicalClick();
  };

  return (
    <div className="space-y-4">
      {/* Category Pills & Quick Intake Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-white/[0.06]">
        {/* Category Filters (Horizontal scroll with no page overflow) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => {
                  soundFx.playMechanicalClick();
                  setSelectedCategory(cat.value);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e2736] text-blue-200 border border-blue-500/50 shadow-xs'
                    : 'bg-[#13161c] text-slate-400 hover:text-slate-200 border border-white/[0.05] hover:border-white/[0.1]'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`ml-1.5 text-[10px] px-1 py-0.2 rounded font-mono ${
                  isSelected ? 'bg-blue-500/30 text-blue-200' : 'text-slate-500'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={onOpenScanner}
            icon={<Scan className="w-3.5 h-3.5 text-blue-400" />}
          >
            Barcode Scan
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            variant="primary"
            onClick={onNewAssetClick}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Hardware
          </SkeuoButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 rounded-xl instrument-panel flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tag (AST-8821), Serial, Barcode, Model, or Custodian..."
              className="w-full h-9 pl-9 pr-8 instrument-well rounded-lg text-xs font-sans text-slate-100 placeholder-slate-500 border border-white/[0.06] focus:border-blue-500 focus:outline-none transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-500 hover:text-slate-300 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Select & View Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 rounded-lg instrument-btn text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
            aria-label="Filter by asset status"
          >
            <option value="ALL">All Statuses ({assets.length})</option>
            <option value="In Stock">In Stock ({assets.filter(a => a.status === 'In Stock').length})</option>
            <option value="In Use">In Field Use ({assets.filter(a => a.status === 'In Use').length})</option>
            <option value="Maintenance">Depot Maintenance ({assets.filter(a => a.status === 'Maintenance').length})</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg instrument-well border border-white/[0.05]">
            <button
              onClick={() => { soundFx.playMechanicalClick(); setViewMode('grid'); }}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-[#202735] text-blue-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
              aria-label="Switch to Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { soundFx.playMechanicalClick(); setViewMode('table'); }}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-[#202735] text-blue-300 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
              aria-label="Switch to Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full p-12 text-center instrument-panel rounded-xl border border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl instrument-well mx-auto mb-3 flex items-center justify-center text-slate-500">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-sans font-semibold text-slate-200 mb-1">
                No matching hardware found
              </h3>
              <p className="text-xs font-sans text-slate-400 max-w-sm mx-auto mb-4">
                No equipment records matched &ldquo;{searchQuery || selectedCategory || selectedStatus}&rdquo;. Try adjusting search terms or resetting filters.
              </p>
              <SkeuoButton size="sm" variant="standard" onClick={handleResetFilters}>
                Reset All Filters
              </SkeuoButton>
            </div>
          ) : (
            filteredAssets.map(asset => {
              const isApple = asset.manufacturer.toLowerCase() === 'apple' || asset.appleCoverage !== undefined;
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    soundFx.playMechanicalClick();
                    onSelectAsset(asset);
                  }}
                  className="instrument-card rounded-xl p-4 cursor-pointer group flex flex-col justify-between"
                  tabIndex={0}
                  role="button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAsset(asset);
                    }
                  }}
                >
                  <div>
                    {/* Header: Asset Tag & Status Badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#10141b] text-blue-300 border border-blue-600/30">
                        {asset.assetTag}
                      </span>
                      <StatusBadge status={asset.status} />
                    </div>

                    {/* Dominant Scan Path: Equipment Name */}
                    <h3 className="text-sm font-sans font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-1">
                      {asset.name}
                    </h3>

                    <div className="text-xs font-sans text-slate-400 mt-0.5">
                      {asset.manufacturer} • {asset.model}
                    </div>

                    {/* Technical Identifiers (Strictly Monospace) */}
                    <div className="grid grid-cols-2 gap-2 my-3 p-2 rounded-lg instrument-well text-[11px] font-mono border border-white/[0.04]">
                      <div className="truncate">
                        <span className="text-slate-500 block text-[9px] uppercase font-sans tracking-wide">SERIAL</span>
                        <span className="text-slate-300 font-semibold truncate block">{asset.serialNumber}</span>
                      </div>
                      <div className="truncate text-right">
                        <span className="text-slate-500 block text-[9px] uppercase font-sans tracking-wide">BARCODE</span>
                        <span className="text-slate-400 truncate block">{asset.barcode}</span>
                      </div>
                    </div>

                    {/* Custody Compartment */}
                    <div className="p-2.5 rounded-lg instrument-well border border-white/[0.04] text-xs">
                      {asset.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-blue-300">
                            <User className="w-3 h-3" />
                          </div>
                          <div className="truncate">
                            <div className="font-sans font-semibold text-slate-200 truncate">
                              {asset.assignedTo.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-sans truncate">
                              {asset.assignedTo.department} • Since {asset.assignedTo.assignedDate}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-sans font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Available in Depot ({asset.location})</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer: Warranty / Specs Summary & Inspect Trigger */}
                  <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                    {isApple ? (
                      <span className="text-blue-300 font-sans flex items-center gap-1 font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                        {asset.appleCoverage?.warrantyStatus || 'AppleCare+'}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans truncate max-w-[160px]">
                        {asset.specs.processor.split('(')[0].trim()}
                      </span>
                    )}

                    <span className="text-xs text-slate-400 group-hover:text-white font-sans flex items-center gap-1 transition-colors">
                      Inspect <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Table Mode View */
        <div className="instrument-panel rounded-xl border border-white/[0.07] overflow-x-auto shadow-md">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#12151b] text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/[0.07]">
              <tr>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Equipment</th>
                <th className="p-3 font-mono">Serial / Barcode</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Current Custody</th>
                <th className="p-3">Warranty</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-slate-200">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No matching equipment records found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map(asset => (
                  <tr 
                    key={asset.id} 
                    onClick={() => {
                      soundFx.playMechanicalClick();
                      onSelectAsset(asset);
                    }}
                    className="hover:bg-[#1c222c] cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-blue-300 whitespace-nowrap">
                      {asset.assetTag}
                    </td>
                    <td className="p-3 font-semibold text-slate-100 whitespace-nowrap">
                      <div>{asset.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{asset.manufacturer} {asset.model}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-300 whitespace-nowrap">
                      <div>{asset.serialNumber}</div>
                      <div className="text-[10px] text-slate-500">{asset.barcode}</div>
                    </td>
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {asset.category}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {asset.assignedTo ? (
                        <div>
                          <span className="font-semibold text-slate-200">{asset.assignedTo.name}</span>
                          <span className="text-[10px] text-slate-400 block">{asset.assignedTo.department}</span>
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-medium">Depot Pool</span>
                      )}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {asset.appleCoverage ? (
                        <span className="text-blue-300 flex items-center gap-1 font-medium">
                          <ShieldCheck className="w-3 h-3 text-blue-400" />
                          {asset.appleCoverage.warrantyStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[11px]">{asset.warrantyExpiry}</span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <SkeuoButton 
                        size="sm" 
                        variant="subtle"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onSelectAsset(asset); 
                        }}
                      >
                        Inspect
                      </SkeuoButton>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
