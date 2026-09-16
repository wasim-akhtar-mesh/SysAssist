import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Truck,
  RotateCcw
} from 'lucide-react';
import { ProcurementRequest, PurchaseOrderInfo } from '../types';
import { SkeuoButton } from './SkeuoComponents';
import { generateUniquePONumber } from '../utils/idGenerator';

interface CreatePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
  existingRequests: ProcurementRequest[];
  onSubmitPO: (po: PurchaseOrderInfo) => void;
}

export const CreatePOModal: React.FC<CreatePOModalProps> = ({
  isOpen,
  onClose,
  request,
  existingRequests,
  onSubmitPO
}) => {
  if (!isOpen) return null;

  const defaultPONumber = generateUniquePONumber(existingRequests);

  const [poNumber, setPoNumber] = useState(defaultPONumber);
  const [vendor, setVendor] = useState(request.preferredVendor || 'Apple Enterprise Direct');
  const [finalUnitPrice, setFinalUnitPrice] = useState<number>(request.estimatedUnitPrice || 1899);
  const [quantity, setQuantity] = useState<number>(request.quantity || 1);
  const [currency, setCurrency] = useState(request.currency || 'USD');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [trackingReference, setTrackingReference] = useState('1Z' + Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString());
  const [purchasingNotes, setPurchasingNotes] = useState('Purchasing Buyer order execution.');
  const [validationError, setValidationError] = useState('');

  const finalTotalCost = (finalUnitPrice || 0) * (quantity || 0);
  const approvedBudget = request.financeApprovedAmount ?? request.estimatedTotalCost;
  const isCostExceeded = finalTotalCost > approvedBudget;
  const exceedDifference = (finalTotalCost - approvedBudget).toFixed(2);

  const handleCreate = () => {
    if (!poNumber.trim()) {
      setValidationError('PO Number is required.');
      return;
    }
    if (!vendor.trim()) {
      setValidationError('Vendor name is required.');
      return;
    }
    if (finalUnitPrice <= 0) {
      setValidationError('Unit price must be greater than zero.');
      return;
    }
    if (quantity < 1) {
      setValidationError('Quantity must be at least 1.');
      return;
    }

    setValidationError('');
    onSubmitPO({
      poNumber: poNumber.trim(),
      vendor: vendor.trim(),
      finalUnitPrice,
      quantity,
      currency,
      orderDate,
      expectedDeliveryDate,
      trackingReference: trackingReference.trim() || undefined,
      purchasingNotes: purchasingNotes.trim() || undefined,
      finalTotalCost
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-po-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md ti-well flex items-center justify-center text-[#1956A6] border border-[#C5C3BC]">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h2 id="create-po-modal-title" className="text-sm font-bold text-[#181A1B] tracking-tight">
                Issue Purchase Order • {request.requestNumber}
              </h2>
              <p className="text-[11px] text-[#686B6D]">
                Generate purchase order and commit hardware procurement to vendor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#686B6D] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Budget Comparison Card */}
          <div className="p-3 rounded-lg bg-[#EFEFEA] border border-[#D8D6CF] space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D]">
              Financial Budget Authorization Comparison
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                <span className="text-[10px] text-[#505457] block">Finance-Approved Budget</span>
                <span className="text-sm font-mono font-bold text-[#0F682C]">
                  {request.currency} {approvedBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-2 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                <span className="text-[10px] text-[#505457] block">Final Purchase Order Total</span>
                <span className={`text-sm font-mono font-bold ${isCostExceeded ? 'text-[#B91C1C]' : 'text-[#181A1B]'}`}>
                  {currency} {finalTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {isCostExceeded && (
              <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <strong className="block">Cost Increase Budget Exceeded (+{currency} {exceedDifference})</strong>
                  <span>
                    Submitting this PO will trigger the system guard and <strong>return this request to Finance Review</strong> for re-authorization.
                  </span>
                </div>
              </div>
            )}
          </div>

          {validationError && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Purchase Order Number <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="text"
                value={poNumber}
                onChange={e => setPoNumber(e.target.value)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Vendor Name <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="text"
                value={vendor}
                onChange={e => setVendor(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Final Unit Price <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={finalUnitPrice}
                onChange={e => setFinalUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Quantity <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Currency
              </label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full h-8 px-2.5 text-xs font-mono bg-[#E8E6E0] border border-[#C5C3BC] rounded text-[#505457] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Order Placement Date <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="date"
                value={orderDate}
                onChange={e => setOrderDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Expected Delivery Date <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={e => setExpectedDeliveryDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#505457] mb-1">
              Carrier Tracking Reference (e.g. UPS / FedEx / DHL)
            </label>
            <input
              type="text"
              value={trackingReference}
              onChange={e => setTrackingReference(e.target.value)}
              placeholder="e.g. 1Z9999999999999999"
              className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#505457] mb-1">
              Purchasing Notes & Terms
            </label>
            <input
              type="text"
              value={purchasingNotes}
              onChange={e => setPurchasingNotes(e.target.value)}
              placeholder="e.g. Net 30 payment terms; delivered to Central Loading Dock B"
              className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#EAE8E2] border-t border-[#D8D6CF] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md ti-btn text-xs text-[#505457] hover:text-[#181A1B] cursor-pointer"
          >
            Cancel
          </button>

          <SkeuoButton
            size="sm"
            variant={isCostExceeded ? 'standard' : 'primary'}
            onClick={handleCreate}
            icon={isCostExceeded ? <RotateCcw className="w-3.5 h-3.5 text-[#B91C1C]" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          >
            {isCostExceeded ? 'Submit PO & Return to Finance' : 'Issue Purchase Order'}
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
};
