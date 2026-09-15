import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink, 
  User, 
  Laptop, 
  Calendar, 
  Tag, 
  Search,
  Filter,
  Settings,
  ShieldCheck,
  Building,
  Check,
  ArrowRight,
  X
} from 'lucide-react';
import { JiraTicket, Asset, ChangeLogEntry } from '../types';
import { SkeuoButton, LedIndicator, StatusBadge } from './SkeuoComponents';

interface JiraTicketingViewProps {
  tickets: JiraTicket[];
  assets: Asset[];
  onFulfillTicket: (ticketKey: string, assetId: string, log: ChangeLogEntry) => void;
  onCreateTicket: (ticket: JiraTicket) => void;
  currentUser: string;
  onSelectAssetByTag?: (assetTag: string) => void;
}

export const JiraTicketingDrawer: React.FC<JiraTicketingViewProps> = ({
  tickets,
  assets,
  onFulfillTicket,
  onCreateTicket,
  currentUser,
  onSelectAssetByTag
}) => {
  const [selectedTicketKey, setSelectedTicketKey] = useState<string>(tickets[0]?.key || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeView, setActiveView] = useState<'details' | 'new_ticket' | 'settings'>('details');

  // Focused Fulfillment Dialog State
  const [fulfillingTicket, setFulfillingTicket] = useState<JiraTicket | null>(null);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');

  // New ticket form
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [reqName, setReqName] = useState('Wasim Akhtar');
  const [reqEmail, setReqEmail] = useState('wasim.akhtar@company.internal');
  const [reqDept, setReqDept] = useState('Hardware Operations');
  const [hardwareType, setHardwareType] = useState('MacBook Pro 16" (M3 Pro, 36GB, 1TB)');
  const [priority, setPriority] = useState<'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest'>('High');

  // Sandbox config settings
  const [jiraDomain, setJiraDomain] = useState('enterprise-sysassist.atlassian.net');
  const [jiraProjectKey, setJiraProjectKey] = useState('SYS');

  const filteredTickets = tickets.filter(ticket => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      ticket.key.toLowerCase().includes(q) ||
      ticket.summary.toLowerCase().includes(q) ||
      ticket.requester.name.toLowerCase().includes(q) ||
      ticket.requester.department.toLowerCase().includes(q)
    );
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'open' && ticket.status.toLowerCase() === 'open') ||
      (filterStatus === 'fulfilled' && ticket.status.toLowerCase() === 'fulfilled') ||
      (filterStatus === 'in progress' && ticket.status.toLowerCase() === 'in progress');
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = tickets.find(t => t.key === selectedTicketKey) || filteredTickets[0] || tickets[0];
  const availableStockAssets = assets.filter(a => a.status === 'In Stock');

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    const nextIdNum = 1085 + tickets.length;
    const newKey = `${jiraProjectKey}-${nextIdNum}`;

    const newTicket: JiraTicket = {
      id: `jira-${Date.now()}`,
      key: newKey,
      summary: summary.trim(),
      description: description.trim() || `Automated request for ${hardwareType} initiated via SysAssist Workstation.`,
      status: 'Open',
      priority,
      createdDate: new Date().toISOString().slice(0, 10),
      requester: {
        name: reqName.trim(),
        email: reqEmail.trim(),
        department: reqDept.trim()
      },
      requestedHardware: hardwareType
    };

    onCreateTicket(newTicket);
    setSelectedTicketKey(newKey);
    setActiveView('details');
    setSummary('');
    setDescription('');
  };

  const handleExecuteFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
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

    onFulfillTicket(fulfillingTicket.key, targetAsset.id, newLog);
    setFulfillingTicket(null);
    setSelectedAssetId('');
  };

  return (
    <div className="space-y-3.5">
      {/* Top Banner Toolbar */}
      <div className="p-3 rounded-lg ti-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#181A1B]">
                Jira Service Management Workspace
              </h2>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3] font-medium">
                Sandbox Demo API
              </span>
            </div>
            <div className="text-[11px] text-[#686B6D] mt-0.5">
              Target Project: <strong className="font-mono text-[#181A1B]">{jiraProjectKey}</strong> • Instance: <span className="font-mono">{jiraDomain}</span>
            </div>
          </div>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-1.5">
          <SkeuoButton
            size="sm"
            variant="standard"
            activeState={activeView === 'details'}
            onClick={() => { setActiveView('details'); }}
          >
            Requests ({tickets.filter(t => t.status !== 'Fulfilled').length} Pending)
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            variant="standard"
            activeState={activeView === 'new_ticket'}
            onClick={() => { setActiveView('new_ticket'); }}
            icon={<Plus className="w-3.5 h-3.5 text-[#C66A2B]" />}
          >
            New Request
          </SkeuoButton>

          <SkeuoButton
            size="sm"
            variant="standard"
            activeState={activeView === 'settings'}
            onClick={() => { setActiveView('settings'); }}
            icon={<Settings className="w-3.5 h-3.5 text-[#505457]" />}
          >
            Config
          </SkeuoButton>
        </div>
      </div>

      {/* Primary Workspace: Master-Detail Layout */}
      {activeView === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          
          {/* Left Column: Requests List (5 cols on lg, 4 on xl) */}
          <div className="lg:col-span-5 xl:col-span-4 ti-surface rounded-lg p-3 space-y-2.5">
            {/* Search and Filters */}
            <div className="space-y-2 pb-2 border-b border-[#D8D6CF]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter key (SYS-1082), requester..."
                  className="w-full h-8 pl-8 pr-2.5 ti-well rounded text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                />
                <Search className="w-3.5 h-3.5 text-[#7A7D80] absolute left-2.5 top-2.2 pointer-events-none" />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#686B6D] text-[11px]">
                  {filteredTickets.length} tickets
                </span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="h-7 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
                >
                  <option value="all">All ({tickets.length})</option>
                  <option value="open">Open ({tickets.filter(t => t.status === 'Open').length})</option>
                  <option value="in progress">In Progress ({tickets.filter(t => t.status === 'In Progress').length})</option>
                  <option value="fulfilled">Fulfilled ({tickets.filter(t => t.status === 'Fulfilled').length})</option>
                </select>
              </div>
            </div>

            {/* List of Tickets */}
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredTickets.map(ticket => {
                const isSelected = selectedTicket?.key === ticket.key;
                const isFulfilled = ticket.status === 'Fulfilled';

                return (
                  <div
                    key={ticket.key}
                    onClick={() => {
                      setSelectedTicketKey(ticket.key);
                    }}
                    className={`p-2.5 rounded-md cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#FAF9F5] border-[#C66A2B] shadow-xs ring-1 ring-[#C66A2B]/20'
                        : 'ti-card hover:border-[#C5C3BC]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-xs font-bold text-[#181A1B]">
                        {ticket.key}
                      </span>
                      <StatusBadge status={ticket.priority} type="priority" />
                    </div>

                    <div className="text-xs font-medium text-[#181A1B] line-clamp-1 mb-1">
                      {ticket.summary}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#686B6D]">
                      <span className="truncate max-w-[150px]">{ticket.requester.name}</span>
                      <span className={`px-1.5 py-0.2 rounded font-medium ${
                        isFulfilled ? 'bg-[#EBF7EE] text-[#0F682C]' : 'bg-[#FFF8E6] text-[#8C4F00]'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Contextual Request Details (7 cols on lg, 8 on xl) */}
          <div className="lg:col-span-7 xl:col-span-8 ti-surface rounded-lg p-4 space-y-4">
            {selectedTicket ? (
              <>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D8D6CF]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC]">
                        {selectedTicket.key}
                      </span>
                      <StatusBadge status={selectedTicket.status} />
                      <StatusBadge status={selectedTicket.priority} type="priority" />
                    </div>
                    <h3 className="text-base font-bold text-[#181A1B]">
                      {selectedTicket.summary}
                    </h3>
                    <div className="text-xs text-[#686B6D] mt-0.5">
                      Submitted on {selectedTicket.createdDate} via Jira Service Desk
                    </div>
                  </div>

                  {selectedTicket.status !== 'Fulfilled' ? (
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        setFulfillingTicket(selectedTicket);
                      }}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Fulfill Hardware
                    </SkeuoButton>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-xs font-semibold text-[#0F682C]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Provisioned</span>
                    </div>
                  )}
                </div>

                {/* Requester & Hardware Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="ti-card rounded-md p-3 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#686B6D] block">Requester Identity</span>
                    <div className="font-bold text-[#181A1B] text-sm">{selectedTicket.requester.name}</div>
                    <div className="text-[#505457]">{selectedTicket.requester.email}</div>
                    <div className="text-[#686B6D] pt-1 border-t border-[#DFDDD6]">
                      Department: <strong className="text-[#181A1B]">{selectedTicket.requester.department}</strong>
                    </div>
                  </div>

                  <div className="ti-card rounded-md p-3 space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#686B6D] block">Requested Equipment Profile</span>
                    <div className="font-semibold text-[#181A1B] text-xs leading-snug">{selectedTicket.requestedHardware}</div>
                    <div className="text-[#686B6D] pt-1 border-t border-[#DFDDD6]">
                      Urgency: <strong className="text-[#181A1B]">{selectedTicket.priority} Priority</strong>
                    </div>
                  </div>
                </div>

                {/* Description & Business Justification */}
                <div className="ti-card rounded-md p-3 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-[#686B6D] block">Business Justification / Request Details</span>
                  <p className="text-[#181A1B] leading-relaxed">
                    {selectedTicket.description}
                  </p>
                </div>

                {/* Fulfillment Status Banner */}
                {selectedTicket.status === 'Fulfilled' && selectedTicket.fulfilledAssetTag ? (
                  <div className="p-3 rounded-md bg-[#EBF7EE] border border-[#B7E5C3] text-xs flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[#0F682C] flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Fulfillment Completed</span>
                      </div>
                      <div className="text-[#2C6E9B] mt-0.5">
                        Assigned Hardware Tag: <strong className="font-mono text-[#181A1B]">{selectedTicket.fulfilledAssetTag}</strong>
                      </div>
                    </div>

                    {onSelectAssetByTag && (
                      <SkeuoButton
                        size="sm"
                        variant="standard"
                        onClick={() => onSelectAssetByTag(selectedTicket.fulfilledAssetTag!)}
                      >
                        View Asset
                      </SkeuoButton>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-md ti-well border border-[#D8D6CF] text-xs flex items-center justify-between">
                    <div className="text-[#686B6D]">
                      Hardware currently unassigned. <strong className="text-[#181A1B]">{availableStockAssets.length}</strong> items available in storage depot.
                    </div>
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => setFulfillingTicket(selectedTicket)}
                    >
                      Assign From Depot
                    </SkeuoButton>
                  </div>
                )}
              </>
            ) : (
              <div className="p-12 text-center text-xs text-[#686B6D]">
                Select a ticket from the left panel to inspect details and initiate fulfillment.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create New Ticket Tab */}
      {activeView === 'new_ticket' && (
        <div className="max-w-2xl mx-auto ti-surface rounded-lg p-5 border border-[#D8D6CF]">
          <h3 className="text-sm font-bold text-[#181A1B] mb-3 pb-2 border-b border-[#D8D6CF]">
            Create Hardware Service Request
          </h3>
          <form onSubmit={handleCreateTicketSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Request Summary</label>
              <input
                type="text"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="e.g. Standard Developer Workstation Allocation - Q2 Cohort"
                required
                className="w-full h-8 px-2.5 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Requester Name</label>
                <input
                  type="text"
                  value={reqName}
                  onChange={(e) => setReqName(e.target.value)}
                  required
                  className="w-full h-8 px-2.5 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Requester Email</label>
                <input
                  type="email"
                  value={reqEmail}
                  onChange={(e) => setReqEmail(e.target.value)}
                  required
                  className="w-full h-8 px-2.5 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Department</label>
                <input
                  type="text"
                  value={reqDept}
                  onChange={(e) => setReqDept(e.target.value)}
                  required
                  className="w-full h-8 px-2.5 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Hardware Model</label>
                <select
                  value={hardwareType}
                  onChange={(e) => setHardwareType(e.target.value)}
                  className="w-full h-8 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
                >
                  <option value='MacBook Pro 16" (M3 Pro, 36GB, 1TB)'>MacBook Pro 16&quot; (M3 Pro, 36GB)</option>
                  <option value='MacBook Pro 14" (M3, 18GB, 512GB)'>MacBook Pro 14&quot; (M3, 18GB)</option>
                  <option value='Dell XPS 15 (Core i7, 32GB, 1TB)'>Dell XPS 15 (Core i7, 32GB)</option>
                  <option value='ThinkPad X1 Carbon (Core Ultra 7, 32GB)'>ThinkPad X1 Carbon (Ultra 7)</option>
                  <option value='Apple Studio Display 27" 5K'>Apple Studio Display 27&quot; 5K</option>
                  <option value='CalDigit TS4 Thunderbolt 4 Dock'>CalDigit TS4 Dock</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full h-8 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
                >
                  <option value="Lowest">Lowest</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Highest">Highest</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Operational Context</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Details on engineering team project or replacement justification..."
                className="w-full p-2 rounded ti-well text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <SkeuoButton size="sm" variant="subtle" type="button" onClick={() => setActiveView('details')}>
                Cancel
              </SkeuoButton>
              <SkeuoButton size="sm" variant="primary" type="submit">
                Submit Jira Ticket
              </SkeuoButton>
            </div>
          </form>
        </div>
      )}

      {/* Jira Sandbox Config Tab */}
      {activeView === 'settings' && (
        <div className="max-w-xl mx-auto ti-surface rounded-lg p-5 border border-[#D8D6CF] text-xs space-y-3.5">
          <h3 className="text-sm font-bold text-[#181A1B] pb-2 border-b border-[#D8D6CF]">
            Jira Service Management Demo Configuration
          </h3>
          <p className="text-[#686B6D]">
            SysAssist connects to Jira via REST v3 webhook proxies in this sandbox demonstration.
          </p>
          <div className="space-y-2">
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5">Instance Domain</label>
              <input
                type="text"
                value={jiraDomain}
                onChange={(e) => setJiraDomain(e.target.value)}
                className="w-full h-8 px-2.5 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-[#686B6D] mb-0.5">Project Key</label>
              <input
                type="text"
                value={jiraProjectKey}
                onChange={(e) => setJiraProjectKey(e.target.value)}
                className="w-full h-8 px-2.5 rounded ti-well font-mono text-xs text-[#181A1B] border border-[#C5C3BC]"
              />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <SkeuoButton size="sm" variant="primary" onClick={() => setActiveView('details')}>
              Save Sandbox Preferences
            </SkeuoButton>
          </div>
        </div>
      )}

      {/* FOCUSED FULFILLMENT DIALOG (Centered, max-w-md per rule: "only dialogs should be centered") */}
      {fulfillingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="w-full max-w-md ti-card rounded-lg p-4 border border-[#C5C3BC] shadow-2xl animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDDD6]">
              <div>
                <h4 className="font-bold text-sm text-[#181A1B]">
                  Fulfill Hardware Request
                </h4>
                <span className="font-mono text-[11px] text-[#C66A2B] font-semibold">
                  {fulfillingTicket.key} • {fulfillingTicket.requester.name}
                </span>
              </div>
              <button
                onClick={() => setFulfillingTicket(null)}
                className="w-6 h-6 rounded ti-btn flex items-center justify-center text-[#686B6D] hover:text-[#181A1B] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[#686B6D]">
              Select an in-stock asset from the depot to assign to <strong>{fulfillingTicket.requester.name}</strong> ({fulfillingTicket.requester.department}).
            </p>

            <form onSubmit={handleExecuteFulfillment} className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-bold">
                  Available Depot Hardware ({availableStockAssets.length})
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full h-9 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
                >
                  <option value="">-- Choose Stock Asset --</option>
                  {availableStockAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      [{asset.assetTag}] {asset.name} ({asset.specs.processor.split('(')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              {selectedAssetId && (
                <div className="p-2.5 rounded ti-well border border-[#C5C3BC] text-[11px] space-y-1">
                  <div className="text-[#181A1B] font-semibold">Ready for Provisioning:</div>
                  <div className="text-[#686B6D]">
                    Asset will transition to <strong className="text-[#1956A6]">In Use</strong> and custody recorded in immutable audit trail.
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFDDD6]">
                <SkeuoButton size="sm" variant="subtle" type="button" onClick={() => setFulfillingTicket(null)}>
                  Cancel
                </SkeuoButton>
                <SkeuoButton size="sm" variant="primary" type="submit" disabled={!selectedAssetId}>
                  Confirm & Fulfill Ticket
                </SkeuoButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
