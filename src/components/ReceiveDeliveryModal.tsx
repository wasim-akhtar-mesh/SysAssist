import React, { useState } from 'react';
import { 
  X, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar,
  User,
  Truck
} from 'lucide-react';
import { ProcurementRequest, DeliveryReceipt, SimulatedUserRole } from '../types';
import { SkeuoButton } from './SkeuoComponents';

interface ReceiveDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
  currentUser: SimulatedUserRole;
  onConfirmReceipt: (receipt: DeliveryReceipt) => void;
}

export const ReceiveDeliveryModal: React.FC<ReceiveDeliveryModalProps> = ({
  isOpen,
  onClose,
  request,
  currentUser,
  onConfirmReceipt
}) => {
  if (!isOpen) return null;

  const totalOrdered = request.purchaseOrder?.quantity ?? request.quantity;
  const alreadyReceived = request.totalReceivedQuantity || 0;
  const remainingExpected = Math.max(1, totalOrdered - alreadyReceived);

  const [quantityReceived, setQuantityReceived] = useState<number>(remainingExpected);
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().slice(0, 10));
  const [receiver, setReceiver] = useState(`${currentUser.name} (${currentUser.badge})`);
  const [deliveryReference, setDeliveryReference] = useState(`PS-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState('Hardware package inspected: undamaged factory seals intact.');
  const [validationError, setValidationError] = useState('');

  const willBeFullyReceived = alreadyReceived + quantityReceived >= totalOrdered;

  const handleConfirm = () => {
    if (alreadyReceived >= totalOrdered) {
      setValidationError('The full ordered quantity has already been received.');
      return;
    }
    if (quantityReceived <= 0) {
      setValidationError('Quantity received must be at least 1.');
      return;
    }
    if (quantityReceived > (totalOrdered - alreadyReceived)) {
      setValidationError(`Receipt quantity (${quantityReceived}) exceeds remaining expected quantity (${totalOrdered - alreadyReceived}).`);
      return;
    }
    if (!deliveryReference.trim()) {
      setValidationError('Packing slip or carrier delivery reference is required.');
      return;
    }

    setValidationError('');
    const receipt: DeliveryReceipt = {
      id: `rcpt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      quantityReceived,
      receiptDate,
      receiver,
      deliveryReference: deliveryReference.trim(),
      notes: notes.trim() || undefined
    };

    onConfirmReceipt(receipt);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receive-delivery-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md ti-well flex items-center justify-center text-[#2C6E9B] border border-[#C5C3BC]">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h2 id="receive-delivery-modal-title" className="text-sm font-bold text-[#181A1B] tracking-tight">
                Record Delivery Receipt • {request.requestNumber}
              </h2>
              <p className="text-[11px] text-[#686B6D]">
                Log incoming physical equipment delivery into IT logistics depot
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

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Order Progress Status */}
          <div className="p-3 rounded-lg bg-[#EFEFEA] border border-[#D8D6CF] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#686B6D]">
                Purchase Order Progress
              </span>
              <span className="font-mono text-xs font-semibold text-[#181A1B]">
                PO: {request.purchaseOrder?.poNumber || 'N/A'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                <span className="text-[10px] text-[#686B6D] block">Total Ordered</span>
                <span className="text-sm font-mono font-bold text-[#181A1B]">{totalOrdered}</span>
              </div>
              <div className="p-2 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                <span className="text-[10px] text-[#686B6D] block">Already Received</span>
                <span className="text-sm font-mono font-bold text-[#0F682C]">{alreadyReceived}</span>
              </div>
              <div className="p-2 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                <span className="text-[10px] text-[#686B6D] block">Remaining</span>
                <span className="text-sm font-mono font-bold text-[#C66A2B]">{remainingExpected}</span>
              </div>
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Units Received in This Delivery <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantityReceived}
                onChange={e => setQuantityReceived(parseInt(e.target.value, 10) || 0)}
                className="w-full h-8 px-2.5 text-xs font-mono font-bold bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Receipt Date <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="date"
                value={receiptDate}
                onChange={e => setReceiptDate(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Receiver (Custodian) <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="text"
                value={receiver}
                onChange={e => setReceiver(e.target.value)}
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Packing Slip / Slip Reference <span className="text-[#C66A2B]">*</span>
              </label>
              <input
                type="text"
                value={deliveryReference}
                onChange={e => setDeliveryReference(e.target.value)}
                placeholder="e.g. PS-884019"
                className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[#505457] mb-1">
              Receipt Inspection Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Inspected on bench; packaging intact."
              className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
            />
          </div>

          {/* Delivery Status Result Banner */}
          <div className={`p-2.5 rounded border text-xs flex items-center gap-2 ${
            willBeFullyReceived 
              ? 'bg-[#EBF7EE] border-[#B7E5C3] text-[#0F682C]' 
              : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              {willBeFullyReceived 
                ? 'Delivery complete: All ordered units received. Ready for hardware asset registration.'
                : `Partial delivery recorded: ${alreadyReceived + quantityReceived} of ${totalOrdered} units received. Order will remain open.`}
            </span>
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
            variant="primary"
            onClick={handleConfirm}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Confirm Delivery Receipt
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
};
