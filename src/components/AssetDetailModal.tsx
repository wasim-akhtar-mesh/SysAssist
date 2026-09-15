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

/**
 * Asset Detail Inspector Drawer
 * Operational Right-Side Inspector on Desktop, Full-Screen Sheet on Mobile.
 * Preserves background context of the inventory workstation.
 */
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
  const [reassignReason, setReassignReason] = useState<string>('Hardware deployment per Jira SYS-1084');
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
        reason: 'Apple GSX Demo serial spec & AppleCare+ verification'
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
      reason: reassignReason || 'Standard fleet reallocation',
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
      newValue: 'IT Depot Pool [In Stock]',
      reason: 'Asset check-in and return to available inventory bay'
    };

    const updatedAsset: Asset = {
      ...asset,
      status: 'In Stock',
      assignedTo: null,
      location: 'IT Depot - Rack Bay 02',
      changeLogs: [newLog, ...asset.changeLogs]
    };

    onUpdateAsset(updatedAsset, newLog);
    setActiveTab('changelog');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="asset-drawer-title">
      {/* Light Backdrop (click to dismiss) */}
      <div 
        className="fixed inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Right-Side Inspector Drawer on Desktop / Full-screen Sheet on Mobile */}
      <div className="fixed inset-y-0 right-0 w-full md:w-[520px] lg:w-[580px] bg-[#F1F0EC] border-l border-[#D8D6CF] shadow-2xl flex flex-col z-50 animate-slide-in">
        
        {/* Drawer Header */}
        <div className="p-3.5 sm:p-4 border-b border-[#D8D6CF] bg-[#FAF9F5] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC]">
                {asset.assetTag}
              </span>
              <StatusBadge status={asset.status} />
              <span className="text-xs text-[#686B6D]">• {asset.category}</span>
            </div>
            <h2 id="asset-drawer-title" className="text-sm sm:text-base font-bold text-[#181A1B] truncate leading-tight">
              {asset.name}
            </h2>
            <div className="text-[11px] text-[#686B6D] truncate mt-0.5">
              {asset.manufacturer} • {asset.model} • S/N: <span className="font-mono text-[#181A1B]">{asset.serialNumber}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded ti-btn flex items-center justify-center text-[#505457] hover:text-[#181A1B] cursor-pointer shrink-0"
            aria-label="Close asset inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Navigation Tabs */}
        <div className="px-3 pt-2 pb-2 border-b border-[#D8D6CF] bg-[#EAE8E2] flex items-center gap-1 overflow-x-auto shrink-0 text-xs">
          <button
            onClick={() => { setActiveTab('overview'); }}
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-semibold'
                : 'text-[#686B6D] hover:text-[#181A1B]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Specifications</span>
          </button>

          {isApple && (
            <button
              onClick={() => { setActiveTab('apple'); }}
              className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'apple'
                  ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-semibold'
                  : 'text-[#686B6D] hover:text-[#181A1B]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Apple GSX</span>
            </button>
          )}

          <button
            onClick={() => { setActiveTab('changelog'); }}
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'changelog'
                ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-semibold'
                : 'text-[#686B6D] hover:text-[#181A1B]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Change Log ({asset.changeLogs.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('label'); }}
            className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'label'
                ? 'bg-[#FAF9F5] text-[#C66A2B] shadow-xs font-semibold'
                : 'text-[#686B6D] hover:text-[#181A1B]'
            }`}
          >
            <Barcode className="w-3.5 h-3.5" />
            <span>Tag Plate</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Technical Specifications */}
              <div className="ti-card rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#DFDDD6]">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#C66A2B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
                      Technical Specifications
                    </h3>
                  </div>
                  {isApple && (
                    <span className="text-[11px] text-[#0F682C] flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> GSX Verified
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Processor</span>
                    <span className="font-semibold text-[#181A1B] truncate block">{asset.specs.processor}</span>
                  </div>
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Unified Memory</span>
                    <span className="font-mono font-semibold text-[#181A1B] block">{asset.specs.ram}</span>
                  </div>
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Storage Tier</span>
                    <span className="font-mono font-semibold text-[#181A1B] block">{asset.specs.storage}</span>
                  </div>
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Graphics / GPU</span>
                    <span className="font-semibold text-[#181A1B] truncate block">{asset.specs.graphics}</span>
                  </div>
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Display Output</span>
                    <span className="font-semibold text-[#181A1B] truncate block">{asset.specs.display}</span>
                  </div>
                  <div className="p-2 rounded ti-well">
                    <span className="text-[10px] uppercase tracking-wide text-[#686B6D] block">Operating System</span>
                    <span className="font-semibold text-[#181A1B] truncate block">{asset.specs.os}</span>
                  </div>
                </div>
              </div>

              {/* Custody Assignment Bay */}
              <div className="ti-card rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2.5 pb-1.5 border-b border-[#DFDDD6]">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-[#C66A2B]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
                      Custody & Allocation
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#686B6D]">
                    Bay: {asset.location}
                  </span>
                </div>

                {asset.assignedTo ? (
                  <div className="p-3 rounded ti-well space-y-2 mb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-sm text-[#181A1B]">{asset.assignedTo.name}</div>
                        <div className="text-xs text-[#505457]">{asset.assignedTo.email}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3] font-medium">
                        {asset.assignedTo.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[#686B6D] pt-1.5 border-t border-[#D0CECA]">
                      <span>Department: <strong className="text-[#181A1B]">{asset.assignedTo.department}</strong></span>
                      <span>Assigned: <strong className="text-[#181A1B] font-mono">{asset.assignedTo.assignedDate}</strong></span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded ti-well text-center mb-3">
                    <div className="text-xs font-semibold text-[#0F682C] mb-0.5">Asset In Storage Depot</div>
                    <div className="text-[11px] text-[#686B6D]">Available for immediate fulfillment to pending Jira requests.</div>
                  </div>
                )}

                {/* Reassignment Action Buttons */}
                {!isReassigning ? (
                  <div className="flex items-center gap-2">
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => setIsReassigning(true)}
                      icon={<UserCheck className="w-3.5 h-3.5" />}
                    >
                      {asset.assignedTo ? 'Reassign Custody' : 'Assign to Requester'}
                    </SkeuoButton>

                    {asset.assignedTo && (
                      <SkeuoButton
                        size="sm"
                        variant="standard"
                        onClick={handleReturnToStock}
                      >
                        Return to Depot Pool
                      </SkeuoButton>
                    )}
                  </div>
                ) : (
                  /* Reassignment Form */
                  <form onSubmit={handleExecuteReassignment} className="p-3 rounded ti-surface border border-[#C5C3BC] space-y-2.5">
                    <h4 className="text-xs font-bold text-[#181A1B] flex items-center justify-between">
                      <span>Enter Reallocation Details</span>
                      <span className="text-[10px] text-[#686B6D] font-normal">Operator: {currentUser}</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5 font-medium">Custodian Name</label>
                        <input
                          type="text"
                          value={newAssigneeName}
                          onChange={(e) => setNewAssigneeName(e.target.value)}
                          required
                          className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5 font-medium">Email Address</label>
                        <input
                          type="email"
                          value={newAssigneeEmail}
                          onChange={(e) => setNewAssigneeEmail(e.target.value)}
                          required
                          className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5 font-medium">Department</label>
                        <input
                          type="text"
                          value={newDepartment}
                          onChange={(e) => setNewDepartment(e.target.value)}
                          required
                          className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5 font-medium">Linked Jira Ticket</label>
                        <select
                          value={selectedJiraKey}
                          onChange={(e) => setSelectedJiraKey(e.target.value)}
                          className="w-full h-7.5 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
                        >
                          <option value="">None / Manual Assignment</option>
                          {jiraTickets.map(t => (
                            <option key={t.key} value={t.key}>
                              {t.key} - {t.requester.name} ({t.priority})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5 font-medium">Justification / Change Note</label>
                      <input
                        type="text"
                        value={reassignReason}
                        onChange={(e) => setReassignReason(e.target.value)}
                        placeholder="e.g. Onboarding replacement or department hardware refresh"
                        className="w-full h-7.5 px-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <SkeuoButton size="sm" variant="subtle" type="button" onClick={() => setIsReassigning(false)}>
                        Cancel
                      </SkeuoButton>
                      <SkeuoButton size="sm" variant="primary" type="submit">
                        Commit Reallocation
                      </SkeuoButton>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: APPLE GSX VERIFICATION */}
          {activeTab === 'apple' && isApple && (
            <div className="space-y-3.5">
              <div className="ti-card rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#DFDDD6]">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                      Apple GSX Entitlement Service
                    </h3>
                    <div className="text-[11px] text-[#686B6D] mt-0.5">
                      Demo API Sandbox • Serial lookup & warranty status
                    </div>
                  </div>
                  
                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    onClick={handleSyncApple}
                    disabled={isSyncingApple}
                    icon={<RefreshCw className={`w-3.5 h-3.5 ${isSyncingApple ? 'animate-spin' : ''}`} />}
                  >
                    {isSyncingApple ? 'Querying...' : 'Sync Coverage'}
                  </SkeuoButton>
                </div>

                {appleSyncSuccess && (
                  <div className="p-2 mb-3 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-xs text-[#0F682C] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Entitlement verified and recorded to audit trail.</span>
                  </div>
                )}

                {asset.appleCoverage ? (
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded ti-well">
                        <span className="text-[10px] text-[#686B6D] block">Warranty Tier</span>
                        <span className="font-bold text-[#0F682C] block">{asset.appleCoverage.warrantyStatus}</span>
                      </div>
                      <div className="p-2 rounded ti-well">
                        <span className="text-[10px] text-[#686B6D] block">Agreement Number</span>
                        <span className="font-mono font-medium text-[#181A1B] block">{asset.appleCoverage.agreementNumber}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded ti-well">
                        <span className="text-[10px] text-[#686B6D] block">Purchase Date</span>
                        <span className="font-mono text-[#181A1B] block">{asset.appleCoverage.purchaseDate}</span>
                      </div>
                      <div className="p-2 rounded ti-well">
                        <span className="text-[10px] text-[#686B6D] block">Coverage End Date</span>
                        <span className="font-mono font-semibold text-[#181A1B] block">{asset.appleCoverage.coverageEndDate}</span>
                      </div>
                    </div>

                    <div className="p-2.5 rounded bg-[#FAF9F5] border border-[#DFDDD6] text-[11px] text-[#686B6D] space-y-1">
                      <div className="flex justify-between">
                        <span>Hardware Coverage:</span>
                        <strong className="text-[#0F682C]">{asset.appleCoverage.hardwareCoverage}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Technical Support:</span>
                        <strong className="text-[#0F682C]">{asset.appleCoverage.techSupportCoverage}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#EAE8E2]">
                        <span>Last Verified:</span>
                        <span className="font-mono text-[#181A1B]">{new Date(asset.appleCoverage.lastSyncTimestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded ti-well text-center text-xs">
                    <p className="text-[#686B6D] mb-3">No GSX entitlement records currently cached for serial <span className="font-mono font-bold text-[#181A1B]">{asset.serialNumber}</span>.</p>
                    <SkeuoButton size="sm" variant="primary" onClick={handleSyncApple} disabled={isSyncingApple}>
                      Execute GSX Entitlement Check
                    </SkeuoButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CHANGE LOG */}
          {activeTab === 'changelog' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-[#686B6D] px-1">
                <span>Total Events: <strong className="text-[#181A1B]">{asset.changeLogs.length}</strong></span>
                <span className="font-mono text-[10px]">DEVICE ID: {asset.id}</span>
              </div>

              {asset.changeLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg ti-card space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-[#181A1B]">{log.action}</span>
                    <span className="font-mono text-[10px] text-[#686B6D]">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div className="text-[11px] text-[#505457]">
                    Property: <strong className="text-[#181A1B]">{log.property}</strong>
                  </div>

                  <div className="p-2 rounded ti-well text-[11px] font-mono grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#A81F1A] block text-[10px] uppercase">Before</span>
                      <span className="text-[#505457] truncate block">{log.oldValue}</span>
                    </div>
                    <div>
                      <span className="text-[#0F682C] block text-[10px] uppercase">After</span>
                      <span className="text-[#181A1B] font-semibold truncate block">{log.newValue}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#686B6D] pt-1">
                    <span>By: <strong className="text-[#181A1B]">{log.performedBy}</strong></span>
                    {log.jiraTicketKey && (
                      <span className="font-mono px-1 rounded bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3]">
                        {log.jiraTicketKey}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ASSET TAG PLATE */}
          {activeTab === 'label' && (
            <div className="space-y-3">
              <div className="ti-card rounded-lg p-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B] mb-2">
                  Calibrated Hardware Asset Tag Plate
                </h3>
                <p className="text-xs text-[#686B6D] mb-4">
                  Printable barcode identification tag for physical chassis affixing.
                </p>
                <div className="flex justify-center p-2 bg-[#E5E3DD] rounded-lg border border-[#C5C3BC]">
                  <BarcodeLabelPlate asset={asset} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
