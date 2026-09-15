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
  Cpu,
  MapPin
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

  const categories = useMemo(() => [
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
    <div className="space-y-3.5">
      {/* Single Efficient Toolbar: Search, Filters, View Modes */}
      <div className="p-2.5 rounded-lg ti-surface flex flex-wrap items-center justify-between gap-2.5">
        {/* Search Input */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] sm:min-w-[320px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Tag (AST-8821), Serial, Barcode, Model, Custodian..."
              className="w-full h-8.5 pl-8.5 pr-8 ti-well rounded text-xs font-sans text-[#181A1B] placeholder-[#8A8C8E] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B] focus:border-[#2C6E9B] transition-colors"
            />
            <Search className="w-3.5 h-3.5 text-[#7A7D80] absolute left-2.5 top-2.5 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#7A7D80] hover:text-[#181A1B] cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filters Group: Category, Status, View Mode */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8.5 px-2.5 rounded ti-btn text-xs font-sans text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
            aria-label="Filter by category"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label} ({cat.count})
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-8.5 px-2.5 rounded ti-btn text-xs font-sans text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses ({assets.length})</option>
            <option value="In Stock">In Stock ({assets.filter(a => a.status === 'In Stock').length})</option>
            <option value="In Use">In Field Use ({assets.filter(a => a.status === 'In Use').length})</option>
            <option value="Maintenance">Maintenance ({assets.filter(a => a.status === 'Maintenance').length})</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded ti-well border border-[#C5C3BC]">
            <button
              onClick={() => { soundFx.playMechanicalClick(); setViewMode('grid'); }}
              className={`p-1 rounded text-xs cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-medium' : 'text-[#686B6D] hover:text-[#181A1B]'
              }`}
              title="Fluid Grid View"
              aria-label="Switch to Fluid Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { soundFx.playMechanicalClick(); setViewMode('table'); }}
              className={`p-1 rounded text-xs cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-medium' : 'text-[#686B6D] hover:text-[#181A1B]'
              }`}
              title="Full-Width Table View"
              aria-label="Switch to Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Intake Button */}
          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={onNewAssetClick}
            icon={<Plus className="w-3.5 h-3.5 text-[#C66A2B]" />}
          >
            Add Hardware
          </SkeuoButton>
        </div>
      </div>

      {/* Category Horizontal Quick Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
        {categories.map(cat => {
          const isSelected = selectedCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => {
                soundFx.playMechanicalClick();
                setSelectedCategory(cat.value);
              }}
              className={`px-2.5 py-1 rounded text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#151719] text-[#FAF9F5] shadow-xs'
                  : 'ti-btn text-[#505457] hover:text-[#181A1B]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`ml-1.5 text-[10px] px-1 py-0.2 rounded font-mono ${
                isSelected ? 'bg-[#2E333A] text-[#C66A2B]' : 'text-[#7A7D80]'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Header Summary */}
      <div className="flex items-center justify-between text-xs text-[#686B6D] px-1">
        <span>
          Showing <strong className="text-[#181A1B]">{filteredAssets.length}</strong> of {assets.length} devices
        </span>
        {(searchQuery || selectedCategory !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            onClick={handleResetFilters}
            className="text-[#C66A2B] hover:underline font-medium cursor-pointer"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid Mode View: Fluid Grid Adaptable from 3 (1280px) to 6 (ultrawide) */}
      {viewMode === 'grid' ? (
        filteredAssets.length === 0 ? (
          <div className="p-12 text-center ti-surface rounded-lg border border-[#D8D6CF]">
            <div className="w-10 h-10 rounded ti-well mx-auto mb-3 flex items-center justify-center text-[#7A7D80]">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#181A1B] mb-1">
              No matching hardware found
            </h3>
            <p className="text-xs text-[#686B6D] max-w-sm mx-auto mb-4">
              No equipment records matched &ldquo;{searchQuery || selectedCategory || selectedStatus}&rdquo;. Adjust search keywords or reset active filters.
            </p>
            <SkeuoButton size="sm" variant="standard" onClick={handleResetFilters}>
              Reset All Filters
            </SkeuoButton>
          </div>
        ) : (
          <div 
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '14px'
            }}
          >
            {filteredAssets.map(asset => {
              const isApple = asset.manufacturer.toLowerCase() === 'apple' || asset.appleCoverage !== undefined;
              return (
                <div
                  key={asset.id}
                  onClick={() => {
                    soundFx.playMechanicalClick();
                    onSelectAsset(asset);
                  }}
                  className="ti-card rounded-lg p-3.5 cursor-pointer flex flex-col justify-between group"
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
                    {/* Header: Tag, Status & Category */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#E8E6DF] text-[#181A1B] border border-[#CFCDBF] tracking-tight">
                          {asset.assetTag}
                        </span>
                        <span className="text-[11px] text-[#686B6D] truncate">
                          {asset.category}
                        </span>
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>

                    {/* Hardware Name & Model */}
                    <div className="mb-2.5">
                      <h4 className="text-xs font-semibold text-[#181A1B] group-hover:text-[#C66A2B] transition-colors leading-tight line-clamp-1">
                        {asset.name}
                      </h4>
                      <div className="text-[11px] text-[#686B6D] truncate mt-0.5 font-sans">
                        {asset.model}
                      </div>
                    </div>

                    {/* Information-Dense Hardware Specs */}
                    <div className="p-2 rounded ti-well mb-2.5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#686B6D] flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-[#7A7D80]" /> CPU
                        </span>
                        <span className="font-mono text-[#181A1B] font-medium truncate max-w-[170px] text-right">
                          {asset.specs.processor.split('(')[0].trim()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#686B6D] flex items-center gap-1">
                          <HardDrive className="w-3 h-3 text-[#7A7D80]" /> RAM / Disk
                        </span>
                        <span className="font-mono text-[#181A1B] font-medium text-right">
                          {asset.specs.ram.split(' ')[0]} GB • {asset.specs.storage.split(' ')[0]} {asset.specs.storage.includes('TB') ? 'TB' : 'GB'}
                        </span>
                      </div>
                    </div>

                    {/* Custody Assignment */}
                    <div className="flex items-center gap-2 mb-2 text-xs">
                      <div className="w-5 h-5 rounded-full bg-[#E5E3DD] border border-[#C7C5BE] flex items-center justify-center text-[#505457] shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 flex-1">
                        {asset.assignedTo ? (
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="font-medium text-[#181A1B] truncate text-[11px]">
                              {asset.assignedTo.name}
                            </span>
                            <span className="text-[10px] text-[#686B6D] truncate">
                              {asset.assignedTo.department}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#0F682C] font-medium">
                            Unassigned • In Depot
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Serial, Warranty Indicator & Inspector Arrow */}
                  <div className="pt-2 border-t border-[#E8E6DF] flex items-center justify-between text-[11px] mt-1 text-[#686B6D]">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] truncate max-w-[180px]">
                      <Tag className="w-3 h-3 text-[#8A8C8E]" />
                      <span className="truncate">{asset.serialNumber}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[#C66A2B] font-sans text-xs font-medium group-hover:translate-x-0.5 transition-transform">
                      <span>Inspect</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Full-Width High-Density Table View */
        <div className="ti-surface rounded-lg overflow-hidden border border-[#D8D6CF]">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D8D6CF] bg-[#EAE8E2] text-[#686B6D] font-medium text-[11px]">
                  <th className="py-2.5 px-3 whitespace-nowrap">Asset Tag</th>
                  <th className="py-2.5 px-3">Equipment / Model</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Specs (CPU / RAM / Disk)</th>
                  <th className="py-2.5 px-3">Custodian</th>
                  <th className="py-2.5 px-3">Serial / Barcode</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6E4DE] text-[#181A1B]">
                {filteredAssets.map(asset => (
                  <tr
                    key={asset.id}
                    onClick={() => {
                      soundFx.playMechanicalClick();
                      onSelectAsset(asset);
                    }}
                    className="hover:bg-[#FAF9F5] transition-colors cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-xs whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#E5E3DC] text-[#181A1B] border border-[#C7C5BE]">
                        {asset.assetTag}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px]">
                      <div className="font-semibold text-[#181A1B] truncate">{asset.name}</div>
                      <div className="text-[11px] text-[#686B6D] truncate">{asset.model}</div>
                    </td>
                    <td className="py-2.5 px-3 text-[#505457] whitespace-nowrap">
                      {asset.category}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={asset.status} />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#505457] max-w-[180px] truncate">
                      {asset.specs.processor.split('(')[0].trim()} • {asset.specs.ram.split(' ')[0]}GB
                    </td>
                    <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                      {asset.assignedTo ? (
                        <div>
                          <div className="font-medium text-[#181A1B]">{asset.assignedTo.name}</div>
                          <div className="text-[10px] text-[#686B6D]">{asset.assignedTo.department}</div>
                        </div>
                      ) : (
                        <span className="text-[#0F682C] font-medium text-[11px]">In Depot</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-[#686B6D] whitespace-nowrap">
                      <div>{asset.serialNumber}</div>
                      <div className="text-[10px] text-[#8A8C8E]">{asset.barcode}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playMechanicalClick();
                          onSelectAsset(asset);
                        }}
                        className="px-2 py-1 rounded ti-btn text-xs font-medium text-[#C66A2B] hover:text-[#B55E22] inline-flex items-center gap-1 cursor-pointer"
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
