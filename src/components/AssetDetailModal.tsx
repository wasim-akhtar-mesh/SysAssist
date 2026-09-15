import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  RefreshCw, 
  Clock, 
  Cpu, 
  HardDrive, 
  ShieldCheck, 
  Calendar, 
  Barcode, 
  CheckCircle2, 
  History, 
  ExternalLink,
  Laptop,
  ArrowRight,
  MapPin,
  Tag,
  Hash,
  AlertCircle
} from 'lucide-react';
import { Asset, ChangeLogEntry, JiraTicket } from '../types';
import { AppleApiService } from '../services/appleService';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, StatusBadge } from './SkeuoComponents';
import { BarcodeLabelPlate } from './BarcodeLabelPlate';

interface AssetDetailModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAsset: (updatedAsset: Asset, newLog: ChangeLogEntry) => void;
  currentUser: string;
  jiraTickets: JiraTicket[];
}

export const AssetDetailModal: React.FC<AssetDetailModalProps> = ({
  asset,
  isOpen,
  onClose,
  onUpdateAsset,
  currentUser,
  jiraTickets
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'apple' | 'changelog' | 'label'>('overview');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);
  const [newAssigneeName, setNewAssigneeName] = useState<string>('Sina Vance');
  const [newAssigneeEmail, setNewAssigneeEmail] = useState<string>('sina.vance@company.internal');
  const [newDepartment, setNewDepartment] = useState<string>('Product Management');
  const [reassignReason, setReassignReason] = useState<string>('Hardware upgrade per Jira SYS-1084');
  const [selectedJiraKey, setSelectedJiraKey] = useState<string>('SYS-1084');
  const [isSyncingApple, setIsSyncingApple] = useState<boolean>(false);
  const [appleSyncSuccess, setAppleSyncSuccess] = useState<boolean>(false);

  // Keyboard navigation: close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isReassigning) {
          setIsReassigning(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isReassigning, onClose]);

  if (!isOpen || !asset) return null;

  const isApple = asset.manufacturer.toLowerCase() === 'apple' || asset.appleCoverage !== undefined;

  const handleSyncApple = async () => {
    setIsSyncingApple(true);
    soundFx.playMechanicalClick();
    try {
      const result = await AppleApiService.fetchCoverageBySerial(asset.serialNumber);
      
      const newLog: ChangeLogEntry = {
        id: `log-${Date.now()}`,
        assetId: asset.id,
        assetTag: asset.assetTag,
        assetName: asset.name,
        timestamp: new Date().toISOString(),
        performedBy: currentUser,
        action: 'WARRANTY_SYNC',
        property: 'Apple Coverage & Specs',
        oldValue: asset.appleCoverage ? `${asset.appleCoverage.warrantyStatus} (Last: ${asset.appleCoverage.lastSyncTimestamp.slice(0, 10)})` : 'Unsynced',
        newValue: `${result.coverage.warrantyStatus} (Valid until ${result.coverage.coverageEndDate})`,
        reason: 'Automated GSX serial spec & AppleCare+ verification'
      };

      const updated: Asset = {
        ...asset,
        specs: {
          ...asset.specs,
          ...result.specs
        },
        appleCoverage: result.coverage,
        changeLogs: [newLog, ...asset.changeLogs]
      };

      onUpdateAsset(updated, newLog);
      setAppleSyncSuccess(true);
      soundFx.playReassignSuccess();
      setTimeout(() => setAppleSyncSuccess(false), 3000);
    } finally {
      setIsSyncingApple(false);
    }
  };

  const handleExecuteReassignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssigneeName.trim()) return;

    const oldAssigneeLabel = asset.assignedTo 
      ? `${asset.assignedTo.name} (${asset.assignedTo.department})` 
      : 'IT Stock Pool (Unassigned)';

    const newAssigneeLabel = `${newAssigneeName.trim()} (${newDepartment.trim()})`;

    const newLog: ChangeLogEntry = {
      id: `log-${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      timestamp: new Date().toISOString(),
      performedBy: currentUser,
      action: 'REASSIGN',
      property: 'Assigned To',
      oldValue: oldAssigneeLabel,
      newValue: newAssigneeLabel,
      reason: reassignReason || 'Standard fleet redistribution',
      jiraTicketKey: selectedJiraKey || undefined
    };

    const updatedAsset: Asset = {
      ...asset,
      status: 'In Use',
      assignedTo: {
        name: newAssigneeName.trim(),
        email: newAssigneeEmail.trim() || `${newAssigneeName.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
        department: newDepartment.trim() || 'General Operations',
        assignedDate: new Date().toISOString().slice(0, 10),
        role: 'Hardware Custodian'
      },
      linkedJiraKey: selectedJiraKey || asset.linkedJiraKey,
      changeLogs: [newLog, ...asset.changeLogs]
    };

    soundFx.playReassignSuccess();
    onUpdateAsset(updatedAsset, newLog);
    setIsReassigning(false);
    setActiveTab('changelog');
  };

  const handleReturnToStock = () => {
    const oldAssigneeLabel = asset.assignedTo ? asset.assignedTo.name : 'Unknown';
    const newLog: ChangeLogEntry = {
      id: `log-${Date.now()}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      timestamp: new Date().toISOString(),
      performedBy: currentUser,
      action: 'CHECK_IN',
      property: 'Assigned To & Status',
      oldValue: `${oldAssigneeLabel} [In Use]`,
      newValue: 'IT Stock Pool [In Stock]',
      reason: 'Asset check-in and return to available depot'
    };

    const updatedAsset: Asset = {
      ...asset,
      status: 'In Stock',
      assignedTo: null,
      location: 'IT Depot - Rack Bay 02',
      changeLogs: [newLog, ...asset.changeLogs]
    };

    soundFx.playMechanicalClick();
    onUpdateAsset(updatedAsset, newLog);
    setActiveTab('changelog');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="asset-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col instrument-panel rounded-2xl border border-white/[0.09] shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/[0.07] bg-[#12151b] flex flex-wrap items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl instrument-well flex items-center justify-center text-blue-400 border border-white/[0.05]">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#10141b] text-blue-300 border border-blue-600/30">
                  {asset.assetTag}
                </span>
                <h2 id="asset-modal-title" className="text-base sm:text-lg font-sans font-bold text-slate-100">
                  {asset.name}
                </h2>
                <StatusBadge status={asset.status} />
              </div>
              <div className="text-xs font-sans text-slate-400 mt-0.5">
                {asset.manufacturer} • {asset.model} • S/N: <span className="font-mono text-slate-300">{asset.serialNumber}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg instrument-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close asset details modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs Bar */}
        <div className="px-4 sm:px-5 pt-2 pb-2 border-b border-white/[0.06] bg-[#101318] flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            onClick={() => { soundFx.playMechanicalClick(); setActiveTab('overview'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#1e2736] text-white border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Specifications & Custody</span>
          </button>

          {isApple && (
            <button
              onClick={() => { soundFx.playMechanicalClick(); setActiveTab('apple'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'apple'
                  ? 'bg-[#1e2736] text-blue-300 border border-blue-500/40 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Apple GSX Verification</span>
            </button>
          )}

          <button
            onClick={() => { soundFx.playMechanicalClick(); setActiveTab('changelog'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'changelog'
                ? 'bg-[#1e2736] text-white border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Change Log ({asset.changeLogs.length})</span>
          </button>

          <button
            onClick={() => { soundFx.playMechanicalClick(); setActiveTab('label'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-sans font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'label'
                ? 'bg-[#1e2736] text-white border border-blue-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Asset Tag Plate</span>
          </button>
        </div>

        {/* Modal Body Content (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              
              {/* Technical Specifications Bay */}
              <div className="instrument-card rounded-xl p-4">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.05]">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-200">
                      Hardware Technical Specifications
                    </h3>
                  </div>
                  {isApple && (
                    <span className="text-[11px] text-blue-300 font-sans flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> GSX Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">Processor / SoC</span>
                    <span className="text-xs font-sans font-semibold text-slate-100 block truncate" title={asset.specs.processor}>
                      {asset.specs.processor}
                    </span>
                  </div>
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">System Memory</span>
                    <span className="text-xs font-mono font-semibold text-slate-100 block">
                      {asset.specs.ram}
                    </span>
                  </div>
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">Primary Storage</span>
                    <span className="text-xs font-mono font-semibold text-slate-100 block">
                      {asset.specs.storage}
                    </span>
                  </div>
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">Graphics / GPU</span>
                    <span className="text-xs font-sans font-semibold text-slate-200 block truncate">
                      {asset.specs.graphics}
                    </span>
                  </div>
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">Display Panel</span>
                    <span className="text-xs font-sans font-semibold text-slate-200 block truncate">
                      {asset.specs.display}
                    </span>
                  </div>
                  <div className="instrument-well p-3 rounded-lg">
                    <span className="text-[10px] uppercase font-sans tracking-wide text-slate-500 block mb-0.5">Operating System</span>
                    <span className="text-xs font-sans font-semibold text-slate-200 block truncate">
                      {asset.specs.os}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custody and Placement Bay */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Current Custody Card */}
                <div className="instrument-card rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/[0.05]">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-200">
                          Current Assigned Custodian
                        </h3>
                      </div>
                      <StatusBadge status={asset.status} />
                    </div>

                    {asset.assignedTo ? (
                      <div className="instrument-well p-3.5 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-sans">Custodian:</span>
                          <span className="text-xs font-sans font-bold text-slate-100">{asset.assignedTo.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-sans">Department:</span>
                          <span className="text-xs font-sans text-slate-200">{asset.assignedTo.department}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-sans">Email:</span>
                          <span className="text-xs font-mono text-blue-300 truncate max-w-[200px]">{asset.assignedTo.email}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04]">
                          <span className="text-xs text-slate-400 font-sans">Assigned Date:</span>
                          <span className="text-xs font-mono text-slate-300">{asset.assignedTo.assignedDate}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="instrument-well p-5 rounded-lg text-center">
                        <span className="text-xs text-emerald-400 font-sans font-semibold block mb-1">
                          Available in Depot Reserves
                        </span>
                        <p className="text-xs text-slate-400 font-sans">
                          Ready for immediate allocation to team member or replacement ticket.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/[0.05]">
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => setIsReassigning(!isReassigning)}
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      {asset.assignedTo ? 'Reassign Custody...' : 'Assign to Employee...'}
                    </SkeuoButton>

                    {asset.assignedTo && (
                      <SkeuoButton
                        size="sm"
                        variant="standard"
                        onClick={handleReturnToStock}
                      >
                        Check-in / Return to Stock
                      </SkeuoButton>
                    )}
                  </div>
                </div>

                {/* Location and Acquisition Details */}
                <div className="instrument-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/[0.05]">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-200">
                      Depot Location & Procurement
                    </h3>
                  </div>

                  <div className="instrument-well p-3.5 rounded-lg space-y-2 text-xs font-sans">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Physical Location:</span>
                      <span className="text-slate-200 font-semibold">{asset.location}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Purchase Date:</span>
                      <span className="text-slate-200 font-mono">{asset.purchaseDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Purchase Cost:</span>
                      <span className="text-emerald-400 font-mono font-bold">${asset.purchasePrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Supplier:</span>
                      <span className="text-slate-200">{asset.supplier}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-white/[0.04]">
                      <span className="text-slate-400">Warranty Expiration:</span>
                      <span className="text-amber-300 font-mono font-semibold">{asset.warrantyExpiry}</span>
                    </div>
                  </div>

                  {asset.linkedJiraKey && (
                    <div className="mt-3 p-2.5 rounded-lg bg-blue-950/40 border border-blue-700/30 flex items-center justify-between text-xs font-sans">
                      <div className="flex items-center gap-2 text-blue-300">
                        <Tag className="w-3.5 h-3.5 text-blue-400" />
                        <span>Linked Jira: <strong className="font-mono">{asset.linkedJiraKey}</strong></span>
                      </div>
                      <span className="text-[10px] text-blue-400 uppercase font-semibold">Service Desk</span>
                    </div>
                  )}
                </div>
              </div>

              {/* REASSIGNMENT FORM DRAWER (Shows who did, when did, to which property) */}
              {isReassigning && (
                <form onSubmit={handleExecuteReassignment} className="p-4 sm:p-5 rounded-xl instrument-panel border border-blue-500/50 shadow-xl animate-fade-in space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-400" />
                      <h4 className="text-sm font-sans font-bold text-slate-100">
                        Reassign Equipment Custodian
                      </h4>
                    </div>
                    <span className="text-xs font-sans text-slate-400">
                      Operator: <strong className="text-blue-300">{currentUser}</strong>
                    </span>
                  </div>

                  {/* Visual preview of diff */}
                  <div className="p-3 rounded-lg instrument-well flex items-center justify-between gap-3 text-xs font-sans">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-medium">Previous Custodian:</span>
                      <span className="text-rose-300 font-semibold">{asset.assignedTo ? asset.assignedTo.name : 'IT Depot Pool'}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-medium">New Custodian:</span>
                      <span className="text-emerald-400 font-semibold">{newAssigneeName || 'Enter name below'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                        New Assignee Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newAssigneeName}
                        onChange={(e) => setNewAssigneeName(e.target.value)}
                        placeholder="e.g. Sina Vance"
                        className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                        Department
                      </label>
                      <select
                        value={newDepartment}
                        onChange={(e) => setNewDepartment(e.target.value)}
                        className="w-full h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="Product Management">Product Management</option>
                        <option value="Engineering">Engineering</option>
                        <option value="Design">Design</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Operations">Operations</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                        Corporate Email
                      </label>
                      <input
                        type="email"
                        value={newAssigneeEmail}
                        onChange={(e) => setNewAssigneeEmail(e.target.value)}
                        placeholder="sina.vance@company.internal"
                        className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                        Link Jira Ticket (Optional)
                      </label>
                      <select
                        value={selectedJiraKey}
                        onChange={(e) => setSelectedJiraKey(e.target.value)}
                        className="w-full h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">No linked Jira ticket</option>
                        {jiraTickets.map(t => (
                          <option key={t.key} value={t.key}>
                            {t.key}: {t.summary.slice(0, 32)}...
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                      Audit Reason & Justification *
                    </label>
                    <input
                      type="text"
                      required
                      value={reassignReason}
                      onChange={(e) => setReassignReason(e.target.value)}
                      placeholder="e.g. Hardware upgrade per Jira SYS-1084, confirmed with IT manager"
                      className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                    <SkeuoButton
                      type="button"
                      variant="subtle"
                      onClick={() => setIsReassigning(false)}
                    >
                      Cancel
                    </SkeuoButton>

                    <SkeuoButton
                      type="submit"
                      variant="primary"
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Confirm Reassignment
                    </SkeuoButton>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: APPLE GSX VERIFICATION (DEMO) */}
          {activeTab === 'apple' && isApple && (
            <div className="space-y-4">
              <div className="instrument-card rounded-xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06] mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                      <h3 className="text-sm font-sans font-bold text-slate-100">
                        Apple Global Service Exchange (GSX) API Integration
                      </h3>
                      <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/40">
                        Demo API Sandbox
                      </span>
                    </div>
                    <p className="text-xs font-sans text-slate-400 mt-0.5">
                      Direct verification against Apple serial registry. Pulls verified hardware configuration and AppleCare+ status.
                    </p>
                  </div>

                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    disabled={isSyncingApple}
                    onClick={handleSyncApple}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingApple ? 'animate-spin' : ''}`} />}
                  >
                    {isSyncingApple ? 'Querying GSX...' : 'Re-verify with Apple'}
                  </SkeuoButton>
                </div>

                {appleSyncSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-sans mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Successfully verified hardware entitlement with Apple GSX registry. Audit entry recorded.</span>
                  </div>
                )}

                {asset.appleCoverage ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="instrument-well p-3.5 rounded-lg">
                        <span className="text-[10px] font-sans uppercase tracking-wide text-slate-500 block mb-0.5">Coverage Status</span>
                        <span className="text-sm font-sans font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {asset.appleCoverage.warrantyStatus}
                        </span>
                      </div>

                      <div className="instrument-well p-3.5 rounded-lg">
                        <span className="text-[10px] font-sans uppercase tracking-wide text-slate-500 block mb-0.5">Coverage End Date</span>
                        <span className="text-sm font-mono font-bold text-slate-100">
                          {asset.appleCoverage.coverageEndDate}
                        </span>
                      </div>

                      <div className="instrument-well p-3.5 rounded-lg">
                        <span className="text-[10px] font-sans uppercase tracking-wide text-slate-500 block mb-0.5">Days Remaining</span>
                        <span className="text-sm font-mono font-bold text-blue-300">
                          {asset.appleCoverage.daysRemaining} days
                        </span>
                      </div>

                      <div className="instrument-well p-3.5 rounded-lg">
                        <span className="text-[10px] font-sans uppercase tracking-wide text-slate-500 block mb-0.5">Agreement Number</span>
                        <span className="text-xs font-mono font-bold text-slate-300 truncate block">
                          {asset.appleCoverage.agreementNumber}
                        </span>
                      </div>
                    </div>

                    <div className="instrument-well p-4 rounded-lg space-y-2.5 text-xs font-sans border border-white/[0.04]">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Verified Apple Model:</span>
                        <span className="text-slate-200 font-semibold">{asset.appleCoverage.appleModelName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Registered Purchase Date:</span>
                        <span className="text-slate-200 font-mono">{asset.appleCoverage.purchaseDate}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">AppleCare Plan:</span>
                        <span className="text-blue-300 font-medium">{asset.appleCoverage.appleCarePlan}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Hardware Technical Support:</span>
                        <span className="text-emerald-400 font-medium">Eligible for Priority Phone & Onsite</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                        <span className="text-slate-400">Last Verified Timestamp:</span>
                        <span className="text-slate-400 font-mono text-[11px]">{new Date(asset.appleCoverage.lastSyncTimestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center instrument-well rounded-xl text-xs font-sans text-slate-400">
                    No GSX entitlement records currently cached. Click &ldquo;Re-verify with Apple&rdquo; to fetch coverage status.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHANGE LOG & AUDIT TRAIL */}
          {activeTab === 'changelog' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-200">
                  Audit History for {asset.assetTag}
                </h3>
                <span className="text-xs font-sans text-slate-400">
                  {asset.changeLogs.length} logged modifications
                </span>
              </div>

              {asset.changeLogs.length === 0 ? (
                <div className="p-8 text-center instrument-well rounded-xl text-xs font-sans text-slate-400">
                  No previous change log entries recorded for this unit.
                </div>
              ) : (
                asset.changeLogs.map(log => (
                  <div key={log.id} className="instrument-card rounded-xl p-3.5 space-y-2 text-xs font-sans">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{log.action}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/40 font-mono">
                          {log.property}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="instrument-well p-2.5 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Previous:</span>
                        <span className="text-rose-300 font-mono line-through truncate block">{log.oldValue}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase font-sans">Updated:</span>
                        <span className="text-emerald-400 font-mono font-semibold truncate block">{log.newValue}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                      <span>Operator: <strong className="text-slate-200">{log.performedBy}</strong></span>
                      {log.reason && <span className="italic">&ldquo;{log.reason}&rdquo;</span>}
                      {log.jiraTicketKey && (
                        <span className="font-mono text-blue-300 px-1.5 py-0.2 rounded bg-blue-950 border border-blue-800/40">
                          {log.jiraTicketKey}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: PHYSICAL ASSET TAG PLATE */}
          {activeTab === 'label' && (
            <div className="space-y-3 max-w-lg mx-auto py-2">
              <BarcodeLabelPlate asset={asset} showPrintButton={true} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
