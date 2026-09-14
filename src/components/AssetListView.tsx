import React, { useState } from 'react';
import { 
  Laptop, 
  Monitor, 
  Boxes, 
  Layers, 
  Search, 
  Filter, 
  UserCheck, 
  Plus, 
  Tag, 
  QrCode, 
  ShieldCheck, 
  MoreHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
  ExternalLink,
  Barcode
} from 'lucide-react';
import { Asset, AssetCategory, AssetStatus } from '../types';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';
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

  const categories: { label: string; value: string }[] = [
    { label: 'All Equipment', value: 'ALL' },
    { label: 'Laptops', value: 'Laptop' },
    { label: 'Displays', value: 'Display' },
    { label: 'Docks', value: 'Dock' },
    { label: 'Keyboards', value: 'Keyboard' },
    { label: 'Mice', value: 'Mouse' },
    { label: 'Audio / Headsets', value: 'Audio/Headset' }
  ];

  const filteredAssets = assets.filter(asset => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      asset.name.toLowerCase().includes(q) ||
      asset.assetTag.toLowerCase().includes(q) ||
      asset.serialNumber.toLowerCase().includes(q) ||
      asset.barcode.toLowerCase().includes(q) ||
      (asset.assignedTo && asset.assignedTo.name.toLowerCase().includes(q)) ||
      (asset.assignedTo && asset.assignedTo.department.toLowerCase().includes(q));

    const matchesCategory = selectedCategory === 'ALL' || asset.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || asset.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Category Tabs & Quick Action Rack */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {categories.map(cat => (
            <SkeuoButton
              key={cat.value}
              size="sm"
              activeState={selectedCategory === cat.value}
              onClick={() => setSelectedCategory(cat.value)}
            >
              {cat.label}
            </SkeuoButton>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <SkeuoButton
            size="sm"
            variant="accent"
            onClick={onOpenScanner}
            icon={<Barcode className="w-3.5 h-3.5" />}
          >
            Scan Barcode
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            variant="emerald"
            onClick={onNewAssetClick}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Hardware
          </SkeuoButton>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-xl skeuo-metal-panel border border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Asset Tag, Serial (C02...), Barcode, or Custodian (John, Sina)..."
              className="w-full h-9 pl-9 pr-4 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 placeholder-slate-500 border border-slate-700 focus:outline-none focus:border-sky-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-2.5 skeuo-btn rounded-lg text-xs font-mono text-slate-200 border border-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Use">In Use</option>
            <option value="In Stock">In Stock</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          {/* View toggle */}
          <div className="flex items-center p-0.5 rounded-lg skeuo-recessed border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${
                viewMode === 'grid' ? 'bg-slate-700 text-sky-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs cursor-pointer transition-all ${
                viewMode === 'table' ? 'bg-slate-700 text-sky-400 shadow-xs' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Dense Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.length === 0 ? (
            <div className="col-span-full p-12 text-center skeuo-card rounded-xl border border-slate-700/60 font-mono text-xs text-slate-400">
              No equipment found matching criteria &ldquo;{searchQuery}&rdquo;.
            </div>
          ) : (
            filteredAssets.map(asset => {
              const isApple = asset.manufacturer.toLowerCase() === 'apple' || asset.appleCoverage !== undefined;
              return (
                <div
                  key={asset.id}
                  onClick={() => onSelectAsset(asset)}
                  className="skeuo-card p-4 rounded-xl border border-slate-700/60 hover:border-sky-500/60 transition-all cursor-pointer group shadow-lg flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Subtle corner screws on card */}
                  <div className="absolute top-2 left-2"><ScrewHead rotation={20} size="sm" /></div>
                  <div className="absolute top-2 right-2"><ScrewHead rotation={75} size="sm" /></div>

                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between pl-4 pr-4 mb-2.5">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40">
                        {asset.assetTag}
                      </span>
                      <div className="flex items-center gap-2">
                        <LedIndicator 
                          color={asset.status === 'In Stock' ? 'green' : asset.status === 'In Use' ? 'blue' : 'amber'} 
                          size="sm" 
                        />
                        <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                          {asset.status}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-sm font-bold text-slate-100 font-mono group-hover:text-sky-300 transition-colors line-clamp-1">
                      {asset.name}
                    </h3>

                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      {asset.manufacturer} • {asset.model}
                    </div>

                    {/* Serial & Barcode Tag */}
                    <div className="grid grid-cols-2 gap-2 my-2.5 p-2 rounded-lg skeuo-recessed text-[10px] font-mono border border-slate-800">
                      <div className="truncate">
                        <span className="text-slate-500 block">SERIAL NO.</span>
                        <span className="text-sky-400 font-semibold truncate block">{asset.serialNumber}</span>
                      </div>
                      <div className="truncate text-right">
                        <span className="text-slate-500 block">BARCODE</span>
                        <span className="text-slate-300 font-semibold truncate block">{asset.barcode}</span>
                      </div>
                    </div>

                    {/* Custody Pill */}
                    <div className="p-2.5 rounded-lg skeuo-recessed border border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate text-slate-200">
                          {asset.assignedTo ? (
                            <span>
                              <strong className="text-white">{asset.assignedTo.name}</strong> 
                              <span className="text-slate-400 text-[10px] block truncate">{asset.assignedTo.department}</span>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold">Available in Fleet Stock</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer with Apple Badge and Actions */}
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    {isApple ? (
                      <span className="text-sky-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> 
                        {asset.appleCoverage?.warrantyStatus || 'AppleCare+'}
                      </span>
                    ) : (
                      <span className="text-slate-400">
                        {asset.specs.processor.slice(0, 22)}...
                      </span>
                    )}

                    <span className="text-xs text-slate-400 group-hover:text-white font-mono flex items-center gap-1">
                      Inspect Details →
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* Dense Table View */
        <div className="skeuo-card rounded-xl border border-slate-700/60 overflow-x-auto shadow-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="skeuo-metal-header text-slate-400 uppercase text-[10px] tracking-wider border-b border-white/10">
              <tr>
                <th className="p-3">Asset Tag</th>
                <th className="p-3">Equipment</th>
                <th className="p-3">Serial / Barcode</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Current Custodian</th>
                <th className="p-3">Coverage</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filteredAssets.map(asset => (
                <tr 
                  key={asset.id} 
                  onClick={() => onSelectAsset(asset)}
                  className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="p-3 font-bold text-sky-400 whitespace-nowrap">
                    {asset.assetTag}
                  </td>
                  <td className="p-3 font-semibold text-slate-100 whitespace-nowrap">
                    {asset.name}
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    <div>{asset.serialNumber}</div>
                    <div className="text-[10px] text-slate-500">BAR: {asset.barcode}</div>
                  </td>
                  <td className="p-3 text-slate-400 whitespace-nowrap">
                    {asset.category}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <LedIndicator 
                        color={asset.status === 'In Stock' ? 'green' : asset.status === 'In Use' ? 'blue' : 'amber'} 
                        size="sm" 
                      />
                      <span>{asset.status}</span>
                    </div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {asset.assignedTo ? (
                      <div>
                        <strong className="text-white">{asset.assignedTo.name}</strong>
                        <div className="text-[10px] text-slate-400">{asset.assignedTo.department}</div>
                      </div>
                    ) : (
                      <span className="text-emerald-400">IT Stock Pool</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {asset.appleCoverage ? (
                      <span className="text-sky-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-sky-400" />
                        {asset.appleCoverage.warrantyStatus}
                      </span>
                    ) : (
                      <span className="text-slate-400">{asset.warrantyExpiry}</span>
                    )}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <SkeuoButton size="sm" onClick={(e) => { e.stopPropagation(); onSelectAsset(asset); }}>
                      View
                    </SkeuoButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
