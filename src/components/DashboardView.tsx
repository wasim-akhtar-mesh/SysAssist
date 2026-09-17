import React from 'react';
import { 
  Laptop, 
  Monitor, 
  Boxes, 
  Layers, 
  History, 
  Scan, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  UserCheck, 
  Clock, 
  Wrench, 
  Keyboard, 
  Mouse, 
  Headphones, 
  Radio, 
  ArrowUpRight,
  ShieldCheck,
  Cpu,
  FileCheck2,
  ShoppingCart,
  Truck,
  RotateCcw,
  ClockAlert
} from 'lucide-react';
import { Asset, AssetCategory, AssetStatus, ChangeLogEntry, InventoryThreshold, JiraTicket, ProcurementRequest, SimulatedUserRole } from '../types';
import { getDashboardMetrics, PERIPHERAL_CATEGORIES } from '../utils/inventorySelectors';
import { SkeuoButton, LedIndicator } from './SkeuoComponents';
import { ExportMenu, ExportOption } from './ExportMenu';
import { exportDashboardOperationalSummary, canRoleExport } from '../services/exportService';
import { SIMULATED_ROLES } from '../services/procurementService';

interface DashboardViewProps {
  assets: Asset[];
  jiraTickets: JiraTicket[];
  changeLogs: ChangeLogEntry[];
  thresholds: InventoryThreshold[];
  procurementRequests?: ProcurementRequest[];
  currentUserRole?: SimulatedUserRole;
  onNavigateToLaptops: (statusFilter?: AssetStatus | 'ALL') => void;
  onNavigateToPeripherals: (categoryFilter?: AssetCategory | 'ALL') => void;
  onNavigateToStock: () => void;
  onNavigateToJira: () => void;
  onNavigateToAudit: () => void;
  onNavigateToProcurement?: (view?: 'my_requests' | 'awaiting_approval' | 'purchasing_queue' | 'all_requests', statusFilter?: string) => void;
  onSelectAssetByTag: (assetTag: string) => void;
  onOpenScanner: () => void;
  onOpenAddAsset: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  assets,
  jiraTickets,
  changeLogs,
  thresholds,
  procurementRequests = [],
  currentUserRole,
  onNavigateToLaptops,
  onNavigateToPeripherals,
  onNavigateToStock,
  onNavigateToJira,
  onNavigateToAudit,
  onNavigateToProcurement,
  onSelectAssetByTag,
  onOpenScanner,
  onOpenAddAsset
}) => {
  const metrics = getDashboardMetrics(assets, jiraTickets, thresholds, changeLogs);

  // Compute Procurement Metrics
  const todayStr = new Date().toISOString().slice(0, 10);
  const activeRoleEmail = currentUserRole?.email?.toLowerCase() || '';
  const activeRoleName = currentUserRole?.name?.toLowerCase() || '';

  const myOpenRequestsCount = procurementRequests.filter(r => 
    (r.requester.email.toLowerCase() === activeRoleEmail || 
     r.requester.name.toLowerCase() === activeRoleName) &&
    r.status !== 'Closed' && r.status !== 'Rejected' && r.status !== 'Cancelled'
  ).length;

  const awaitingMyApprovalCount = procurementRequests.filter(r => {
    if (currentUserRole?.id === 'it_head' && r.status === 'IT Head Review') {
      return r.requester.email.toLowerCase() !== activeRoleEmail;
    }
    if (currentUserRole?.id === 'finance' && r.status === 'Finance Review') {
      return r.requester.email.toLowerCase() !== activeRoleEmail;
    }
    return false;
  }).length;

  const financeApprovedCount = procurementRequests.filter(r => r.status === 'Purchasing Queue').length;

  const orderedOrInTransitCount = procurementRequests.filter(r => 
    r.status === 'Ordered' || r.status === 'Shipped'
  ).length;

  const overdueDeliveriesCount = procurementRequests.filter(r => {
    if ((r.status === 'Ordered' || r.status === 'Shipped') && r.purchaseOrder?.expectedDeliveryDate) {
      return r.purchaseOrder.expectedDeliveryDate < todayStr;
    }
    return false;
  }).length;

  const changesRequestedCount = procurementRequests.filter(r => r.status === 'Changes Requested').length;

  const peripheralIcons: Record<AssetCategory, React.ReactNode> = {
    'Laptop': <Laptop className="w-3.5 h-3.5" />,
    'Display': <Monitor className="w-3.5 h-3.5 text-[#2C6E9B]" />,
    'Dock': <Boxes className="w-3.5 h-3.5 text-[#10B981]" />,
    'Keyboard': <Keyboard className="w-3.5 h-3.5 text-[#8C4F00]" />,
    'Mouse': <Mouse className="w-3.5 h-3.5 text-[#505457]" />,
    'Audio/Headset': <Headphones className="w-3.5 h-3.5 text-[#6D28D9]" />,
    'Other': <Radio className="w-3.5 h-3.5 text-[#505457]" />
  };

  return (
    <div className="space-y-4">
      {/* Top Operations Telemetry & Quick Action Bar */}
      <div className="ti-surface rounded-lg p-3.5 border border-[#D8D6CF] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#181A1B] tracking-tight">
                Operations & Fleet Overview
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EBF7EE] text-[#0F682C] border border-[#B7E5C3]">
                <LedIndicator color="green" size="sm" /> Live State
              </span>
            </div>
            <p className="text-[11px] text-[#686B6D] mt-0.5">
              Instrument-grade inventory tracking • {assets.length} total enrolled fleet assets
            </p>
          </div>
        </div>

        {/* Global Action Triggers */}
        <div className="flex items-center gap-2">
          <ExportMenu
            buttonSize="sm"
            variant="standard"
            label="Export"
            options={[
              {
                id: 'dashboard_summary',
                label: 'Executive Operational Summary',
                count: assets.length + procurementRequests.length + jiraTickets.length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'operational_summary').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'operational_summary').reason : undefined,
                onExport: () => exportDashboardOperationalSummary({
                  assets,
                  procurementRequests,
                  jiraTickets,
                  actor: currentUserRole || SIMULATED_ROLES.it_head
                })
              }
            ]}
          />

          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={onOpenScanner}
            icon={<Scan className="w-3.5 h-3.5 text-[#C66A2B]" />}
            aria-label="Open barcode scanner modal"
          >
            Scan Barcode
          </SkeuoButton>
          <SkeuoButton
            size="sm"
            variant="primary"
            onClick={onOpenAddAsset}
            icon={<Plus className="w-3.5 h-3.5" />}
            aria-label="Open hardware intake dialog"
          >
            Hardware Intake
          </SkeuoButton>
        </div>
      </div>

      {/* Operational Highlights Strip (Jira & Low-Stock Alerts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Open Jira Requests Panel */}
        <button 
          type="button"
          onClick={onNavigateToJira}
          className="w-full text-left ti-card rounded-lg p-3.5 cursor-pointer hover:border-[#2C6E9B] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C6E9B] transition-all group flex items-center justify-between"
          aria-label={`Open Jira Requests: ${metrics.openJiraCount} pending provisioning requests`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded ti-well flex items-center justify-center text-[#2C6E9B] border border-[#C5C3BC]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#686B6D]">
                Open Jira Requests
              </div>
              <div className="text-lg font-bold font-mono text-[#181A1B] flex items-baseline gap-2">
                <span>{metrics.openJiraCount}</span>
                <span className="text-xs font-sans font-normal text-[#686B6D]">pending provisioning</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-[#2C6E9B] group-hover:translate-x-0.5 transition-transform">
            <span>View Desk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>

        {/* Low-Stock Categories Panel */}
        <button 
          type="button"
          onClick={onNavigateToStock}
          className="w-full text-left ti-card rounded-lg p-3.5 cursor-pointer hover:border-[#D97706] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706] transition-all group flex items-center justify-between"
          aria-label={`View Buffer Quota Status: ${metrics.lowStockCount} categories below buffer threshold`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded ti-well flex items-center justify-center border border-[#C5C3BC] ${
              metrics.lowStockCount > 0 ? 'text-[#D97706]' : 'text-[#10B981]'
            }`}>
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#686B6D]">
                Buffer Quota Status
              </div>
              <div className="text-lg font-bold font-mono text-[#181A1B] flex items-baseline gap-2">
                <span className={metrics.lowStockCount > 0 ? 'text-[#8C4F00]' : 'text-[#0F682C]'}>
                  {metrics.lowStockCount}
                </span>
                <span className="text-xs font-sans font-normal text-[#686B6D]">
                  {metrics.lowStockCount > 0 ? 'categories below buffer threshold' : 'all categories nominal'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-medium text-[#D97706] group-hover:translate-x-0.5 transition-transform">
            <span>Procurement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* SECTION: Guarded Procurement Telemetry */}
      <div className="ti-surface rounded-lg p-4 border border-[#D8D6CF] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#D8D6CF]">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-[#C66A2B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
              Guarded Procurement Telemetry
            </h3>
            <span className="text-[11px] font-mono text-[#686B6D]">
              ({procurementRequests.length} total requests)
            </span>
          </div>
          {onNavigateToProcurement && (
            <button
              type="button"
              onClick={() => onNavigateToProcurement('all_requests')}
              className="text-xs font-medium text-[#C66A2B] hover:text-[#B55E22] flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] rounded px-1"
              aria-label="Open Procurement Console"
            >
              <span>Open Procurement Console</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 6 Compact Dashboard Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. My Open Requests */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('my_requests')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#C66A2B] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] transition-all group"
            aria-label={`View my ${myOpenRequestsCount} open procurement requests`}
          >
            <div className="text-[10px] uppercase font-bold text-[#686B6D] mb-1 flex items-center justify-between">
              <span>My Requests</span>
              <FileCheck2 className="w-3 h-3 text-[#505457]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#181A1B] group-hover:text-[#C66A2B] transition-colors">
              {myOpenRequestsCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Active submissions</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* 2. Awaiting My Approval */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('awaiting_approval')}
            className={`w-full text-left p-3 rounded-md ti-card cursor-pointer transition-all group ${
              awaitingMyApprovalCount > 0 
                ? 'hover:border-[#C66A2B] ring-1 ring-[#C66A2B]/30 bg-[#C66A2B]/5' 
                : 'hover:border-[#737577]'
            } focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B]`}
            aria-label={`View ${awaitingMyApprovalCount} requests awaiting my approval`}
          >
            <div className="text-[10px] uppercase font-bold text-[#C66A2B] mb-1 flex items-center justify-between">
              <span>Awaiting Approval</span>
              <Clock className="w-3 h-3 text-[#C66A2B]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#C66A2B]">
              {awaitingMyApprovalCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Awaiting review</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* 3. Finance-Approved (Awaiting Order) */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('purchasing_queue')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#1956A6] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1956A6] transition-all group"
            aria-label={`View ${financeApprovedCount} Finance-approved requests in purchasing queue`}
          >
            <div className="text-[10px] uppercase font-bold text-[#1956A6] mb-1 flex items-center justify-between">
              <span>Purchasing Queue</span>
              <ShoppingCart className="w-3 h-3 text-[#1956A6]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#1956A6]">
              {financeApprovedCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Approved for PO</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* 4. Ordered or In Transit */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('purchasing_queue', 'Ordered')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#0F682C] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F682C] transition-all group"
            aria-label={`View ${orderedOrInTransitCount} ordered or in-transit shipments`}
          >
            <div className="text-[10px] uppercase font-bold text-[#0F682C] mb-1 flex items-center justify-between">
              <span>In Transit</span>
              <Truck className="w-3 h-3 text-[#0F682C]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#0F682C]">
              {orderedOrInTransitCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Vendor dispatched</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* 5. Overdue Deliveries */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('purchasing_queue', 'Overdue')}
            className={`w-full text-left p-3 rounded-md ti-card cursor-pointer transition-all group ${
              overdueDeliveriesCount > 0 
                ? 'hover:border-[#B91C1C] ring-1 ring-[#B91C1C]/30 bg-[#FDF2F2]' 
                : 'hover:border-[#737577]'
            } focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#B91C1C]`}
            aria-label={`View ${overdueDeliveriesCount} overdue procurement deliveries`}
          >
            <div className="text-[10px] uppercase font-bold text-[#B91C1C] mb-1 flex items-center justify-between">
              <span>Overdue Delivery</span>
              <ClockAlert className="w-3 h-3 text-[#B91C1C]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#B91C1C]">
              {overdueDeliveriesCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Past expected ETA</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* 6. Requests Returned for Changes */}
          <button
            type="button"
            onClick={() => onNavigateToProcurement?.('my_requests', 'Changes Requested')}
            className={`w-full text-left p-3 rounded-md ti-card cursor-pointer transition-all group ${
              changesRequestedCount > 0 
                ? 'hover:border-[#D97706] ring-1 ring-[#D97706]/30 bg-[#FFFBEB]' 
                : 'hover:border-[#737577]'
            } focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#D97706]`}
            aria-label={`View ${changesRequestedCount} requests returned for changes`}
          >
            <div className="text-[10px] uppercase font-bold text-[#D97706] mb-1 flex items-center justify-between">
              <span>Changes Needed</span>
              <RotateCcw className="w-3 h-3 text-[#D97706]" />
            </div>
            <div className="text-xl font-mono font-bold text-[#D97706]">
              {changesRequestedCount}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Revisions requested</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 1: Laptop Fleet Instrument Deck */}
      <div className="ti-surface rounded-lg p-4 border border-[#D8D6CF] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#D8D6CF]">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-[#C66A2B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
              Laptop Fleet Distribution
            </h3>
            <span className="text-[11px] font-mono text-[#686B6D]">
              ({metrics.laptops.total} total units)
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToLaptops('ALL')}
            className="text-xs font-medium text-[#C66A2B] hover:text-[#B55E22] flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] rounded px-1"
            aria-label="Open complete Laptop catalog"
          >
            <span>Open Laptop Catalog</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Accessible Metric Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Laptops */}
          <button 
            type="button"
            onClick={() => onNavigateToLaptops('ALL')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#C66A2B] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] transition-all group"
            aria-label={`View all ${metrics.laptops.total} laptops`}
          >
            <div className="text-[10px] uppercase font-bold text-[#686B6D] mb-1">
              Total Laptops
            </div>
            <div className="text-xl font-mono font-bold text-[#181A1B] group-hover:text-[#C66A2B] transition-colors">
              {metrics.laptops.total}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>All laptops</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Available Laptops (In Stock) */}
          <button 
            type="button"
            onClick={() => onNavigateToLaptops('In Stock')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#0F682C] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0F682C] transition-all group"
            aria-label={`View ${metrics.laptops.available} available in-stock laptops`}
          >
            <div className="text-[10px] uppercase font-bold text-[#0F682C] mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Available
            </div>
            <div className="text-xl font-mono font-bold text-[#0F682C]">
              {metrics.laptops.available}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>In Depot Stock</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Assigned Laptops (In Use) */}
          <button 
            type="button"
            onClick={() => onNavigateToLaptops('In Use')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#1956A6] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1956A6] transition-all group"
            aria-label={`View ${metrics.laptops.assigned} assigned deployed laptops`}
          >
            <div className="text-[10px] uppercase font-bold text-[#1956A6] mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Assigned
            </div>
            <div className="text-xl font-mono font-bold text-[#1956A6]">
              {metrics.laptops.assigned}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Deployed to staff</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Maintenance Laptops */}
          <button 
            type="button"
            onClick={() => onNavigateToLaptops('Maintenance')}
            className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#8C4F00] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#8C4F00] transition-all group"
            aria-label={`View ${metrics.laptops.maintenance} laptops under maintenance or repair`}
          >
            <div className="text-[10px] uppercase font-bold text-[#8C4F00] mb-1 flex items-center gap-1">
              <Wrench className="w-3 h-3" /> Maintenance
            </div>
            <div className="text-xl font-mono font-bold text-[#8C4F00]">
              {metrics.laptops.maintenance}
            </div>
            <div className="text-[10px] text-[#686B6D] mt-1 flex items-center justify-between">
              <span>Bench test / repair</span>
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: Peripheral Fleet Instrument Deck */}
      <div className="ti-surface rounded-lg p-4 border border-[#D8D6CF] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#D8D6CF]">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#2C6E9B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
              Peripherals & Accessories
            </h3>
            <span className="text-[11px] font-mono font-semibold text-[#181A1B] px-1.5 py-0.2 rounded bg-[#E5E3DD] border border-[#C5C3BC]">
              {metrics.peripherals.total} total units
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateToPeripherals('ALL')}
            className="text-xs font-medium text-[#2C6E9B] hover:text-[#1956A6] flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C6E9B] rounded px-1"
            aria-label="Open Peripherals catalog with all categories"
          >
            <span>Open All Peripherals</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 6 Dedicated Accessible Peripheral Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {PERIPHERAL_CATEGORIES.map(cat => {
            const data = metrics.peripherals.byCategory[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onNavigateToPeripherals(cat)}
                className="w-full text-left p-3 rounded-md ti-card cursor-pointer hover:border-[#2C6E9B] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#2C6E9B] hover:shadow-xs transition-all group flex flex-col justify-between"
                aria-label={`Filter peripherals to ${data.label}: ${data.total} total units, ${data.inStock} depot in stock, ${data.inUse} deployed in use`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="p-1 rounded ti-well">
                      {peripheralIcons[cat]}
                    </div>
                    <ArrowRight className="w-3 h-3 text-[#686B6D] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="text-xs font-semibold text-[#181A1B] truncate">
                    {data.label}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-[#E8E6DF] w-full">
                  <div className="text-lg font-mono font-bold text-[#181A1B] group-hover:text-[#2C6E9B] transition-colors">
                    {data.total}
                  </div>
                  <div className="text-[10px] text-[#686B6D] flex items-center justify-between mt-0.5 font-mono">
                    <span className="text-[#0F682C]">{data.inStock} depot</span>
                    <span>{data.inUse} deployed</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Recent Five Audit Events */}
      <div className="ti-surface rounded-lg border border-[#D8D6CF] overflow-hidden">
        <div className="p-3 border-b border-[#D8D6CF] flex items-center justify-between bg-[#EAE8E2]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#C66A2B]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#181A1B]">
              Recent Audit Events (Last 5 Ledger Records)
            </h3>
          </div>
          <button
            type="button"
            onClick={onNavigateToAudit}
            className="text-xs font-medium text-[#C66A2B] hover:text-[#B55E22] flex items-center gap-1 cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] rounded px-1"
            aria-label={`View complete operational audit trail with ${changeLogs.length} events`}
          >
            <span>View Complete Log ({changeLogs.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D8D6CF] bg-[#FAF9F5] text-[#686B6D] font-medium text-[11px]">
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Asset Tag</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Property / Parameter</th>
                <th className="py-2.5 px-3">Transition Ledger</th>
                <th className="py-2.5 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E2] text-[#181A1B]">
              {metrics.recentAuditEvents.map(event => (
                <tr 
                  key={event.id}
                  onClick={() => onSelectAssetByTag(event.assetTag)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectAssetByTag(event.assetTag);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Audit event: ${event.action} on asset ${event.assetTag}, ${event.property} transitioned from ${event.oldValue} to ${event.newValue}`}
                  className="hover:bg-[#FAF9F5] focus-visible:bg-[#FAF9F5] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#C66A2B] transition-colors cursor-pointer"
                >
                  <td className="py-2 px-3 font-mono text-[11px] text-[#686B6D] whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                    {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </td>
                  <td className="py-2 px-3 font-mono font-bold text-xs whitespace-nowrap">
                    <span className="px-1.5 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC] group-hover:border-[#C66A2B] transition-colors">
                      {event.assetTag}
                    </span>
                  </td>
                  <td className="py-2 px-3 whitespace-nowrap">
                    <span className="px-1.5 py-0.2 rounded font-mono text-[10px] font-semibold bg-[#EAE8E2] text-[#505457]">
                      {event.action}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-[#505457] font-medium whitespace-nowrap">
                    {event.property}
                  </td>
                  <td className="py-2 px-3 text-[11px] max-w-[260px] truncate text-[#686B6D]">
                    <span className="text-[#8A8C8E] line-through">{event.oldValue}</span>
                    <span className="mx-1 text-[#C66A2B]">→</span>
                    <span className="font-medium text-[#181A1B]">{event.newValue}</span>
                  </td>
                  <td className="py-2 px-3 text-xs text-[#505457] whitespace-nowrap">
                    {event.performedBy.split('(')[0].trim()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
