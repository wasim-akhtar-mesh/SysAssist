import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Laptop, 
  ArrowRight, 
  Settings, 
  Check, 
  Link as LinkIcon,
  Search
} from 'lucide-react';
import { JiraTicket, Asset, ChangeLogEntry } from '../types';
import { JiraService, DEFAULT_JIRA_CONFIG } from '../services/jiraService';
import { soundFx } from '../services/audioService';
import { SkeuoButton, LedIndicator, ScrewHead } from './SkeuoComponents';

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
      : 'IT Stock Pool (Unassigned)';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl my-auto skeuo-metal-panel rounded-2xl p-5 sm:p-7 relative border-2 border-[#374151] shadow-[0_30px_70px_rgba(0,0,0,0.95)]">
        
        {/* Corner rivets */}
        <div className="absolute top-3 left-3"><ScrewHead rotation={45} /></div>
        <div className="absolute top-3 right-3"><ScrewHead rotation={135} /></div>
        <div className="absolute bottom-3 left-3"><ScrewHead rotation={220} /></div>
        <div className="absolute bottom-3 right-3"><ScrewHead rotation={310} /></div>

        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-blue-600 to-blue-900 border border-blue-400/40 flex items-center justify-center shadow-[0_2px_8px_rgba(37,99,235,0.4)]">
              <span className="text-base font-black text-white font-mono">JIRA</span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-100 font-mono uppercase tracking-wide">
                  Atlassian Jira Hardware & Procurement Sync
                </h2>
                <LedIndicator color="green" label="LIVE SYNC" size="sm" />
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Project: <strong className="text-sky-400">{jiraProjectKey}</strong> • Host: <strong className="text-slate-300">{jiraDomain}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg skeuo-btn flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 mt-4 pb-3">
          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'queue'}
            onClick={() => setActiveSubTab('queue')}
            icon={<Clock className="w-3.5 h-3.5" />}
          >
            Hardware Requests ({tickets.filter(t => t.status !== 'Fulfilled').length} Open)
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'new_ticket'}
            onClick={() => setActiveSubTab('new_ticket')}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Create Jira Request
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            activeState={activeSubTab === 'settings'}
            onClick={() => setActiveSubTab('settings')}
            icon={<Settings className="w-3.5 h-3.5" />}
          >
            Integration Settings
          </SkeuoButton>
        </div>

        {/* Tab 1: Hardware Requests Queue */}
        {activeSubTab === 'queue' && (
          <div className="mt-5 space-y-4">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl skeuo-recessed border border-slate-800">
              <div className="flex items-center gap-2 flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tickets, requesters, keys..."
                  className="w-full bg-transparent text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400 uppercase">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-8 px-2.5 skeuo-btn rounded-lg text-xs font-mono text-slate-200 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in progress">In Progress</option>
                  <option value="fulfilled">Fulfilled</option>
                </select>
              </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
              {filteredTickets.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-slate-400 skeuo-recessed rounded-xl">
                  No Jira tickets found matching current filter criteria.
                </div>
              ) : (
                filteredTickets.map(ticket => (
                  <div 
                    key={ticket.key} 
                    className="skeuo-card p-4 rounded-xl border border-slate-700/60 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-sky-400 px-2 py-0.5 rounded bg-sky-950 border border-sky-600/40">
                            {ticket.key}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                            ticket.status === 'Fulfilled'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                              : ticket.status === 'In Progress'
                              ? 'bg-amber-950 text-amber-300 border border-amber-600/40'
                              : 'bg-blue-950 text-blue-300 border border-blue-600/40'
                          }`}>
                            {ticket.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            Priority: <strong className={ticket.priority === 'Highest' || ticket.priority === 'High' ? 'text-red-400' : 'text-slate-300'}>{ticket.priority}</strong>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-100 font-mono pt-1">
                          {ticket.summary}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          {ticket.description}
                        </p>
                      </div>

                      {/* Action Button */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        {ticket.status !== 'Fulfilled' ? (
                          <SkeuoButton
                            size="sm"
                            variant="emerald"
                            onClick={() => {
                              setFulfillingTicket(ticket);
                              // Auto-select first in-stock asset
                              if (availableStockAssets.length > 0) {
                                setSelectedAssetId(availableStockAssets[0].id);
                              }
                            }}
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          >
                            Fulfill Request
                          </SkeuoButton>
                        ) : (
                          <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Fulfilled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Requester & Equipment Footer */}
                    <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400">
                      <div>
                        Requester: <strong className="text-slate-200">{ticket.requester.name}</strong> ({ticket.requester.department})
                      </div>
                      <div>
                        Requested: <strong className="text-sky-300">{ticket.requestedEquipment}</strong>
                      </div>
                      {ticket.linkedAssetTag && (
                        <div className="text-emerald-400 flex items-center gap-1 font-bold">
                          <LinkIcon className="w-3 h-3" /> Asset: {ticket.linkedAssetTag}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Fulfill Ticket Modal Overlay */}
            {fulfillingTicket && (
              <div className="p-5 rounded-xl skeuo-metal-panel border-2 border-emerald-500/50 shadow-2xl mt-4 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold font-mono uppercase text-slate-100">
                      Fulfill Hardware Request: {fulfillingTicket.key}
                    </h4>
                  </div>
                  <button
                    onClick={() => setFulfillingTicket(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-mono mb-4">
                  Select an available asset from fleet stock to assign to <strong>{fulfillingTicket.requester.name}</strong> ({fulfillingTicket.requester.department}). This will immediately update custody and write an audit change log.
                </p>

                {availableStockAssets.length === 0 ? (
                  <div className="p-4 rounded-lg skeuo-recessed text-amber-300 font-mono text-xs mb-4">
                    ⚠️ No equipment currently marked &ldquo;In Stock&rdquo;. Please check-in or provision hardware before fulfilling.
                  </div>
                ) : (
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {availableStockAssets.map(asset => (
                      <label 
                        key={asset.id} 
                        className={`p-3 rounded-lg flex items-center justify-between cursor-pointer border transition-all ${
                          selectedAssetId === asset.id 
                            ? 'bg-sky-950/60 border-sky-500/80 shadow-inner' 
                            : 'skeuo-card border-slate-700/60 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="fulfillAsset"
                            checked={selectedAssetId === asset.id}
                            onChange={() => setSelectedAssetId(asset.id)}
                            className="text-sky-500"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-100 font-mono">
                              {asset.assetTag} • {asset.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              S/N: {asset.serialNumber} • Loc: {asset.location}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                          {asset.category}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                  <SkeuoButton
                    size="sm"
                    onClick={() => setFulfillingTicket(null)}
                  >
                    Cancel
                  </SkeuoButton>
                  <SkeuoButton
                    size="sm"
                    variant="emerald"
                    disabled={!selectedAssetId}
                    onClick={handleExecuteFulfillment}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Confirm & Complete Fulfillment
                  </SkeuoButton>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Create Jira Ticket Form */}
        {activeSubTab === 'new_ticket' && (
          <form onSubmit={handleCreateTicket} className="mt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Ticket Summary / Subject *
                </label>
                <input
                  type="text"
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="e.g. Hardware Request: MacBook Pro 16 for AI Team"
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Priority SLA
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                >
                  <option value="Highest">Highest (4 Hour SLA)</option>
                  <option value="High">High (24 Hour SLA)</option>
                  <option value="Medium">Medium (3 Business Days)</option>
                  <option value="Low">Low (Standard)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Requester Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="e.g. Sina Vance"
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Product Management"
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Requested Equipment Specification
                </label>
                <input
                  type="text"
                  value={requestedEquipment}
                  onChange={(e) => setRequestedEquipment(e.target.value)}
                  placeholder="e.g. MacBook Pro 16 (M3 Max / 64GB Unified Memory / 2TB SSD)"
                  className="w-full h-9 px-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                  Business Justification & Notes
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail why this hardware is required, manager approval status, and target start date."
                  className="w-full p-3 skeuo-recessed rounded-lg text-xs font-mono text-slate-100 border border-slate-700 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
              <SkeuoButton
                type="button"
                size="sm"
                onClick={() => setActiveSubTab('queue')}
              >
                Cancel
              </SkeuoButton>
              <SkeuoButton
                type="submit"
                variant="accent"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Dispatch to Jira Board
              </SkeuoButton>
            </div>
          </form>
        )}

        {/* Tab 3: Jira Settings */}
        {activeSubTab === 'settings' && (
          <div className="mt-5 space-y-4">
            <div className="skeuo-card p-5 rounded-xl border border-slate-700/60">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200 mb-3">
                Atlassian Cloud Credentials
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div>
                  <label className="text-slate-400 block mb-1">JIRA DOMAIN</label>
                  <input
                    type="text"
                    value={jiraDomain}
                    onChange={(e) => setJiraDomain(e.target.value)}
                    className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-200 border border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">PROJECT KEY</label>
                  <input
                    type="text"
                    value={jiraProjectKey}
                    onChange={(e) => setJiraProjectKey(e.target.value)}
                    className="w-full h-9 px-3 skeuo-recessed rounded-lg text-slate-200 border border-slate-700"
                  />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LedIndicator color="green" size="sm" />
                  <span className="text-xs font-mono text-emerald-400">
                    Webhook listener active on port 3000
                  </span>
                </div>

                <SkeuoButton
                  size="sm"
                  variant="accent"
                  onClick={() => {
                    JiraService.updateConfig({ domain: jiraDomain, projectKey: jiraProjectKey });
                    setSavedSettingsSuccess(true);
                    setTimeout(() => setSavedSettingsSuccess(false), 2500);
                  }}
                >
                  {savedSettingsSuccess ? 'Saved & Verified!' : 'Save Credentials'}
                </SkeuoButton>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
