import React, { useState } from 'react';
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
  Sparkles,
  MapPin,
  Tag,
  Hash,
  Activity,
  Layers
} from 'lucide-react';
import { Asset, ChangeLogEntry, JiraTicket } from '../types';
import { AppleApiService } from '../services/appleService';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl my-auto skeuo-metal-panel rounded-2xl p-5 sm:p-7 relative border-2 border-[#374151] shadow-[0_30px_70px_rgba(0,0,0,0.95)]">
        
        {/* Hardware chassis rivets */}
        <div className="absolute top-3 left-3"><ScrewHead rotation={18} /></div>
        <div className="absolute top-3 right-3"><ScrewHead rotation={105} /></div>
        <div className="absolute bottom-3 left-3"><ScrewHead rotation={60} /></div>
        <div className="absolute bottom-3 right-3"><ScrewHead rotation={145} /></div>

        {/* Modal Top Bar */}
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl skeuo-recessed flex items-center justify-center border border-slate-700">
              <Laptop className="w-6 h-6 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40">
                  {asset.assetTag}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100 font-mono tracking-tight text-engraved">
                  {asset.name}
                </h2>
                <LedIndicator 
                  color={asset.status === 'In Stock' ? 'green' : asset.status === 'In Use' ? 'blue' : 'amber'} 
                  size="md"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
                <span>Model: <strong className="text-slate-200">{asset.manufacturer} {asset.model}</strong></span>
                <span>•</span>
                <span>S/N: <strong className="text-sky-300">{asset.serialNumber}</strong></span>
                <span>•</span>
                <span className="text-slate-400">Barcode: <strong className="text-slate-300">{asset.barcode}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg skeuo-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 mt-4 pb-3 overflow-x-auto">
          <SkeuoButton
            size="sm"
            activeState={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Layers className="w-3.5 h-3.5" />}
          >
            Overview & Assignment
          </SkeuoButton>

          {isApple && (
            <SkeuoButton
              size="sm"
              activeState={activeTab === 'apple'}
              onClick={() => setActiveTab('apple')}
              icon={<ShieldCheck className="w-3.5 h-3.5 text-sky-400" />}
            >
              Apple API & Specs
            </SkeuoButton>
          )}

          <SkeuoButton
            size="sm"
            activeState={activeTab === 'changelog'}
            onClick={() => setActiveTab('changelog')}
            icon={<History className="w-3.5 h-3.5" />}
          >
            Change Logs & Audit ({asset.changeLogs.length})
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            activeState={activeTab === 'label'}
            onClick={() => setActiveTab('label')}
            icon={<Barcode className="w-3.5 h-3.5" />}
          >
            Barcode Tag
          </SkeuoButton>
        </div>

        {/* Tab 1: Overview & Assignment */}
        {activeTab === 'overview' && (
          <div className="mt-5 space-y-5">
            {/* Current Custodian & Location Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Custody Card */}
              <div className="skeuo-card p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                      Current Equipment Custodian
                    </span>
                  </div>
                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                    asset.status === 'In Use' 
                      ? 'bg-blue-950/80 text-blue-300 border border-blue-600/40' 
                      : 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/40'
                  }`}>
                    {asset.status}
                  </span>
                </div>

                {asset.assignedTo ? (
                  <div className="skeuo-recessed p-3.5 rounded-lg border border-slate-800">
                    <div className="text-base font-bold text-slate-100">
                      {asset.assignedTo.name}
                    </div>
                    <div className="text-xs text-sky-400 font-mono mt-0.5">
                      {asset.assignedTo.email}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-white/5 text-xs text-slate-400 font-mono">
                      <div>
                        <span className="text-slate-500 block text-[10px]">DEPARTMENT</span>
                        <span className="text-slate-200">{asset.assignedTo.department}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px]">ASSIGNED DATE</span>
                        <span className="text-slate-200">{asset.assignedTo.assignedDate}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="skeuo-recessed p-5 rounded-lg text-center border border-slate-800">
                    <span className="text-xs text-emerald-400 font-mono font-bold block mb-1">
                      AVAILABLE IN FLEET STOCK
                    </span>
                    <p className="text-xs text-slate-400">
                      Ready for immediate deployment to new hire or upgrade request.
                    </p>
                  </div>
                )}

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-white/5">
                  <SkeuoButton
                    size="sm"
                    variant="accent"
                    onClick={() => setIsReassigning(!isReassigning)}
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                  >
                    {asset.assignedTo ? 'Reassign Equipment...' : 'Assign to Employee...'}
                  </SkeuoButton>

                  {asset.assignedTo && (
                    <SkeuoButton
                      size="sm"
                      onClick={handleReturnToStock}
                    >
                      Check-in / Return to Stock
                    </SkeuoButton>
                  )}
                </div>
              </div>

              {/* Physical Location & Procurement Card */}
              <div className="skeuo-card p-4 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                    Chassis Location & Financials
                  </span>
                </div>

                <div className="skeuo-recessed p-3.5 rounded-lg border border-slate-800 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">DEPLOYMENT LOCATION:</span>
                    <span className="text-slate-200 font-bold">{asset.location}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PURCHASE DATE:</span>
                    <span className="text-slate-200">{asset.purchaseDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">PURCHASE PRICE:</span>
                    <span className="text-emerald-400 font-bold">${asset.purchasePrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">ENTERPRISE SUPPLIER:</span>
                    <span className="text-slate-200">{asset.supplier}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-slate-400">WARRANTY EXPIRY:</span>
                    <span className="text-amber-300 font-bold">{asset.warrantyExpiry}</span>
                  </div>
                </div>

                {asset.linkedJiraKey && (
                  <div className="mt-3 p-2.5 rounded-lg bg-sky-950/40 border border-sky-600/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-sky-300">
                      <Tag className="w-3.5 h-3.5 text-sky-400" />
                      Linked Jira: <strong>{asset.linkedJiraKey}</strong>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400 uppercase">Tracked in Atlassian</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reassignment Form Drawer (Prompt requirement: "reassigns xxx from John to Sina, it should show who did, when did and to which property") */}
            {isReassigning && (
              <form onSubmit={handleExecuteReassignment} className="p-5 rounded-xl skeuo-metal-panel border-2 border-sky-500/50 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-sky-400" />
                    <h4 className="text-sm font-bold font-mono uppercase text-slate-100 tracking-wider">
                      Reassign Asset Custody
                    </h4>
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Operator: <strong className="text-sky-300">{currentUser}</strong>
                  </span>
                </div>

                {/* Visual change preview banner */}
                <div className="p-3 rounded-lg skeuo-recessed border border-slate-700/80 mb-4 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex-1 truncate">
                    <span className="text-slate-500 block text-[10px]">CURRENT ASSIGNEE</span>
                    <span className="text-red-300 line-through truncate font-medium">
                      {asset.assignedTo ? asset.assignedTo.name : 'IT Stock Pool'}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="flex-1 truncate text-right">
                    <span className="text-slate-500 block text-[10px]">NEW ASSIGNEE</span>
                    <span className="text-emerald-400 font-bold truncate">
                      {newAssigneeName || 'Enter name'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      New Assignee Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newAssigneeName}
                      onChange={(e) => setNewAssigneeName(e.target.value)}
                      placeholder="e.g. Sina Vance"
                      className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Corporate Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newAssigneeEmail}
                      onChange={(e) => setNewAssigneeEmail(e.target.value)}
                      placeholder="e.g. sina.vance@company.internal"
                      className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={newDepartment}
                      onChange={(e) => setNewDepartment(e.target.value)}
                      placeholder="e.g. Product Management"
                      className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                      Associated Jira Hardware Request
                    </label>
                    <select
                      value={selectedJiraKey}
                      onChange={(e) => setSelectedJiraKey(e.target.value)}
                      className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                    >
                      <option value="">-- None / Standalone --</option>
                      {jiraTickets.map(t => (
                        <option key={t.key} value={t.key}>
                          {t.key}: {t.summary.slice(0, 45)}...
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                    Audit Log Reason / Notes *
                  </label>
                  <input
                    type="text"
                    required
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    placeholder="e.g. Reassigned from John Doe to Sina Vance per Jira SYS-1084 hardware upgrade"
                    className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <SkeuoButton
                    type="button"
                    size="sm"
                    onClick={() => setIsReassigning(false)}
                  >
                    Cancel
                  </SkeuoButton>
                  <SkeuoButton
                    type="submit"
                    variant="emerald"
                    size="sm"
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Commit Reassignment & Record Change Log
                  </SkeuoButton>
                </div>
              </form>
            )}

            {/* Hardware Specification Grid */}
            <div className="skeuo-card p-4 rounded-xl border border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-mono uppercase tracking-wider font-bold text-slate-300">
                    Hardware Specifications
                  </span>
                </div>
                {isApple && (
                  <span className="text-[10px] font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-600/30">
                    Verified via Apple GSX API
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">PROCESSOR</span>
                  <span className="text-xs font-bold text-slate-100 leading-tight block">
                    {asset.specs.processor}
                  </span>
                </div>
                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">RAM / MEMORY</span>
                  <span className="text-xs font-bold text-sky-300 leading-tight block">
                    {asset.specs.ram}
                  </span>
                </div>
                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">INTERNAL SSD</span>
                  <span className="text-xs font-bold text-emerald-300 leading-tight block">
                    {asset.specs.storage}
                  </span>
                </div>
              </div>

              {asset.specs.display && (
                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800 mt-3 text-xs font-mono flex items-center justify-between">
                  <span className="text-slate-400">DISPLAY PANEL:</span>
                  <span className="text-slate-200 font-semibold">{asset.specs.display}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Apple GSX API & Warranty Coverage */}
        {activeTab === 'apple' && (
          <div className="mt-5 space-y-5">
            {/* Apple API Live Status Header */}
            <div className="skeuo-card p-5 rounded-xl border border-sky-600/30 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-sky-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wide">
                      Apple Global Service Exchange (GSX) & Coverage API
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Query live Apple coverage, warranty expiration, and factory hardware configuration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {appleSyncSuccess && (
                    <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> GSX Sync Complete!
                    </span>
                  )}
                  <SkeuoButton
                    size="sm"
                    variant="accent"
                    onClick={handleSyncApple}
                    disabled={isSyncingApple}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingApple ? 'animate-spin' : ''}`} />}
                  >
                    {isSyncingApple ? 'Querying Apple GSX...' : 'Sync with Apple API'}
                  </SkeuoButton>
                </div>
              </div>

              {/* Coverage Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    COVERAGE STATUS
                  </span>
                  <div className="flex items-center gap-2">
                    <LedIndicator 
                      color={asset.appleCoverage?.warrantyStatus.includes('Active') ? 'green' : 'red'} 
                      size="sm" 
                    />
                    <span className="text-xs font-bold text-slate-100 font-mono">
                      {asset.appleCoverage?.warrantyStatus || 'Active AppleCare+'}
                    </span>
                  </div>
                </div>

                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    PURCHASE DATE
                  </span>
                  <span className="text-xs font-bold text-slate-200 font-mono">
                    {asset.appleCoverage?.purchaseDate || asset.purchaseDate}
                  </span>
                </div>

                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    COVERAGE END DATE
                  </span>
                  <span className="text-xs font-bold text-sky-300 font-mono">
                    {asset.appleCoverage?.coverageEndDate || asset.warrantyExpiry}
                  </span>
                </div>

                <div className="skeuo-recessed p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    AGREEMENT NUMBER
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono truncate block">
                    {asset.appleCoverage?.agreementNumber || 'AGR-ACPLUS-8492019'}
                  </span>
                </div>
              </div>

              {/* Service & Support Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">HARDWARE REPAIRS & SERVICE:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Covered (Zero Deductible Fleet)
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">TELEPHONE TECHNICAL SUPPORT:</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active (24/7 Priority Access)
                  </span>
                </div>
              </div>
            </div>

            {/* Apple Detailed Silicon & Hardware Specs */}
            <div className="skeuo-card p-5 rounded-xl border border-slate-700/60">
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-wider mb-3">
                Apple Factory Build Configuration
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="skeuo-recessed p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 mb-2">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono uppercase">Apple Silicon SOC</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    {asset.specs.processor}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Integrated hardware ray tracing, ProRes accelerator & dedicated Neural Engine.
                  </div>
                </div>

                <div className="skeuo-recessed p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono uppercase">Unified RAM</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    {asset.specs.ram}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Zero-copy architecture shared directly between CPU cores and GPU shaders.
                  </div>
                </div>

                <div className="skeuo-recessed p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-sky-400 mb-2">
                    <HardDrive className="w-4 h-4" />
                    <span className="text-xs font-bold font-mono uppercase">NVMe SSD Storage</span>
                  </div>
                  <div className="text-sm font-bold text-white mb-1">
                    {asset.specs.storage}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    PCIe Gen4 throughput up to 7,400 MB/s sequential read. Hardware AES encrypted.
                  </div>
                </div>
              </div>

              {/* Battery Diagnostic Telemetry */}
              {asset.specs.batteryHealth !== undefined && (
                <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">BATTERY HEALTH:</span>
                    <span className={`font-bold ${asset.specs.batteryHealth >= 80 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {asset.specs.batteryHealth}% Maximum Capacity
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">CYCLE COUNT:</span>
                    <span className="text-slate-200 font-bold">{asset.specs.batteryCycles || 0} cycles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">LAST GSX AUDIT:</span>
                    <span className="text-slate-400">{asset.appleCoverage?.lastSyncTimestamp.slice(0, 10)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Change Logs & Audit Trail */}
        {activeTab === 'changelog' && (
          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
                  Asset Change Log History
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Tamper-evident audit record of reassignments, status transitions, and spec alterations
                </p>
              </div>
              <SkeuoButton
                size="sm"
                variant="accent"
                onClick={() => setIsReassigning(true)}
                icon={<UserCheck className="w-3.5 h-3.5" />}
              >
                New Reassignment
              </SkeuoButton>
            </div>

            {asset.changeLogs.length === 0 ? (
              <div className="p-8 rounded-xl skeuo-recessed text-center text-slate-400 font-mono text-xs">
                No previous changes recorded for this asset yet.
              </div>
            ) : (
              <div className="space-y-3">
                {asset.changeLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="skeuo-card p-4 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-600/40 font-bold uppercase">
                          {log.action}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          Property: <strong className="text-amber-300">{log.property}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Visual Old Value -> New Value Diff */}
                    <div className="skeuo-recessed p-3 rounded-lg border border-slate-800 text-xs font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 my-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">BEFORE CHANGE</span>
                        <span className="text-red-300 font-medium line-through break-words">
                          {log.oldValue}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">AFTER CHANGE</span>
                        <span className="text-emerald-400 font-bold break-words">
                          {log.newValue}
                        </span>
                      </div>
                    </div>

                    {/* Operator and Reason Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
                      <div className="text-slate-400">
                        Performed By: <strong className="text-sky-300">{log.performedBy}</strong>
                      </div>
                      {log.reason && (
                        <div className="text-slate-400 italic">
                          &ldquo;{log.reason}&rdquo;
                        </div>
                      )}
                      {log.jiraTicketKey && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] border border-blue-600/30">
                          Jira: {log.jiraTicketKey}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Physical Barcode Tag Plate */}
        {activeTab === 'label' && (
          <div className="mt-5 space-y-4">
            <div className="text-center max-w-md mx-auto mb-4">
              <h3 className="text-sm font-bold font-mono uppercase text-slate-200">
                Skeuomorphic Laser-Etched Asset Tag
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Printable metallic property barcode plate ready for chassis adhesion
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <BarcodeLabelPlate asset={asset} showPrintButton={true} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
