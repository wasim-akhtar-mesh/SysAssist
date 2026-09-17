import React from 'react';
import { X, Printer, FileText, CheckCircle2, ShieldAlert, Clock, Building, User, DollarSign, Package } from 'lucide-react';
import { ProcurementRequest } from '../types';
import { SkeuoButton } from './SkeuoComponents';

interface PrintRequestDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
}

export const PrintRequestDossierModal: React.FC<PrintRequestDossierModalProps> = ({
  isOpen,
  onClose,
  request
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const itApproval = request.approvals?.find(a => a.stage === 'IT Head Review');
  const financeApproval = request.approvals?.find(a => a.stage === 'Finance Review');

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Modal Toolbar - Hidden during window.print() */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#C66A2B]" />
            <h2 id="dossier-modal-title" className="text-sm font-bold text-[#181A1B]">
              Procurement Request Dossier: {request.requestNumber}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <SkeuoButton
              size="sm"
              variant="primary"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              Print / Save PDF
            </SkeuoButton>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-md text-[#686B6D] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer"
              aria-label="Close dossier"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-xs text-[#181A1B] bg-white print:p-0 print:overflow-visible">
          {/* Document Header */}
          <div className="border-b-2 border-[#181A1B] pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="text-[10px] uppercase font-mono tracking-widest text-[#505457]">
                System Assist • Fleet & Procurement Dossier
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[#181A1B] mt-0.5">
                PROCUREMENT RECORD & AUDIT DOSSIER
              </h1>
              <div className="text-xs text-[#505457] mt-1 font-mono">
                PR Reference: <strong className="text-[#181A1B]">{request.requestNumber}</strong> | Created: {request.createdAt.split('T')[0]}
              </div>
            </div>

            <div className="text-right sm:self-center">
              <div className="inline-block px-3 py-1 rounded border border-[#181A1B] font-mono font-bold text-xs uppercase bg-[#F0EFEA]">
                Status: {request.status}
              </div>
              <div className="text-[10px] text-[#505457] mt-1">
                Urgency: {request.urgency} | Type: {request.requestType}
              </div>
            </div>
          </div>

          {/* Section 1: Organizational & Requester Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2 flex items-center gap-1">
                <User className="w-3 h-3 text-[#C66A2B]" /> Requester Information
              </div>
              <div className="space-y-1">
                <div><span className="text-[#686B6D]">Name:</span> <strong className="font-medium">{request.requester.name}</strong></div>
                <div><span className="text-[#686B6D]">Email:</span> <span className="font-mono">{request.requester.email}</span></div>
                <div><span className="text-[#686B6D]">Department:</span> {request.department}</div>
                <div><span className="text-[#686B6D]">Cost Centre:</span> <span className="font-mono">{request.costCentre}</span></div>
                <div><span className="text-[#686B6D]">Approving Manager:</span> {request.manager}</div>
              </div>
            </div>

            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2 flex items-center gap-1">
                <Package className="w-3 h-3 text-[#2C6E9B]" /> Equipment Specification
              </div>
              <div className="space-y-1">
                <div><span className="text-[#686B6D]">Category:</span> <strong className="font-medium">{request.category}</strong></div>
                <div><span className="text-[#686B6D]">Model/Item:</span> {request.preferredModel}</div>
                <div><span className="text-[#686B6D]">Quantity:</span> {request.quantity} unit(s)</div>
                <div><span className="text-[#686B6D]">Required By:</span> {request.requiredByDate}</div>
                <div><span className="text-[#686B6D]">Preferred Vendor:</span> {request.preferredVendor}</div>
                {request.replacementAssetTag && (
                  <div><span className="text-[#686B6D]">Replacement Tag:</span> <span className="font-mono">{request.replacementAssetTag}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Business Justification */}
          <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-1">
              Business Justification & Operational Requirement
            </div>
            <p className="text-xs text-[#181A1B] leading-relaxed whitespace-pre-wrap">
              {request.businessJustification}
            </p>
          </div>

          {/* Section 2: Financial Assessment */}
          <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-3 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-[#15803D]" /> Financial Authorization & Spend
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] text-[#686B6D] block">Estimated Unit Price</span>
                <span className="font-mono text-sm font-semibold">{request.currency} {request.estimatedUnitPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Estimated Total</span>
                <span className="font-mono text-sm font-semibold">{request.currency} {request.estimatedTotalCost.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Finance-Approved Max</span>
                <span className="font-mono text-sm font-semibold">
                  {request.financeApprovedAmount !== undefined ? `${request.currency} ${request.financeApprovedAmount.toFixed(2)}` : 'Awaiting Finance'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-[#686B6D] block">Final PO Total</span>
                <span className="font-mono text-sm font-semibold text-[#15803D]">
                  {request.purchaseOrder?.finalTotalCost !== undefined ? `${request.currency} ${request.purchaseOrder.finalTotalCost.toFixed(2)}` : 'PO Not Issued'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Governance & Multi-Stage Approvals */}
          <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-3">
              Governance & Approvals Record
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 border border-[#E0DED7] rounded bg-white">
                <div className="text-[10px] font-bold text-[#505457] uppercase">Stage 1: IT Head Review</div>
                {itApproval ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="font-medium text-[#181A1B]">{itApproval.decision} by {itApproval.approverName}</div>
                    <div className="text-[10px] text-[#686B6D] font-mono">{itApproval.timestamp}</div>
                    {itApproval.reason && <div className="text-[11px] text-[#505457] mt-1 italic">"{itApproval.reason}"</div>}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#707375] italic mt-1">Pending IT Head Evaluation</div>
                )}
              </div>

              <div className="p-3 border border-[#E0DED7] rounded bg-white">
                <div className="text-[10px] font-bold text-[#505457] uppercase">Stage 2: Finance Review</div>
                {financeApproval ? (
                  <div className="mt-1 space-y-0.5">
                    <div className="font-medium text-[#181A1B]">{financeApproval.decision} by {financeApproval.approverName}</div>
                    <div className="text-[10px] text-[#686B6D] font-mono">{financeApproval.timestamp}</div>
                    {financeApproval.reason && <div className="text-[11px] text-[#505457] mt-1 italic">"{financeApproval.reason}"</div>}
                  </div>
                ) : (
                  <div className="text-[11px] text-[#707375] italic mt-1">Pending Finance Evaluation</div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Purchase Order & Delivery Tracking */}
          {request.purchaseOrder && (
            <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2">
                Purchase Order & Logistics Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><span className="text-[#686B6D]">PO Number:</span> <strong className="font-mono">{request.purchaseOrder.poNumber}</strong></div>
                <div><span className="text-[#686B6D]">Vendor:</span> {request.purchaseOrder.vendor}</div>
                <div><span className="text-[#686B6D]">Order Date:</span> {request.purchaseOrder.orderDate}</div>
                <div><span className="text-[#686B6D]">Expected Delivery:</span> {request.purchaseOrder.expectedDeliveryDate}</div>
                {request.purchaseOrder.trackingReference && (
                  <div className="col-span-2"><span className="text-[#686B6D]">Tracking:</span> <span className="font-mono">{request.purchaseOrder.trackingReference}</span></div>
                )}
                <div><span className="text-[#686B6D]">Units Ordered:</span> {request.purchaseOrder.quantity}</div>
                <div><span className="text-[#686B6D]">Units Received:</span> {request.totalReceivedQuantity || 0}</div>
              </div>
            </div>
          )}

          {/* Section 5: Delivery Receipts */}
          {request.receipts && request.receipts.length > 0 && (
            <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2">
                Depot Receiving Slips & Delivery Verification
              </div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#D8D6CF] text-[#505457]">
                    <th className="py-1">Date</th>
                    <th className="py-1">Received Qty</th>
                    <th className="py-1">Receiver</th>
                    <th className="py-1">Delivery Reference</th>
                    <th className="py-1">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE8E2]">
                  {request.receipts.map(rc => (
                    <tr key={rc.id}>
                      <td className="py-1 font-mono">{rc.receiptDate}</td>
                      <td className="py-1 font-bold">{rc.quantityReceived}</td>
                      <td className="py-1">{rc.receiver}</td>
                      <td className="py-1 font-mono">{rc.deliveryReference}</td>
                      <td className="py-1 text-[#505457]">{rc.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Section 6: Linked & Registered Assets */}
          {(request.registeredAssetTags?.length > 0 || request.fulfilledAssetTags?.length > 0) && (
            <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2">
                Registered Fleet Assets & Custody Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {request.registeredAssetTags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-white border border-[#C5C3BC] rounded font-mono font-semibold text-xs">
                    {tag} (Depot Registered)
                  </span>
                ))}
                {request.fulfilledAssetTags?.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-[#EBF7EE] border border-[#B7E5C3] text-[#0F682C] rounded font-mono font-semibold text-xs">
                    {tag} (Fulfilled / Assigned)
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 7: Audit Trail */}
          <div className="border border-[#D8D6CF] p-4 rounded bg-[#FAFAF8]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#505457] mb-2">
              Immutable Lifecycle Audit Trail
            </div>
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b border-[#D8D6CF] text-[#505457]">
                  <th className="py-1">Timestamp</th>
                  <th className="py-1">Actor & Role</th>
                  <th className="py-1">Action</th>
                  <th className="py-1">State Transition</th>
                  <th className="py-1">Notes / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE8E2]">
                {(request.auditLogs || []).map(log => (
                  <tr key={log.id}>
                    <td className="py-1 font-mono text-[10px]">{log.timestamp.replace('T', ' ').substring(0, 19)}</td>
                    <td className="py-1">{log.actor} ({log.role})</td>
                    <td className="py-1 font-medium">{log.action}</td>
                    <td className="py-1 font-mono text-[10px]">{log.previousState} → {log.newState}</td>
                    <td className="py-1 text-[#505457] italic">{log.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer certification */}
          <div className="border-t border-[#D8D6CF] pt-4 text-[10px] text-[#686B6D] flex justify-between items-center">
            <span>Generated from System Assist Operational System</span>
            <span>Document Integrity Verified • Local State Repository</span>
          </div>
        </div>
      </div>
    </div>
  );
};
