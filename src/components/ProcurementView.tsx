import React, { useState, useMemo } from 'react';
import { 
  FileCheck2, 
  Clock, 
  ShoppingCart, 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  ClockAlert, 
  Truck, 
  Package, 
  User, 
  DollarSign,
  ChevronRight,
  Boxes
} from 'lucide-react';
import { 
  ProcurementRequest, 
  ProcurementViewType, 
  ProcurementStatus, 
  AssetCategory, 
  SimulatedUserRole,
  Asset,
  PurchaseOrderInfo,
  DeliveryReceipt
} from '../types';
import { SkeuoButton, LedIndicator } from './SkeuoComponents';
import { filterProcurementRequests } from '../services/procurementService';
import { ProcurementRequestModal } from './ProcurementRequestModal';
import { ProcurementInspectorDrawer } from './ProcurementInspectorDrawer';
import { ProcurementReasonModal } from './ProcurementReasonModal';
import { ExistingStockModal } from './ExistingStockModal';
import { CreatePOModal } from './CreatePOModal';
import { ReceiveDeliveryModal } from './ReceiveDeliveryModal';
import { RegisterAssetsModal } from './RegisterAssetsModal';

interface ProcurementViewProps {
  requests: ProcurementRequest[];
  assets: Asset[];
  currentUserRole: SimulatedUserRole;
  initialView?: ProcurementViewType;
  initialStatusFilter?: string;
  onSaveDraft: (request: ProcurementRequest) => void;
  onSubmitRequest: (request: ProcurementRequest) => void;
  onUpdateRequest: (request: ProcurementRequest, updatedAsset?: Asset) => void;
  onRegisterFleetAssets: (request: ProcurementRequest, createdAssets: Asset[]) => void;
}

export const ProcurementView: React.FC<ProcurementViewProps> = ({
  requests,
  assets,
  currentUserRole,
  initialView = 'all_requests',
  initialStatusFilter = 'ALL',
  onSaveDraft,
  onSubmitRequest,
  onUpdateRequest,
  onRegisterFleetAssets
}) => {
  const [activeTab, setActiveTab] = useState<ProcurementViewType>(initialView);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Inspector & Modals State
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<ProcurementRequest | null>(null);

  // Reason Modal
  const [reasonModalConfig, setReasonModalConfig] = useState<{
    isOpen: boolean;
    type: 'reject' | 'changes_requested';
    targetRequest: ProcurementRequest | null;
  }>({
    isOpen: false,
    type: 'reject',
    targetRequest: null
  });

  // Stock fulfillment modal
  const [stockModalRequest, setStockModalRequest] = useState<ProcurementRequest | null>(null);

  // PO creation modal
  const [poModalRequest, setPoModalRequest] = useState<ProcurementRequest | null>(null);

  // Delivery receipt modal
  const [deliveryModalRequest, setDeliveryModalRequest] = useState<ProcurementRequest | null>(null);

  // Register assets modal
  const [registerModalRequest, setRegisterModalRequest] = useState<ProcurementRequest | null>(null);

  // Filter requests based on current tab
  const tabFilteredRequests = useMemo(() => {
    return filterProcurementRequests(requests, activeTab, currentUserRole);
  }, [requests, activeTab, currentUserRole]);

  // Secondary search and attribute filtering
  const displayedRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tabFilteredRequests.filter(req => {
      // Category filter
      if (categoryFilter !== 'ALL' && req.category !== categoryFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'Overdue') {
        const today = new Date().toISOString().slice(0, 10);
        if (req.status !== 'Ordered' && req.status !== 'Shipped') return false;
        return Boolean(req.purchaseOrder?.expectedDeliveryDate && req.purchaseOrder.expectedDeliveryDate < today);
      } else if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }
      // Text search
      if (q) {
        const matchesNumber = req.requestNumber.toLowerCase().includes(q);
        const matchesRequester = req.requester.name.toLowerCase().includes(q) || req.requester.email.toLowerCase().includes(q);
        const matchesModel = req.preferredModel.toLowerCase().includes(q);
        const matchesDept = req.department.toLowerCase().includes(q);
        const matchesPO = req.purchaseOrder?.poNumber.toLowerCase().includes(q);
        return matchesNumber || matchesRequester || matchesModel || matchesDept || Boolean(matchesPO);
      }
      return true;
    });
  }, [tabFilteredRequests, searchQuery, statusFilter, categoryFilter]);

  const selectedRequest = requests.find(r => r.id === selectedRequestId) || null;

  // Tab Badge Counts
  const myRequestsCount = filterProcurementRequests(requests, 'my_requests', currentUserRole).length;
  const awaitingApprovalCount = filterProcurementRequests(requests, 'awaiting_approval', currentUserRole).length;
  const purchasingQueueCount = filterProcurementRequests(requests, 'purchasing_queue', currentUserRole).length;
  const allRequestsCount = requests.length;

  const getStatusBadgeColor = (status: ProcurementStatus) => {
    switch (status) {
      case 'Draft': return 'bg-[#E5E3DD] text-[#505457] border-[#C5C3BC]';
      case 'IT Head Review': return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      case 'Finance Review': return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]';
      case 'Purchasing Queue': return 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]';
      case 'Ordered': return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
      case 'Shipped': return 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]';
      case 'Partially Received': return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
      case 'Received': return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
      case 'Asset Registration': return 'bg-[#EBF7EE] text-[#0F682C] border-[#B7E5C3]';
      case 'Assigned/Fulfilled': return 'bg-[#EBF7EE] text-[#0F682C] border-[#B7E5C3]';
      case 'Changes Requested': return 'bg-[#FFF7ED] text-[#C2410C] border-[#FFEDD5]';
      case 'Rejected': return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
      case 'Cancelled': return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
      case 'Closed': return 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB]';
      default: return 'bg-[#E5E3DD] text-[#505457] border-[#C5C3BC]';
    }
  };

  // Helper action triggers
  const handleApproveIT = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'Finance Review',
      updatedAt: now,
      approvals: [
        ...req.approvals,
        {
          id: `appr-${Date.now()}`,
          level: 'IT Head',
          approverName: currentUserRole.name,
          approverEmail: currentUserRole.email,
          timestamp: now,
          decision: 'Approved'
        }
      ],
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: 'IT Head Approved',
          previousState: 'IT Head Review',
          newState: 'Finance Review',
          notes: 'IT specification and technical compatibility verified.'
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleApproveFinance = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'Purchasing Queue',
      financeApprovedAmount: req.estimatedTotalCost,
      updatedAt: now,
      approvals: [
        ...req.approvals,
        {
          id: `appr-${Date.now()}`,
          level: 'Finance',
          approverName: currentUserRole.name,
          approverEmail: currentUserRole.email,
          timestamp: now,
          decision: 'Approved'
        }
      ],
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: 'Finance Approved',
          previousState: 'Finance Review',
          newState: 'Purchasing Queue',
          notes: `Budget authorized: ${req.currency} ${req.estimatedTotalCost.toFixed(2)}.`
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleReasonSubmit = (reason: string) => {
    const req = reasonModalConfig.targetRequest;
    if (!req) return;
    const now = new Date().toISOString();
    const isReject = reasonModalConfig.type === 'reject';
    const nextStatus: ProcurementStatus = isReject ? 'Rejected' : 'Changes Requested';

    const updated: ProcurementRequest = {
      ...req,
      status: nextStatus,
      updatedAt: now,
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: isReject ? 'Request Rejected' : 'Changes Requested',
          previousState: req.status,
          newState: nextStatus,
          notes: reason
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleStockFulfillmentConfirm = (assetId: string, overrideMismatch: boolean, overrideReason?: string) => {
    if (!stockModalRequest) return;
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    const now = new Date().toISOString();
    const updatedAsset: Asset = {
      ...asset,
      status: 'In Use',
      assignedTo: stockModalRequest.requester.name,
      assignedEmail: stockModalRequest.requester.email,
      assignedDepartment: stockModalRequest.department,
      procurementRequestId: stockModalRequest.id
    };

    const notesMsg = overrideMismatch
      ? `Fulfilled from depot stock (${asset.assetTag} - ${asset.model}). Category override justified: ${overrideReason}`
      : `Fulfilled immediately from depot stock (${asset.assetTag} - ${asset.model}). Bypassed purchasing.`;

    const updatedRequest: ProcurementRequest = {
      ...stockModalRequest,
      status: 'Assigned/Fulfilled',
      updatedAt: now,
      fulfilledAssetTags: [...stockModalRequest.fulfilledAssetTags, asset.assetTag],
      auditLogs: [
        ...stockModalRequest.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: stockModalRequest.requestNumber,
          action: 'Fulfilled From Stock',
          previousState: stockModalRequest.status,
          newState: 'Assigned/Fulfilled',
          notes: notesMsg
        }
      ]
    };

    onUpdateRequest(updatedRequest, updatedAsset);
  };

  const handlePOSubmit = (po: PurchaseOrderInfo) => {
    if (!poModalRequest) return;
    const now = new Date().toISOString();

    // Check if cost exceeded Finance approved budget
    const approvedBudget = poModalRequest.financeApprovedAmount ?? poModalRequest.estimatedTotalCost;
    const isExceeded = po.finalTotalCost > approvedBudget;

    if (isExceeded) {
      // Cost increase guard: return to Finance Review
      const exceedDiff = (po.finalTotalCost - approvedBudget).toFixed(2);
      const updated: ProcurementRequest = {
        ...poModalRequest,
        status: 'Finance Review',
        purchaseOrder: po,
        updatedAt: now,
        auditLogs: [
          ...poModalRequest.auditLogs,
          {
            id: `audit-${Date.now()}`,
            timestamp: now,
            actor: currentUserRole.name,
            role: currentUserRole.badge,
            requestNumber: poModalRequest.requestNumber,
            action: 'Budget Exceeded - Returned to Finance',
            previousState: 'Purchasing Queue',
            newState: 'Finance Review',
            notes: `PO ${po.poNumber} total (${po.currency} ${po.finalTotalCost.toFixed(2)}) exceeded authorized budget of ${poModalRequest.currency} ${approvedBudget.toFixed(2)} by +${exceedDiff}. Returned for Finance re-approval.`
          }
        ]
      };
      onUpdateRequest(updated);
    } else {
      // Normal transition to Ordered
      const updated: ProcurementRequest = {
        ...poModalRequest,
        status: 'Ordered',
        purchaseOrder: po,
        updatedAt: now,
        auditLogs: [
          ...poModalRequest.auditLogs,
          {
            id: `audit-${Date.now()}`,
            timestamp: now,
            actor: currentUserRole.name,
            role: currentUserRole.badge,
            requestNumber: poModalRequest.requestNumber,
            action: 'Purchase Order Issued',
            previousState: 'Purchasing Queue',
            newState: 'Ordered',
            notes: `PO ${po.poNumber} issued to ${po.vendor} for ${po.quantity} unit(s). ETA: ${po.expectedDeliveryDate}.`
          }
        ]
      };
      onUpdateRequest(updated);
    }
  };

  const handleMarkShipped = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'Shipped',
      updatedAt: now,
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: 'Carrier Dispatched',
          previousState: 'Ordered',
          newState: 'Shipped',
          notes: `Vendor confirmed carrier shipment. Tracking: ${req.purchaseOrder?.trackingReference || 'En route'}.`
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleDeliveryReceiptConfirm = (receipt: DeliveryReceipt) => {
    if (!deliveryModalRequest) return;
    const now = new Date().toISOString();
    const updatedReceipts = [...deliveryModalRequest.receipts, receipt];
    const newTotal = (deliveryModalRequest.totalReceivedQuantity || 0) + receipt.quantityReceived;
    const orderedQuantity = deliveryModalRequest.purchaseOrder?.quantity ?? deliveryModalRequest.quantity;
    const isComplete = newTotal >= orderedQuantity;
    const nextStatus: ProcurementStatus = isComplete ? 'Asset Registration' : 'Partially Received';

    const updated: ProcurementRequest = {
      ...deliveryModalRequest,
      status: nextStatus,
      receipts: updatedReceipts,
      totalReceivedQuantity: newTotal,
      updatedAt: now,
      auditLogs: [
        ...deliveryModalRequest.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: deliveryModalRequest.requestNumber,
          action: isComplete ? 'Delivery Complete' : 'Partial Delivery Recorded',
          previousState: deliveryModalRequest.status,
          newState: nextStatus,
          notes: `Received ${receipt.quantityReceived} unit(s) via slip ${receipt.deliveryReference}. Total received: ${newTotal}/${orderedQuantity}.`
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleRegisterAssetsConfirm = (createdAssets: Asset[]) => {
    if (!registerModalRequest) return;
    const now = new Date().toISOString();
    const tags = createdAssets.map(a => a.assetTag);

    const updated: ProcurementRequest = {
      ...registerModalRequest,
      status: 'Assigned/Fulfilled',
      registeredAssetTags: [...registerModalRequest.registeredAssetTags, ...tags],
      updatedAt: now,
      auditLogs: [
        ...registerModalRequest.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: registerModalRequest.requestNumber,
          action: 'Assets Enrolled into Fleet',
          previousState: registerModalRequest.status,
          newState: 'Assigned/Fulfilled',
          notes: `Enrolled ${createdAssets.length} asset(s) (${tags.join(', ')}). Assigned to ${registerModalRequest.requester.name}.`
        }
      ]
    };

    onRegisterFleetAssets(updated, createdAssets);
  };

  const handleCloseRequest = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'Closed',
      updatedAt: now,
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: 'Procurement Lifecycle Closed',
          previousState: req.status,
          newState: 'Closed',
          notes: 'Hardware operational deployment confirmed; procurement ticket closed.'
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleCancelRequest = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'Cancelled',
      updatedAt: now,
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: 'Request Cancelled',
          previousState: req.status,
          newState: 'Cancelled',
          notes: 'Cancelled by requester.'
        }
      ]
    };
    onUpdateRequest(updated);
  };

  const handleResubmitRequest = (req: ProcurementRequest) => {
    const now = new Date().toISOString();
    const updated: ProcurementRequest = {
      ...req,
      status: 'IT Head Review',
      updatedAt: now,
      auditLogs: [
        ...req.auditLogs,
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUserRole.name,
          role: currentUserRole.badge,
          requestNumber: req.requestNumber,
          action: req.status === 'Draft' ? 'Draft Submitted' : 'Request Resubmitted',
          previousState: req.status,
          newState: 'IT Head Review',
          notes: 'Re-submitted for IT Head authorization.'
        }
      ]
    };
    onUpdateRequest(updated);
  };

  return (
    <div className="space-y-4">
      {/* Top Section Header */}
      <div className="ti-surface rounded-lg p-3.5 border border-[#D8D6CF] flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#181A1B] tracking-tight">
                System Assist • Guarded Procurement Console
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#EBF7EE] text-[#0F682C] border border-[#B7E5C3]">
                <LedIndicator color="green" size="sm" /> RBAC Engine
              </span>
            </div>
            <p className="text-[11px] text-[#686B6D] mt-0.5">
              Dual IT & Finance approval chain • Stock fulfillment • PO budget enforcement
            </p>
          </div>
        </div>

        {/* Global Action: New Request */}
        <SkeuoButton
          size="sm"
          variant="primary"
          onClick={() => {
            setEditingRequest(null);
            setIsCreateModalOpen(true);
          }}
          icon={<Plus className="w-3.5 h-3.5" />}
          aria-label="Create new procurement request"
        >
          New Procurement Request
        </SkeuoButton>
      </div>

      {/* Navigation Tabs (4 Core Views) */}
      <div className="ti-surface rounded-lg p-1.5 border border-[#D8D6CF] flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setActiveTab('my_requests');
            setStatusFilter('ALL');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'my_requests'
              ? 'bg-[#EAE8E2] text-[#181A1B] shadow-xs border border-[#C5C3BC]'
              : 'text-[#686B6D] hover:text-[#181A1B] hover:bg-[#F2EFE9]'
          }`}
          aria-current={activeTab === 'my_requests' ? 'page' : undefined}
        >
          <User className="w-3.5 h-3.5 text-[#C66A2B]" />
          <span>My Requests</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F5] border border-[#D8D6CF]">
            {myRequestsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('awaiting_approval');
            setStatusFilter('ALL');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'awaiting_approval'
              ? 'bg-[#EAE8E2] text-[#181A1B] shadow-xs border border-[#C5C3BC]'
              : 'text-[#686B6D] hover:text-[#181A1B] hover:bg-[#F2EFE9]'
          }`}
          aria-current={activeTab === 'awaiting_approval' ? 'page' : undefined}
        >
          <Clock className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Awaiting My Approval</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
            awaitingApprovalCount > 0 ? 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] font-bold' : 'bg-[#FAF9F5] border-[#D8D6CF]'
          }`}>
            {awaitingApprovalCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('purchasing_queue');
            setStatusFilter('ALL');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'purchasing_queue'
              ? 'bg-[#EAE8E2] text-[#181A1B] shadow-xs border border-[#C5C3BC]'
              : 'text-[#686B6D] hover:text-[#181A1B] hover:bg-[#F2EFE9]'
          }`}
          aria-current={activeTab === 'purchasing_queue' ? 'page' : undefined}
        >
          <ShoppingCart className="w-3.5 h-3.5 text-[#1956A6]" />
          <span>Purchasing Queue</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F5] border border-[#D8D6CF]">
            {purchasingQueueCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('all_requests');
            setStatusFilter('ALL');
          }}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'all_requests'
              ? 'bg-[#EAE8E2] text-[#181A1B] shadow-xs border border-[#C5C3BC]'
              : 'text-[#686B6D] hover:text-[#181A1B] hover:bg-[#F2EFE9]'
          }`}
          aria-current={activeTab === 'all_requests' ? 'page' : undefined}
        >
          <Layers className="w-3.5 h-3.5 text-[#505457]" />
          <span>All Requests</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9F5] border border-[#D8D6CF]">
            {allRequestsCount}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="ti-surface rounded-lg p-2.5 border border-[#D8D6CF] flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-[#686B6D] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by PR #, requester, model, department, PO #..."
              className="w-full h-8 pl-8 pr-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#686B6D]">Status:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-8 px-2 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="IT Head Review">IT Head Review</option>
              <option value="Finance Review">Finance Review</option>
              <option value="Purchasing Queue">Purchasing Queue</option>
              <option value="Ordered">Ordered</option>
              <option value="Shipped">Shipped</option>
              <option value="Partially Received">Partially Received</option>
              <option value="Received">Received</option>
              <option value="Asset Registration">Asset Registration</option>
              <option value="Assigned/Fulfilled">Assigned/Fulfilled</option>
              <option value="Changes Requested">Changes Requested</option>
              <option value="Rejected">Rejected</option>
              <option value="Closed">Closed</option>
              <option value="Overdue">Overdue Deliveries Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-[#686B6D]">Class:</span>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="h-8 px-2 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="Laptop">Laptop Workstations</option>
              <option value="Display">Displays / Monitors</option>
              <option value="Dock">Docks</option>
              <option value="Keyboard">Keyboards</option>
              <option value="Mouse">Mice / Trackpads</option>
              <option value="Audio/Headset">Audio / Headsets</option>
              <option value="Other">Other Auxiliary</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="ti-surface rounded-lg border border-[#D8D6CF] overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D8D6CF] bg-[#EAE8E2] text-[#686B6D] font-semibold text-[11px]">
                <th className="py-2.5 px-3">Request #</th>
                <th className="py-2.5 px-3">Requester & Dept</th>
                <th className="py-2.5 px-3">Model / Specification</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Qty & Commitment</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Urgency & Required By</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E2] text-[#181A1B]">
              {displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#686B6D]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <FileCheck2 className="w-8 h-8 text-[#C5C3BC] mx-auto" />
                      <p className="font-semibold text-xs text-[#505457]">
                        No procurement requests match the selected view and filters.
                      </p>
                      <p className="text-[11px] text-[#8C8F92]">
                        {activeTab === 'my_requests' 
                          ? 'You have no open requests in this view. Click "New Procurement Request" above.'
                          : activeTab === 'awaiting_approval' 
                          ? 'You currently have zero requests requiring your approval under the active role.'
                          : 'Try modifying your search or status filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedRequests.map(req => {
                  const isSelected = selectedRequestId === req.id;
                  const isOverdue = Boolean(
                    (req.status === 'Ordered' || req.status === 'Shipped') &&
                    req.purchaseOrder?.expectedDeliveryDate &&
                    req.purchaseOrder.expectedDeliveryDate < new Date().toISOString().slice(0, 10)
                  );

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedRequestId(req.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-[#EAE8E2] font-medium' 
                          : 'hover:bg-[#FAF9F5]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-xs text-[#181A1B]">
                        {req.requestNumber}
                        {req.purchaseOrder?.poNumber && (
                          <span className="block font-mono text-[10px] text-[#1956A6] font-normal">
                            {req.purchaseOrder.poNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#181A1B]">{req.requester.name}</div>
                        <div className="text-[10px] text-[#686B6D]">{req.department} • {req.costCentre}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-medium text-[#181A1B] line-clamp-1">{req.preferredModel}</div>
                        <div className="text-[10px] text-[#686B6D] line-clamp-1">{req.preferredVendor}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#D8D6CF] text-[10px] font-medium text-[#505457]">
                          {req.category}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-bold text-[#181A1B]">
                          {req.quantity}x • {req.currency} {req.estimatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        {req.purchaseOrder && (
                          <div className="text-[10px] text-[#1956A6]">
                            PO: {req.currency} {req.purchaseOrder.finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeColor(req.status)}`}>
                          {req.status}
                        </span>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          {req.urgency === 'Critical' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEE2E2] text-[#991B1B] border border-[#F87171]">
                              CRITICAL
                            </span>
                          ) : req.urgency === 'Urgent' ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                              URGENT
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#686B6D]">
                              Standard
                            </span>
                          )}
                        </div>
                        <div className={`text-[10px] font-mono mt-0.5 ${isOverdue ? 'text-[#B91C1C] font-bold flex items-center gap-1' : 'text-[#686B6D]'}`}>
                          {isOverdue && <ClockAlert className="w-3 h-3 text-[#B91C1C]" />}
                          {isOverdue ? `Overdue (ETA ${req.purchaseOrder?.expectedDeliveryDate})` : `Due: ${req.requiredByDate}`}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRequestId(req.id);
                          }}
                          className="p-1 rounded text-[#686B6D] hover:text-[#C66A2B] hover:bg-[#DFDDD6] cursor-pointer"
                          aria-label={`Inspect request ${req.requestNumber}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Inspector Drawer */}
      <ProcurementInspectorDrawer
        isOpen={Boolean(selectedRequest)}
        onClose={() => setSelectedRequestId(null)}
        request={selectedRequest}
        currentUser={currentUserRole}
        onApproveIT={() => selectedRequest && handleApproveIT(selectedRequest)}
        onApproveFinance={() => selectedRequest && handleApproveFinance(selectedRequest)}
        onRequestChanges={() => {
          if (selectedRequest) {
            setReasonModalConfig({
              isOpen: true,
              type: 'changes_requested',
              targetRequest: selectedRequest
            });
          }
        }}
        onReject={() => {
          if (selectedRequest) {
            setReasonModalConfig({
              isOpen: true,
              type: 'reject',
              targetRequest: selectedRequest
            });
          }
        }}
        onOpenStockFulfillment={() => {
          if (selectedRequest) setStockModalRequest(selectedRequest);
        }}
        onOpenCreatePO={() => {
          if (selectedRequest) setPoModalRequest(selectedRequest);
        }}
        onMarkShipped={() => selectedRequest && handleMarkShipped(selectedRequest)}
        onOpenReceiveDelivery={() => {
          if (selectedRequest) setDeliveryModalRequest(selectedRequest);
        }}
        onOpenRegisterAssets={() => {
          if (selectedRequest) setRegisterModalRequest(selectedRequest);
        }}
        onCloseRequest={() => selectedRequest && handleCloseRequest(selectedRequest)}
        onCancelRequest={() => selectedRequest && handleCancelRequest(selectedRequest)}
        onEditRequest={() => {
          if (selectedRequest) {
            setEditingRequest(selectedRequest);
            setIsCreateModalOpen(true);
          }
        }}
        onResubmitRequest={() => selectedRequest && handleResubmitRequest(selectedRequest)}
      />

      {/* New / Edit Request Modal */}
      <ProcurementRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingRequest(null);
        }}
        currentUser={currentUserRole}
        existingRequests={requests}
        initialData={editingRequest || undefined}
        onSaveDraft={onSaveDraft}
        onSubmitRequest={onSubmitRequest}
      />

      {/* Written Reason Modal for Reject & Changes Requested */}
      <ProcurementReasonModal
        isOpen={reasonModalConfig.isOpen}
        onClose={() => setReasonModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={reasonModalConfig.type === 'reject' ? 'Reject Procurement Request' : 'Request Modifications'}
        description={reasonModalConfig.type === 'reject' 
          ? 'Enter written grounds for rejecting this hardware acquisition request.' 
          : 'Specify the required adjustments or specifications needed before review can proceed.'}
        actionLabel={reasonModalConfig.type === 'reject' ? 'Confirm Rejection' : 'Submit Modification Request'}
        actionType={reasonModalConfig.type}
        requestNumber={reasonModalConfig.targetRequest?.requestNumber || ''}
        onSubmit={handleReasonSubmit}
      />

      {/* Existing Stock Fulfilment Modal */}
      {stockModalRequest && (
        <ExistingStockModal
          isOpen={Boolean(stockModalRequest)}
          onClose={() => setStockModalRequest(null)}
          request={stockModalRequest}
          availableAssets={assets}
          onConfirmFulfillment={handleStockFulfillmentConfirm}
        />
      )}

      {/* Issue Purchase Order Modal */}
      {poModalRequest && (
        <CreatePOModal
          isOpen={Boolean(poModalRequest)}
          onClose={() => setPoModalRequest(null)}
          request={poModalRequest}
          existingRequests={requests}
          onSubmitPO={handlePOSubmit}
        />
      )}

      {/* Delivery Receipt Modal */}
      {deliveryModalRequest && (
        <ReceiveDeliveryModal
          isOpen={Boolean(deliveryModalRequest)}
          onClose={() => setDeliveryModalRequest(null)}
          request={deliveryModalRequest}
          currentUser={currentUserRole}
          onConfirmReceipt={handleDeliveryReceiptConfirm}
        />
      )}

      {/* Register Received Assets Modal */}
      {registerModalRequest && (
        <RegisterAssetsModal
          isOpen={Boolean(registerModalRequest)}
          onClose={() => setRegisterModalRequest(null)}
          request={registerModalRequest}
          existingAssets={assets}
          currentUser={currentUserRole}
          onConfirmRegistration={handleRegisterAssetsConfirm}
        />
      )}
    </div>
  );
};
