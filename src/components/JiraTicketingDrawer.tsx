import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Laptop, 
  ArrowRight, 
  Settings, 
  Check, 
  Search,
  X,
  Layers,
  UserCheck
} from 'lucide-react';
import { JiraTicket, Asset, ChangeLogEntry } from '../types';
import { JiraService, DEFAULT_JIRA_CONFIG } from '../services/jiraService';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, StatusBadge } from './SkeuoComponents';

interface JiraTicketingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: JiraTicket[];
  assets: Asset[];
  onAddTicket: (ticket: JiraTicket) => void;
  onFulfillTicket: (ticketKey: string, assetId: string, log: ChangeLogEntry) => void;
  currentUser: string;
}

export const JiraTicketingDrawer: React.FC<JiraTicketingDrawerProps> = ({
  isOpen,
  onClose,
  tickets,
  assets,
  onAddTicket,
  onFulfillTicket,
  currentUser
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'new_ticket' | 'settings'>('queue');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // New ticket form states
  const [summary, setSummary] = useState<string>('');
  const [requesterName, setRequesterName] = useState<string>('');
  const [requesterEmail, setRequesterEmail] = useState<string>('');
  const [department, setDepartment] = useState<string>('Engineering');
  const [requestedEquipment, setRequestedEquipment] = useState<string>('MacBook Pro 16" M3 Max');
  const [priority, setPriority] = useState<'Highest' | 'High' | 'Medium' | 'Low'>('High');
  const [description, setDescription] = useState<string>('');

  // Fulfill modal states
  const [fulfillingTicket, setFulfillingTicket] = useState<JiraTicket | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  // Jira config settings
  const [jiraDomain, setJiraDomain] = useState<string>(DEFAULT_JIRA_CONFIG.domain);
  const [jiraProjectKey, setJiraProjectKey] = useState<string>(DEFAULT_JIRA_CONFIG.projectKey);
  const [savedSettingsSuccess, setSavedSettingsSuccess] = useState<boolean>(false);

  // Close fulfillment modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fulfillingTicket) {
        setFulfillingTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fulfillingTicket]);

  if (!isOpen) return null;

  const filteredTickets = tickets.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch = t.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.requester.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary || !requesterName) return;

    const newTicket: JiraTicket = {
      key: JiraService.generateTicketKey(tickets),
      summary,
      description,
      issueType: 'Hardware Request',
      status: 'Open',
      priority,
      requester: {
        name: requesterName,
        email: requesterEmail || `${requesterName.toLowerCase().replace(/\s+/g, '.')}@company.internal`,
        department
      },
      requestedEquipment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    soundFx.playReassignSuccess();
    onAddTicket(newTicket);
    setSummary('');
    setRequesterName('');
    setDescription('');
    setActiveSubTab('queue');
  };

  const handleExecuteFulfillment = () => {
    if (!fulfillingTicket || !selectedAssetId) return;

    const targetAsset = assets.find(a => a.id === selectedAssetId);
    if (!targetAsset) return;

    const oldAssigneeLabel = targetAsset.assignedTo 
      ? `${targetAsset.assignedTo.name} (${targetAsset.assignedTo.department})` 
      : 'IT Depot Pool (Unassigned)';

    const newAssigneeLabel = `${fulfillingTicket.requester.name} (${fulfillingTicket.requester.department})`;

    const newLog: ChangeLogEntry = {
      id: `log-${Date.now()}`,
      assetId: targetAsset.id,
      assetTag: targetAsset.assetTag,
      assetName: targetAsset.name,
      timestamp: new Date().toISOString(),
      performedBy: currentUser,
      action: 'REASSIGN',
      property: 'Assigned To (Jira Fulfill)',
      oldValue: oldAssigneeLabel,
      newValue: newAssigneeLabel,
      reason: `Fulfilling Jira Request ${fulfillingTicket.key}: ${fulfillingTicket.summary}`,
      jiraTicketKey: fulfillingTicket.key
    };

    soundFx.playReassignSuccess();
    onFulfillTicket(fulfillingTicket.key, targetAsset.id, newLog);
    setFulfillingTicket(null);
    setSelectedAssetId('');
  };

  const availableStockAssets = assets.filter(a => a.status === 'In Stock');

  return (
    <div className="space-y-4">
      {/* Top Banner / Instrument Panel */}
      <div className="instrument-panel rounded-xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-600/40 flex items-center justify-center text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-sans font-bold text-slate-100">
                  Jira Service Management Integration
                </h2>
                <span className="text-[10px] font-sans font-semibold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/40">
                  Sandbox Demo
                </span>
              </div>
              <p className="text-xs font-sans text-slate-400 mt-0.5">
                Target Project: <strong className="text-blue-300 font-mono">{jiraProjectKey}</strong> • Instance: <span className="font-mono text-slate-300">{jiraDomain}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LedIndicator color="blue" label="SANDBOX SYNC" size="sm" />
          </div>
        </div>

        {/* Sub Navigation Bar */}
        <div className="flex items-center gap-2 mt-3.5 pt-1">
          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'queue'}
            onClick={() => { soundFx.playMechanicalClick(); setActiveSubTab('queue'); }}
            icon={<Clock className="w-3.5 h-3.5" />}
          >
            Request Queue ({tickets.filter(t => t.status !== 'Fulfilled').length} Open)
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'new_ticket'}
            onClick={() => { soundFx.playMechanicalClick(); setActiveSubTab('new_ticket'); }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Request
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'settings'}
            onClick={() => { soundFx.playMechanicalClick(); setActiveSubTab('settings'); }}
            icon={<Settings className="w-3.5 h-3.5" />}
          >
            Jira Sandbox Config
          </SkeuoButton>
        </div>
      </div>

      {/* SUBTAB 1: REQUEST QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-3">
          {/* Filter Bar */}
          <div className="instrument-panel rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requests by ticket key (SYS-1082), requester, or summary..."
                className="w-full h-9 pl-9 pr-3 instrument-well rounded-lg text-xs font-sans text-slate-100 placeholder-slate-500 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 px-3 rounded-lg instrument-btn text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
              >
                <option value="all">All Statuses ({tickets.length})</option>
                <option value="open">Open / Pending ({tickets.filter(t => t.status.toLowerCase() === 'open').length})</option>
                <option value="in progress">In Progress ({tickets.filter(t => t.status.toLowerCase() === 'in progress').length})</option>
                <option value="fulfilled">Fulfilled ({tickets.filter(t => t.status.toLowerCase() === 'fulfilled').length})</option>
              </select>

              <SkeuoButton
                size="sm"
                variant="primary"
                onClick={() => setActiveSubTab('new_ticket')}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                New Request
              </SkeuoButton>
            </div>
          </div>

          {/* Ticket Cards Grid */}
          <div className="space-y-2.5">
            {filteredTickets.length === 0 ? (
              <div className="p-10 text-center instrument-panel rounded-xl text-slate-400">
                No Jira tickets matched your search criteria.
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isFulfilled = ticket.status === 'Fulfilled';
                return (
                  <div 
                    key={ticket.key} 
                    className="instrument-card rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#10141b] text-blue-300 border border-blue-600/30">
                          {ticket.key}
                        </span>
                        <StatusBadge status={ticket.priority} type="priority" />
                        <StatusBadge status={ticket.status} type="status" />
                        <span className="text-[11px] text-slate-400 font-sans">
                          Submitted {new Date(ticket.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-sans font-semibold text-slate-100">
                        {ticket.summary}
                      </h4>

                      <div className="text-xs font-sans text-slate-300 flex flex-wrap items-center gap-2">
                        <span>Requester: <strong className="text-slate-100">{ticket.requester.name}</strong> ({ticket.requester.department})</span>
                        <span>•</span>
                        <span>Target: <span className="text-blue-300 font-medium">{ticket.requestedEquipment}</span></span>
                      </div>

                      {ticket.description && (
                        <p className="text-xs text-slate-400 font-sans line-clamp-1">
                          {ticket.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/[0.04]">
                      {!isFulfilled ? (
                        <SkeuoButton
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            soundFx.playMechanicalClick();
                            setFulfillingTicket(ticket);
                          }}
                          icon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          Fulfill with Stock
                        </SkeuoButton>
                      ) : (
                        <span className="text-xs font-sans text-emerald-400 flex items-center gap-1.5 font-medium px-2.5 py-1 rounded instrument-well">
                          <CheckCircle2 className="w-4 h-4" /> Fulfilled & Assigned
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: NEW TICKET FORM */}
      {activeSubTab === 'new_ticket' && (
        <div className="instrument-panel rounded-xl p-5">
          <h3 className="text-sm font-sans font-bold text-slate-100 mb-1">
            Submit Hardware Provisioning Request
          </h3>
          <p className="text-xs font-sans text-slate-400 mb-4">
            Simulates creating a formal Atlassian Jira hardware service desk ticket and queues it for IT inventory fulfillment.
          </p>

          <form onSubmit={handleCreateTicket} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Summary / Request Title *
              </label>
              <input
                type="text"
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Standard Developer Rig for new Senior Engineer"
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                  Requester Name *
                </label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Product Management">Product Management</option>
                  <option value="Design">Design</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                  Requested Equipment Specification
                </label>
                <input
                  type="text"
                  value={requestedEquipment}
                  onChange={(e) => setRequestedEquipment(e.target.value)}
                  placeholder="e.g. MacBook Pro 16 M3 Max or Dell UltraSharp 32"
                  className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Highest">Highest (Expedited Onboarding)</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium (Standard Replacement)</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Business Justification / Notes
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details regarding hardware requirements, peripherals needed, shipping instructions..."
                className="w-full p-2.5 instrument-well rounded-lg text-xs font-sans text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <SkeuoButton
                type="submit"
                variant="primary"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Submit Ticket to Queue
              </SkeuoButton>

              <SkeuoButton
                type="button"
                variant="subtle"
                onClick={() => setActiveSubTab('queue')}
              >
                Cancel
              </SkeuoButton>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 3: SANDBOX SETTINGS */}
      {activeSubTab === 'settings' && (
        <div className="instrument-panel rounded-xl p-5 max-w-2xl">
          <h3 className="text-sm font-sans font-bold text-slate-100 mb-1">
            Jira Service Management Sandbox Configuration
          </h3>
          <p className="text-xs font-sans text-slate-400 mb-4">
            Configure simulated Atlassian Jira Cloud instance parameters for hardware procurement workflows.
          </p>

          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Atlassian Domain
              </label>
              <input
                type="text"
                value={jiraDomain}
                onChange={(e) => setJiraDomain(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-300 mb-1">
                Project Key Prefix
              </label>
              <input
                type="text"
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value)}
                className="w-full h-9 px-3 instrument-well rounded-lg text-xs font-mono text-slate-100 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <SkeuoButton
                variant="standard"
                onClick={() => {
                  soundFx.playMechanicalClick();
                  setSavedSettingsSuccess(true);
                  setTimeout(() => setSavedSettingsSuccess(false), 2500);
                }}
              >
                {savedSettingsSuccess ? '✓ Configuration Saved' : 'Save Parameters'}
              </SkeuoButton>
            </div>
          </div>
        </div>
      )}

      {/* FULFILLMENT MODAL PANEL */}
      {fulfillingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="instrument-panel rounded-2xl w-full max-w-lg p-5 border border-white/[0.1] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div>
                <h3 className="text-sm font-sans font-bold text-slate-100">
                  Fulfill Jira Request: {fulfillingTicket.key}
                </h3>
                <p className="text-xs font-sans text-slate-400">
                  Select available hardware from depot reserves to assign to {fulfillingTicket.requester.name}.
                </p>
              </div>
              <button
                onClick={() => setFulfillingTicket(null)}
                className="w-8 h-8 rounded-lg instrument-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close fulfillment modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="instrument-well p-3 rounded-xl border border-white/[0.04] space-y-1 text-xs font-sans">
              <div className="text-slate-400">
                Summary: <strong className="text-slate-200">{fulfillingTicket.summary}</strong>
              </div>
              <div className="text-slate-400">
                Requested: <span className="text-blue-300 font-semibold">{fulfillingTicket.requestedEquipment}</span>
              </div>
              <div className="text-slate-400">
                Department: <span className="text-slate-300">{fulfillingTicket.requester.department}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-sans font-semibold text-slate-200 mb-1.5">
                Available In-Stock Assets ({availableStockAssets.length} Ready in Depot)
              </label>

              {availableStockAssets.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs font-sans">
                  No equipment is currently marked &ldquo;In Stock&rdquo;. Please intake new equipment or inspect returned devices first.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availableStockAssets.map(asset => (
                    <label
                      key={asset.id}
                      className={`p-3 rounded-lg flex items-center justify-between gap-3 border cursor-pointer transition-colors ${
                        selectedAssetId === asset.id
                          ? 'bg-[#1b2535] border-blue-500 text-white'
                          : 'instrument-well border-white/[0.05] hover:border-white/[0.1] text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="selectedAsset"
                          checked={selectedAssetId === asset.id}
                          onChange={() => setSelectedAssetId(asset.id)}
                          className="accent-blue-500"
                        />
                        <div>
                          <div className="text-xs font-sans font-semibold flex items-center gap-2">
                            <span>{asset.name}</span>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-blue-300">
                              {asset.assetTag}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            S/N: <span className="font-mono">{asset.serialNumber}</span> • {asset.location}
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-mono text-emerald-400 font-medium">
                        Ready
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
              <SkeuoButton
                type="button"
                variant="subtle"
                onClick={() => setFulfillingTicket(null)}
              >
                Cancel
              </SkeuoButton>

              <SkeuoButton
                type="button"
                variant="primary"
                disabled={!selectedAssetId}
                onClick={handleExecuteFulfillment}
                icon={<Check className="w-3.5 h-3.5" />}
              >
                Complete Assignment
              </SkeuoButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
