import React, { useState } from 'react';
import { 
  X, 
  FileCheck2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShoppingCart, 
  Truck, 
  Package, 
  ShieldCheck, 
  User, 
  Building, 
  DollarSign, 
  RotateCcw, 
  XCircle, 
  Edit3, 
  Boxes,
  Ban,
  ArrowRight,
  Printer
} from 'lucide-react';
import { 
  ProcurementRequest, 
  ProcurementStatus, 
  SimulatedUserRole,
  Asset
} from '../types';
import { SkeuoButton, StatusBadge } from './SkeuoComponents';
import { canActorApprove, isActorRequestOwner } from '../services/procurementService';
import { PrintRequestDossierModal } from './PrintRequestDossierModal';

interface ProcurementInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest | null;
  currentUser: SimulatedUserRole;
  onApproveIT: () => void;
  onApproveFinance: () => void;
  onRequestChanges: () => void;
  onReject: () => void;
  onOpenStockFulfillment: () => void;
  onOpenCreatePO: () => void;
  onMarkShipped: () => void;
  onOpenReceiveDelivery: () => void;
  onOpenRegisterAssets: () => void;
  onCloseRequest: () => void;
  onCancelRequest: () => void;
  onEditRequest: () => void;
  onResubmitRequest: () => void;
}

export const ProcurementInspectorDrawer: React.FC<ProcurementInspectorDrawerProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onApproveIT,
  onApproveFinance,
  onRequestChanges,
  onReject,
  onOpenStockFulfillment,
  onOpenCreatePO,
  onMarkShipped,
  onOpenReceiveDelivery,
  onOpenRegisterAssets,
  onCloseRequest,
  onCancelRequest,
  onEditRequest,
  onResubmitRequest
}) => {
  const [showDossierModal, setShowDossierModal] = useState(false);

  if (!isOpen || !request) return null;

  const approvalCheck = canActorApprove(request, currentUser);
  const isRequester = isActorRequestOwner(request, currentUser);

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

  const isTerminal = request.status === 'Closed' || request.status === 'Rejected' || request.status === 'Cancelled';

  return (
    <div 
      className="fixed inset-y-0 right-0 z-40 w-full max-w-xl bg-[#FAF9F5] border-l border-[#C5C3BC] shadow-2xl flex flex-col overflow-hidden text-[#181A1B] animate-in slide-in-from-right duration-200"
      role="region"
      aria-label={`Procurement Request Inspector: ${request.requestNumber}`}
    >
      {/* Drawer Header */}
      <div className="px-5 py-4 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-[#181A1B]">
              {request.requestNumber}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wide ${getStatusBadgeColor(request.status)}`}>
              {request.status}
            </span>
            {request.urgency === 'Critical' && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#FEE2E2] text-[#991B1B] border border-[#F87171]">
                CRITICAL
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#686B6D] mt-0.5 truncate max-w-sm">
            {request.preferredModel} • Required by {request.requiredByDate}
          </p>
        </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowDossierModal(true)}
              className="px-2 py-1 rounded-md text-[#505457] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer flex items-center gap-1 text-xs border border-[#C5C3BC] bg-[#FAF9F5]"
              title="Print Request Dossier & Audit Record"
              aria-label="Print Request Dossier"
            >
              <Printer className="w-3.5 h-3.5 text-[#2C6E9B]" />
              <span className="hidden sm:inline font-medium">Print Dossier</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#686B6D] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer"
              aria-label="Close procurement inspector"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
      </div>

      {/* Drawer Body - Scrollable */}
      <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
        {/* Anti-Self Approval Guard Warning */}
        {!approvalCheck.allowed && approvalCheck.reason && (
          <div className="p-2.5 rounded-md bg-[#FFFBEB] border border-[#FDE68A] text-[#92400E] flex items-start gap-2">
            <Ban className="w-4 h-4 shrink-0 mt-0.5 text-[#B45309]" />
            <div>
              <span className="font-semibold block text-[11px]">Approval Guard Active</span>
              <span className="text-[10px] leading-relaxed">{approvalCheck.reason}</span>
            </div>
          </div>
        )}

        {/* Workflow State Machine Actions Bar */}
        {!isTerminal && (
          <div className="p-3 rounded-lg ti-surface border border-[#D8D6CF] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center justify-between">
              <span>Operational Stage Controls</span>
              <span className="text-[#1956A6] font-semibold">{currentUser.badge} Session</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* IT Head Review Actions */}
              {request.status === 'IT Head Review' && approvalCheck.allowed && (
                <>
                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    onClick={onApproveIT}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Authorize & Route to Finance
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onOpenStockFulfillment}
                    icon={<Boxes className="w-3.5 h-3.5 text-[#0F682C]" />}
                  >
                    Fulfill from Depot Stock
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onRequestChanges}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />}
                  >
                    Request Changes
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onReject}
                    icon={<XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />}
                  >
                    Reject
                  </SkeuoButton>
                </>
              )}

              {/* Finance Review Actions */}
              {request.status === 'Finance Review' && approvalCheck.allowed && (
                <>
                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    onClick={onApproveFinance}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    Authorize Budget for Purchasing
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onRequestChanges}
                    icon={<RotateCcw className="w-3.5 h-3.5 text-[#D97706]" />}
                  >
                    Request Changes
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onReject}
                    icon={<XCircle className="w-3.5 h-3.5 text-[#B91C1C]" />}
                  >
                    Reject
                  </SkeuoButton>
                </>
              )}

              {/* Purchasing Queue Actions */}
              {request.status === 'Purchasing Queue' && (currentUser.id === 'purchasing_buyer' || currentUser.id === 'it_head' || currentUser.id === 'finance') && (
                <SkeuoButton
                  size="sm"
                  variant="primary"
                  onClick={onOpenCreatePO}
                  icon={<ShoppingCart className="w-3.5 h-3.5" />}
                >
                  Generate Purchase Order (PO)
                </SkeuoButton>
              )}

              {/* Ordered Actions */}
              {request.status === 'Ordered' && (
                <>
                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onMarkShipped}
                    icon={<Truck className="w-3.5 h-3.5 text-[#0F682C]" />}
                  >
                    Mark Carrier Shipped
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    onClick={onOpenReceiveDelivery}
                    icon={<Package className="w-3.5 h-3.5" />}
                  >
                    Record Delivery Receipt
                  </SkeuoButton>
                </>
              )}

              {/* Shipped & Partially Received Actions */}
              {(request.status === 'Shipped' || request.status === 'Partially Received') && (
                <SkeuoButton
                  size="sm"
                  variant="primary"
                  onClick={onOpenReceiveDelivery}
                  icon={<Package className="w-3.5 h-3.5" />}
                >
                  Record Delivery Receipt
                </SkeuoButton>
              )}

              {/* Received & Asset Registration Actions (IT Asset Manager Only) */}
              {(request.status === 'Received' || request.status === 'Asset Registration') && currentUser.id === 'asset_manager' && (
                <SkeuoButton
                  size="sm"
                  variant="primary"
                  onClick={onOpenRegisterAssets}
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  Register & Assign Fleet Assets
                </SkeuoButton>
              )}
              {(request.status === 'Received' || request.status === 'Asset Registration') && currentUser.id !== 'asset_manager' && (
                <div className="text-[11px] text-[#707375] italic flex items-center gap-1.5 py-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8C8F91]" />
                  <span>Awaiting asset registration by IT Asset Manager</span>
                </div>
              )}

              {/* Assigned/Fulfilled Actions */}
              {request.status === 'Assigned/Fulfilled' && (
                <SkeuoButton
                  size="sm"
                  variant="standard"
                  onClick={onCloseRequest}
                  icon={<CheckCircle2 className="w-3.5 h-3.5 text-[#0F682C]" />}
                >
                  Finalize & Close Request
                </SkeuoButton>
              )}

              {/* Draft & Changes Requested Actions (Requester controls) */}
              {(request.status === 'Draft' || request.status === 'Changes Requested') && isRequester && (
                <>
                  <SkeuoButton
                    size="sm"
                    variant="primary"
                    onClick={onResubmitRequest}
                    icon={<FileCheck2 className="w-3.5 h-3.5" />}
                  >
                    {request.status === 'Draft' ? 'Submit for IT Head Review' : 'Resubmit with Revisions'}
                  </SkeuoButton>

                  <SkeuoButton
                    size="sm"
                    variant="standard"
                    onClick={onEditRequest}
                    icon={<Edit3 className="w-3.5 h-3.5 text-[#505457]" />}
                  >
                    Edit Draft
                  </SkeuoButton>

                  <button
                    type="button"
                    onClick={onCancelRequest}
                    className="text-xs text-[#B91C1C] hover:underline px-2 py-1 cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Section: Organizational Details */}
        <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
            <Building className="w-3 h-3 text-[#C66A2B]" />
            <span>Organizational Identity</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#686B6D] block">Requester</span>
              <span className="font-semibold text-[#181A1B]">{request.requester.name}</span>
              <span className="text-[10px] text-[#505457] block font-mono">{request.requester.email}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#686B6D] block">Department & Cost Centre</span>
              <span className="font-semibold text-[#181A1B]">{request.department}</span>
              <span className="text-[10px] text-[#505457] block font-mono">{request.costCentre}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#686B6D] block">Approving Manager</span>
              <span className="font-medium text-[#181A1B]">{request.manager}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#686B6D] block">Request Type</span>
              <span className="font-medium text-[#181A1B]">{request.requestType}</span>
              {request.replacementAssetTag && (
                <span className="text-[10px] text-[#C66A2B] block font-mono">
                  Replacing: {request.replacementAssetTag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Section: Technical Hardware Specifications */}
        <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
            <FileCheck2 className="w-3 h-3 text-[#2C6E9B]" />
            <span>Hardware Specification & Purpose</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <span className="text-[10px] text-[#686B6D] block">Preferred Model / Spec</span>
              <span className="font-bold text-[#181A1B] text-sm">{request.preferredModel}</span>
              <span className="text-[10px] text-[#505457] block">Equipment Class: {request.category}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#686B6D] block">Requested Units</span>
                <span className="font-mono font-bold text-sm text-[#181A1B]">{request.quantity}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Preferred Vendor</span>
                <span className="font-medium text-[#181A1B]">{request.preferredVendor}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-[#686B6D] block">Business Justification</span>
              <p className="text-[#181A1B] leading-relaxed bg-[#FAF9F5] p-2 rounded border border-[#C5C3BC]">
                {request.businessJustification}
              </p>
            </div>

            {request.additionalNotes && (
              <div>
                <span className="text-[10px] text-[#686B6D] block">Additional Notes</span>
                <p className="text-[#505457] italic bg-[#FAF9F5] p-1.5 rounded border border-[#C5C3BC]">
                  {request.additionalNotes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Section: Financial Commitment */}
        <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
            <DollarSign className="w-3 h-3 text-[#0F682C]" />
            <span>Financial Authorizations</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[10px] text-[#686B6D] block">Estimated Total Cost</span>
              <span className="font-mono font-bold text-sm text-[#181A1B]">
                {request.currency} {request.estimatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[10px] text-[#505457] block">
                (@ {request.currency} {request.estimatedUnitPrice.toFixed(2)}/ea)
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#686B6D] block">Finance Authorized Amount</span>
              <span className="font-mono font-bold text-sm text-[#0F682C]">
                {request.financeApprovedAmount 
                  ? `${request.currency} ${request.financeApprovedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                  : 'Pending Review'}
              </span>
            </div>
          </div>
        </div>

        {/* Section: Purchase Order & Delivery Tracking (If PO exists) */}
        {request.purchaseOrder && (
          <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
              <ShoppingCart className="w-3 h-3 text-[#1956A6]" />
              <span>Purchase Order Details</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#686B6D] block">PO Number</span>
                <span className="font-mono font-bold text-xs text-[#1956A6]">{request.purchaseOrder.poNumber}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Vendor</span>
                <span className="font-medium text-[#181A1B]">{request.purchaseOrder.vendor}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Order Date</span>
                <span className="font-mono text-[#181A1B]">{request.purchaseOrder.orderDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Expected Delivery ETA</span>
                <span className="font-mono text-[#181A1B]">{request.purchaseOrder.expectedDeliveryDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Final Committed Cost</span>
                <span className="font-mono font-bold text-[#181A1B]">
                  {request.purchaseOrder.currency} {request.purchaseOrder.finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Tracking Reference</span>
                <span className="font-mono font-semibold text-[#181A1B]">
                  {request.purchaseOrder.trackingReference || 'Pending Dispatch'}
                </span>
              </div>
            </div>

            {/* Delivery Receipts Sub-block */}
            {request.receipts.length > 0 && (
              <div className="pt-2 border-t border-[#D8D6CF]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] block mb-1.5">
                  Delivery Receipt History ({request.totalReceivedQuantity} of {request.purchaseOrder.quantity} units received)
                </span>
                <div className="space-y-1.5">
                  {request.receipts.map(rcpt => (
                    <div key={rcpt.id} className="p-2 rounded bg-[#FAF9F5] border border-[#C5C3BC] flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-xs text-[#0F682C]">
                          +{rcpt.quantityReceived} unit(s)
                        </span>
                        <span className="text-[10px] text-[#505457] ml-2">
                          Recv by {rcpt.receiver} on {rcpt.receiptDate}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#686B6D]">
                        Ref: {rcpt.deliveryReference}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section: Registered Fleet Assets */}
        {request.registeredAssetTags.length > 0 && (
          <div className="p-3 rounded-lg bg-[#EBF7EE] border border-[#B7E5C3] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F682C] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Enrolled Fleet Asset Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {request.registeredAssetTags.map(tag => (
                <span key={tag} className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#B7E5C3] text-[#0F682C]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Stock Fulfilled Assets */}
        {request.fulfilledAssetTags.length > 0 && (
          <div className="p-3 rounded-lg bg-[#EBF7EE] border border-[#B7E5C3] space-y-1.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0F682C] flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" />
              <span>Depot Stock Allocation Tags</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {request.fulfilledAssetTags.map(tag => (
                <span key={tag} className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#FAF9F5] border border-[#B7E5C3] text-[#0F682C]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Section: Immutable Audit Trail */}
        <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#505457]" />
              <span>Immutable Audit Trail ({request.auditLogs.length} events)</span>
            </div>
            <span className="text-[10px] font-mono text-[#686B6D]">System Assist Core</span>
          </div>

          <div className="space-y-2">
            {request.auditLogs.map((log) => (
              <div key={log.id} className="p-2 rounded bg-[#FAF9F5] border border-[#C5C3BC] text-[11px] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#181A1B]">{log.action}</span>
                  <span className="font-mono text-[10px] text-[#686B6D]">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[10px] text-[#505457]">
                  Actor: <strong className="text-[#181A1B]">{log.actor}</strong> ({log.role})
                  {log.previousState !== log.newState && (
                    <span className="ml-1.5">
                      • Transition: <code className="bg-[#E5E3DD] px-1 rounded">{log.previousState}</code> → <code className="bg-[#E5E3DD] px-1 rounded">{log.newState}</code>
                    </span>
                  )}
                </div>
                {log.notes && (
                  <p className="text-[10px] text-[#181A1B] italic bg-[#EAE8E2]/50 p-1 rounded">
                    "{log.notes}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Printable Request Dossier Modal */}
      <PrintRequestDossierModal
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
        request={request}
      />
    </div>
  );
};
