import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle,
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
  X,
  Boxes,
  Monitor,
  Keyboard,
  Mouse,
  Headphones,
  Radio,
  Lock
} from 'lucide-react';
import { JiraTicket, Asset, ChangeLogEntry, AssetCategory, SimulatedUserRole } from '../types';
import { SkeuoButton, LedIndicator, StatusBadge } from './SkeuoComponents';
import { generateUniqueJiraKey, generateUniqueLogId } from '../utils/idGenerator';
import { getCategorySpecsSummary } from '../utils/categorySpecs';
import { ExportMenu } from './ExportMenu';
import { exportJiraTickets, canRoleExport } from '../services/exportService';
import { SIMULATED_ROLES } from '../services/procurementService';

interface JiraTicketingViewProps {
  tickets: JiraTicket[];
  assets: Asset[];
  currentUserRole?: SimulatedUserRole;
  onFulfillTicket: (ticketKey: string, assetId: string, log: ChangeLogEntry) => void;
  onCreateTicket: (ticket: JiraTicket) => void;
  currentUser: string;
  onSelectAssetByTag?: (assetTag: string) => void;
}

export const inferCategoryFromHardware = (name?: string): AssetCategory => {
  if (!name) return 'Laptop';
  const lower = name.toLowerCase();
  if (lower.includes('display') || lower.includes('monitor') || lower.includes('screen')) return 'Display';
  if (lower.includes('dock') || lower.includes('hub')) return 'Dock';
  if (lower.includes('keyboard')) return 'Keyboard';
  if (lower.includes('mouse') || lower.includes('trackpad')) return 'Mouse';
  if (lower.includes('headset') || lower.includes('audio') || lower.includes('headphones') || lower.includes('airpods')) return 'Audio/Headset';
  if (lower.includes('macbook') || lower.includes('laptop') || lower.includes('thinkpad') || lower.includes('xps') || lower.includes('notebook')) return 'Laptop';
  return 'Other';
};

export const JiraTicketingDrawer: React.FC<JiraTicketingViewProps> = ({
  tickets,
  assets,
  currentUserRole,
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
  const [overrideCompatibility, setOverrideCompatibility] = useState<boolean>(false);

  // New ticket form state
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [reqName, setReqName] = useState('Wasim Akhtar');
  const [reqEmail, setReqEmail] = useState('wasim.akhtar@company.internal');
  const [reqDept, setReqDept] = useState('Hardware Operations');
  const [reqCategory, setReqCategory] = useState<AssetCategory>('Laptop');
  const [hardwareType, setHardwareType] = useState('MacBook Pro 16" (M3 Pro, 36GB, 1TB)');
  const [priority, setPriority] = useState<'Lowest' | 'Low' | 'Medium' | 'High' | 'Highest'>('High');

  // Sandbox config settings
  const [jiraDomain, setJiraDomain] = useState('enterprise-systemassist.atlassian.net');
  const [jiraProjectKey, setJiraProjectKey] = useState('SYS');

  const filteredTickets = tickets.filter(ticket => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      ticket.key.toLowerCase().includes(q) ||
      ticket.summary.toLowerCase().includes(q) ||
      ticket.requester.name.toLowerCase().includes(q) ||
      ticket.requester.department.toLowerCase().includes(q) ||
      (ticket.requestedCategory && ticket.requestedCategory.toLowerCase().includes(q))
    );
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'open' && ticket.status.toLowerCase() === 'open') ||
      (filterStatus === 'fulfilled' && ticket.status.toLowerCase() === 'fulfilled') ||
      (filterStatus === 'in progress' && ticket.status.toLowerCase() === 'in progress') ||
      (filterStatus === 'closed' && ticket.status.toLowerCase() === 'closed');
    return matchesSearch && matchesStatus;
  });

  const selectedTicket = tickets.find(t => t.key === selectedTicketKey) || filteredTickets[0] || tickets[0];
  const availableStockAssets = assets.filter(a => a.status === 'In Stock');

  const handleHardwareTemplateChange = (val: string) => {
    setHardwareType(val);
    const cat = inferCategoryFromHardware(val);
    setReqCategory(cat);
  };

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;

    const newKey = generateUniqueJiraKey(tickets);

    const newTicket: JiraTicket = {
      id: `jira-${Date.now()}`,
      key: newKey,
      summary: summary.trim(),
      description: description.trim() || `Automated request for ${hardwareType} initiated via System Assist Workstation.`,
      status: 'Open',
      priority,
      createdDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      issueType: 'Hardware Request',
      requester: {
        name: reqName.trim(),
        email: reqEmail.trim(),
        department: reqDept.trim()
      },
      requestedHardware: hardwareType,
      requestedCategory: reqCategory
    };

    onCreateTicket(newTicket);
    setSelectedTicketKey(newKey);
    setActiveView('details');
    setSummary('');
    setDescription('');
  };

  const openFulfillmentModal = (ticket: JiraTicket) => {
    if (ticket.status === 'Fulfilled' || ticket.status === 'Closed') {
      return;
    }
    setFulfillingTicket(ticket);
    setSelectedAssetId('');
    setOverrideCompatibility(false);
  };

  // Determine requested category for fulfillment
  const activeRequestedCategory = fulfillingTicket
    ? (fulfillingTicket.requestedCategory || inferCategoryFromHardware(fulfillingTicket.requestedHardware))
    : 'Laptop';

  const compatibleStockAssets = availableStockAssets.filter(a => a.category === activeRequestedCategory);
  const otherStockAssets = availableStockAssets.filter(a => a.category !== activeRequestedCategory);

  const selectedTargetAsset = assets.find(a => a.id === selectedAssetId);
  const isSelectedAssetCompatible = selectedTargetAsset ? selectedTargetAsset.category === activeRequestedCategory : false;

  const handleExecuteFulfillment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillingTicket || !selectedAssetId) return;
    if (fulfillingTicket.status === 'Fulfilled' || fulfillingTicket.status === 'Closed') return;

    const targetAsset = assets.find(a => a.id === selectedAssetId);
    if (!targetAsset) return;

    // Strict compatibility check
    const isCompat = targetAsset.category === activeRequestedCategory;
    if (!isCompat && !overrideCompatibility) {
      return;
    }

    const oldAssigneeLabel = targetAsset.assignedTo 
      ? `${targetAsset.assignedTo.name} (${targetAsset.assignedTo.department})` 
      : 'IT Depot Pool (Unassigned)';

    const newAssigneeLabel = `${fulfillingTicket.requester.name} (${fulfillingTicket.requester.department})`;

    const overrideNotice = !isCompat ? ` [COMPATIBILITY OVERRIDE: Requested ${activeRequestedCategory}, Assigned ${targetAsset.category}]` : '';

    const newLog: ChangeLogEntry = {
      id: generateUniqueLogId(),
      assetId: targetAsset.id,
      assetTag: targetAsset.assetTag,
      assetName: targetAsset.name,
      timestamp: new Date().toISOString(),
      performedBy: currentUser,
      action: 'REASSIGN',
      property: 'Assigned To (Jira Fulfill)',
      oldValue: oldAssigneeLabel,
      newValue: newAssigneeLabel,
      reason: `Fulfilling Jira Request ${fulfillingTicket.key}: ${fulfillingTicket.summary}${overrideNotice}`,
      jiraTicketKey: fulfillingTicket.key
    };

    onFulfillTicket(fulfillingTicket.key, targetAsset.id, newLog);
    setFulfillingTicket(null);
    setSelectedAssetId('');
    setOverrideCompatibility(false);
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
            Requests ({tickets.filter(t => t.status !== 'Fulfilled' && t.status !== 'Closed').length} Pending)
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

          <ExportMenu
            buttonSize="sm"
            variant="standard"
            label="Export"
            options={[
              {
                id: 'filtered_jira',
                label: `Filtered Tickets (${filteredTickets.length})`,
                count: filteredTickets.length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'jira').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'jira').reason : undefined,
                onExport: () => exportJiraTickets(
                  filteredTickets,
                  `Filtered Jira Tickets (Status: ${filterStatus}, Query: "${searchQuery || 'none'}")`,
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              },
              {
                id: 'all_jira',
                label: `All Jira Tickets (${tickets.length})`,
                count: tickets.length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'jira').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'jira').reason : undefined,
                onExport: () => exportJiraTickets(
                  tickets,
                  'All Enterprise Jira Service Management Tickets',
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              },
              {
                id: 'pending_jira',
                label: `Pending / Open Requests (${tickets.filter(t => t.status !== 'Fulfilled' && t.status !== 'Closed').length})`,
                count: tickets.filter(t => t.status !== 'Fulfilled' && t.status !== 'Closed').length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'jira').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'jira').reason : undefined,
                onExport: () => exportJiraTickets(
                  tickets.filter(t => t.status !== 'Fulfilled' && t.status !== 'Closed'),
                  'Pending Unfulfilled Jira Hardware Requests',
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              }
            ]}
          />
        </div>
      </div>

      {/* Primary Workspace: Master-Detail Layout */}
      {activeView === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          
          {/* Left Column: Requests List */}
          <div className="lg:col-span-5 xl:col-span-4 ti-surface rounded-lg p-3 space-y-2.5">
            {/* Search and Filters */}
            <div className="space-y-2 pb-2 border-b border-[#D8D6CF]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter key (SYS-1082), requester, category..."
                  className="w-full h-8 pl-8 pr-2.5 ti-well rounded text-xs text-[#181A1B] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
                  aria-label="Filter Jira tickets"
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
                  aria-label="Filter tickets by status"
                >
                  <option value="all">All ({tickets.length})</option>
                  <option value="open">Open ({tickets.filter(t => t.status === 'Open').length})</option>
                  <option value="in progress">In Progress ({tickets.filter(t => t.status === 'In Progress').length})</option>
                  <option value="fulfilled">Fulfilled ({tickets.filter(t => t.status === 'Fulfilled').length})</option>
                  <option value="closed">Closed ({tickets.filter(t => t.status === 'Closed').length})</option>
                </select>
              </div>
            </div>

            {/* List of Tickets */}
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredTickets.map(ticket => {
                const isSelected = selectedTicket?.key === ticket.key;
                const isFulfilled = ticket.status === 'Fulfilled';
                const isClosed = ticket.status === 'Closed';
                const cat = ticket.requestedCategory || inferCategoryFromHardware(ticket.requestedHardware);

                return (
                  <button
                    key={ticket.key}
                    type="button"
                    onClick={() => setSelectedTicketKey(ticket.key)}
                    className={`w-full text-left p-2.5 rounded-md cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-[#FAF9F5] border-[#C66A2B] shadow-xs ring-1 ring-[#C66A2B]/20'
                        : 'ti-card hover:border-[#C5C3BC]'
                    }`}
                    aria-label={`Ticket ${ticket.key}: ${ticket.summary}, priority ${ticket.priority}, status ${ticket.status}`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-[#181A1B]">
                          {ticket.key}
                        </span>
                        <span className="px-1.5 py-0.2 rounded font-mono text-[9px] uppercase font-bold bg-[#EAE8E2] text-[#505457] border border-[#CFCDBF]">
                          {cat}
                        </span>
                      </div>
                      <StatusBadge status={ticket.priority} type="priority" />
                    </div>

                    <div className="text-xs font-medium text-[#181A1B] line-clamp-1 mb-1">
                      {ticket.summary}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#686B6D]">
                      <span className="truncate max-w-[150px]">{ticket.requester.name}</span>
                      <span className={`px-1.5 py-0.2 rounded font-medium ${
                        isFulfilled ? 'bg-[#EBF7EE] text-[#0F682C]' : isClosed ? 'bg-[#E5E3DC] text-[#505457]' : 'bg-[#FFF8E6] text-[#8C4F00]'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Contextual Request Details */}
          <div className="lg:col-span-7 xl:col-span-8 ti-surface rounded-lg p-4 space-y-4">
            {selectedTicket ? (
              <>
                {/* Header info */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#D8D6CF]">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC]">
                        {selectedTicket.key}
                      </span>
                      <StatusBadge status={selectedTicket.status} />
                      <StatusBadge status={selectedTicket.priority} type="priority" />
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#E8E6DF] text-[#181A1B] border border-[#C5C3BC]">
                        Target Category: {selectedTicket.requestedCategory || inferCategoryFromHardware(selectedTicket.requestedHardware)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#181A1B]">
                      {selectedTicket.summary}
                    </h3>
                    <div className="text-xs text-[#686B6D] mt-0.5">
                      Submitted on {selectedTicket.createdDate || selectedTicket.createdAt?.slice(0, 10)} via Jira Service Desk
                    </div>
                  </div>

                  {selectedTicket.status !== 'Fulfilled' && selectedTicket.status !== 'Closed' ? (
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => openFulfillmentModal(selectedTicket)}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                      aria-label={`Fulfill hardware for ticket ${selectedTicket.key}`}
                    >
                      Fulfill Hardware
                    </SkeuoButton>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-xs font-semibold text-[#0F682C]">
                      {selectedTicket.status === 'Fulfilled' ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Fulfilled</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-[#505457]" />
                          <span className="text-[#505457]">Closed</span>
                        </>
                      )}
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
                    <div className="text-[#686B6D] pt-1 border-t border-[#DFDDD6] flex items-center justify-between">
                      <span>Category: <strong className="text-[#181A1B]">{selectedTicket.requestedCategory || inferCategoryFromHardware(selectedTicket.requestedHardware)}</strong></span>
                      <span>Priority: <strong className="text-[#181A1B]">{selectedTicket.priority}</strong></span>
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
                        aria-label={`View fulfilled asset ${selectedTicket.fulfilledAssetTag}`}
                      >
                        View Asset
                      </SkeuoButton>
                    )}
                  </div>
                ) : selectedTicket.status === 'Closed' ? (
                  <div className="p-3 rounded-md bg-[#FAF9F5] border border-[#D8D6CF] text-xs text-[#505457] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-[#7A7D80]" />
                    <span>This ticket is marked Closed. Additional hardware fulfillment cannot be performed.</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-md ti-well border border-[#D8D6CF] text-xs flex items-center justify-between">
                    <div className="text-[#686B6D]">
                      Hardware currently unassigned. <strong className="text-[#181A1B]">{availableStockAssets.length}</strong> items in depot stock (<strong className="text-[#0F682C]">{compatibleStockAssets.length} compatible</strong>).
                    </div>
                    <SkeuoButton
                      size="sm"
                      variant="primary"
                      onClick={() => openFulfillmentModal(selectedTicket)}
                      aria-label="Assign hardware from depot"
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
                <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Requested Category</label>
                <select
                  value={reqCategory}
                  onChange={(e) => setReqCategory(e.target.value as AssetCategory)}
                  className="w-full h-8 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
                >
                  <option value="Laptop">Laptop</option>
                  <option value="Display">Display</option>
                  <option value="Dock">Dock</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Mouse">Mouse</option>
                  <option value="Audio/Headset">Audio/Headset</option>
                  <option value="Other">Other</option>
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
              <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-medium">Hardware Model Template</label>
              <select
                value={hardwareType}
                onChange={(e) => handleHardwareTemplateChange(e.target.value)}
                className="w-full h-8 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B]"
              >
                <option value='MacBook Pro 16" (M3 Pro, 36GB, 1TB)'>MacBook Pro 16&quot; (Laptop)</option>
                <option value='MacBook Pro 14" (M3, 18GB, 512GB)'>MacBook Pro 14&quot; (Laptop)</option>
                <option value='Dell XPS 15 (Core i7, 32GB, 1TB)'>Dell XPS 15 (Laptop)</option>
                <option value='ThinkPad X1 Carbon (Core Ultra 7, 32GB)'>ThinkPad X1 Carbon (Laptop)</option>
                <option value='Apple Studio Display 27" 5K'>Apple Studio Display 27&quot; (Display)</option>
                <option value='CalDigit TS4 Thunderbolt 4 Dock'>CalDigit TS4 Dock (Dock)</option>
                <option value='Magic Keyboard with Touch ID'>Magic Keyboard (Keyboard)</option>
                <option value='Logitech MX Master 3S'>Logitech MX Master 3S (Mouse)</option>
                <option value='Poly Voyager Focus 2'>Poly Voyager Focus 2 (Audio/Headset)</option>
              </select>
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
            System Assist connects to Jira via REST v3 webhook proxies in this sandbox demonstration.
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

      {/* EQUIPMENT-AWARE FOCUSED FULFILLMENT DIALOG */}
      {fulfillingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40 backdrop-blur-xs" role="dialog" aria-modal="true">
          <div className="w-full max-w-md ti-card rounded-lg p-4 border border-[#C5C3BC] shadow-2xl animate-fade-in text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#DFDDD6]">
              <div>
                <h4 className="font-bold text-sm text-[#181A1B]">
                  Fulfill Hardware Request
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="font-mono text-[11px] text-[#C66A2B] font-semibold">
                    {fulfillingTicket.key}
                  </span>
                  <span className="text-[11px] text-[#686B6D]">•</span>
                  <span className="px-1.5 py-0.2 rounded font-semibold text-[10px] bg-[#E8E6DF] text-[#181A1B] border border-[#C5C3BC]">
                    Target: {activeRequestedCategory}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFulfillingTicket(null)}
                className="w-6 h-6 rounded ti-btn flex items-center justify-center text-[#686B6D] hover:text-[#181A1B] cursor-pointer"
                aria-label="Close fulfillment dialog"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-[#686B6D]">
              Select an in-stock asset from the depot to assign to <strong>{fulfillingTicket.requester.name}</strong> ({fulfillingTicket.requester.department}).
            </p>

            {availableStockAssets.length === 0 ? (
              <div className="p-3 rounded-md bg-[#FFF8E6] border border-[#E6C678] text-xs text-[#8C4F00] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Depot Hardware Unavailable</span>
                </div>
                <p className="text-[11px] text-[#784200]">
                  There are currently no assets in depot stock. Intake new equipment or order replenishment via the Buffer Quota panel before fulfilling this request.
                </p>
              </div>
            ) : (
              <form onSubmit={handleExecuteFulfillment} className="space-y-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#686B6D] mb-1 font-bold">
                    Depot Inventory ({availableStockAssets.length} total, {compatibleStockAssets.length} compatible)
                  </label>
                  <select
                    value={selectedAssetId}
                    onChange={(e) => {
                      setSelectedAssetId(e.target.value);
                      setOverrideCompatibility(false);
                    }}
                    required
                    className="w-full h-9 px-2 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
                    aria-label="Select depot asset for fulfillment"
                  >
                    <option value="">-- Choose Stock Asset --</option>
                    {compatibleStockAssets.length > 0 && (
                      <optgroup label={`Compatible ${activeRequestedCategory} Assets (${compatibleStockAssets.length})`}>
                        {compatibleStockAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            ✓ [{asset.assetTag}] {asset.name} ({getCategorySpecsSummary(asset)})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {otherStockAssets.length > 0 && (
                      <optgroup label={`Other Hardware Categories (${otherStockAssets.length}) - Requires Override`}>
                        {otherStockAssets.map(asset => (
                          <option key={asset.id} value={asset.id}>
                            ⚠ [{asset.assetTag}] ({asset.category}) {asset.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>

                {/* Compatibility Validation Notice */}
                {selectedTargetAsset && (
                  <>
                    {isSelectedAssetCompatible ? (
                      <div className="p-2.5 rounded bg-[#EBF7EE] border border-[#B7E5C3] text-[11px] space-y-0.5">
                        <div className="text-[#0F682C] font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Category Matched: {selectedTargetAsset.category}</span>
                        </div>
                        <div className="text-[#505457]">
                          Asset <strong>{selectedTargetAsset.assetTag}</strong> satisfies the ticket requirement. Custody will transfer immediately.
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded bg-[#FFF8E6] border border-[#E6C678] text-[11px] space-y-2">
                        <div className="text-[#8C4F00] font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>Hardware Category Mismatch</span>
                        </div>
                        <p className="text-[#784200]">
                          This ticket requested <strong>{activeRequestedCategory}</strong>, but the chosen asset is a <strong>{selectedTargetAsset.category}</strong>. Incompatible fulfillment is blocked unless explicitly confirmed.
                        </p>
                        <label className="flex items-center gap-2 pt-1 border-t border-[#E6C678] cursor-pointer text-[#181A1B] font-medium">
                          <input
                            type="checkbox"
                            checked={overrideCompatibility}
                            onChange={(e) => setOverrideCompatibility(e.target.checked)}
                            className="w-4 h-4 rounded text-[#C66A2B] focus:ring-[#C66A2B]"
                          />
                          <span>Confirm equipment compatibility override</span>
                        </label>
                      </div>
                    )}
                  </>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#DFDDD6]">
                  <SkeuoButton size="sm" variant="subtle" type="button" onClick={() => setFulfillingTicket(null)}>
                    Cancel
                  </SkeuoButton>
                  <SkeuoButton 
                    size="sm" 
                    variant="primary" 
                    type="submit" 
                    disabled={!selectedAssetId || (!isSelectedAssetCompatible && !overrideCompatibility)}
                  >
                    Confirm & Fulfill Ticket
                  </SkeuoButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
