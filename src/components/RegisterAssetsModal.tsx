import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Barcode, 
  Laptop, 
  Monitor, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle,
  Plus
} from 'lucide-react';
import { Asset, ProcurementRequest, SimulatedUserRole } from '../types';
import { SkeuoButton } from './SkeuoComponents';
import { generateUniqueAssetTag, generateUniqueBarcode } from '../utils/idGenerator';

interface RegisterAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
  existingAssets: Asset[];
  currentUser: SimulatedUserRole;
  onConfirmRegistration: (newAssets: Asset[]) => void;
}

interface ItemDraft {
  serialNumber: string;
  assetTag: string;
  barcode: string;
  location: string;
  assignImmediately: boolean;
}

export const RegisterAssetsModal: React.FC<RegisterAssetsModalProps> = ({
  isOpen,
  onClose,
  request,
  existingAssets,
  currentUser,
  onConfirmRegistration
}) => {
  if (!isOpen) return null;

  const countToRegister = request.totalReceivedQuantity || request.quantity || 1;

  // Initialize draft items with auto-generated tags and barcodes
  const [items, setItems] = useState<ItemDraft[]>(() => {
    const list: ItemDraft[] = [];
    const tempExisting = [...existingAssets];

    for (let i = 0; i < countToRegister; i++) {
      const tag = generateUniqueAssetTag(tempExisting);
      const code = generateUniqueBarcode(tempExisting);
      tempExisting.push({
        id: `temp-${i}`,
        assetTag: tag,
        barcode: code,
        name: request.preferredModel,
        category: request.category,
        model: request.preferredModel,
        serialNumber: `SN-${Date.now().toString().slice(-5)}-${i + 1}`,
        status: 'In Stock',
        location: 'Depot Main Rack A1',
        lastAuditDate: new Date().toISOString().slice(0, 10),
        specs: {}
      });

      list.push({
        serialNumber: `SN-${Date.now().toString().slice(-6)}-${i + 1}`,
        assetTag: tag,
        barcode: code,
        location: 'Depot Main Rack A1',
        assignImmediately: true
      });
    }
    return list;
  });

  const [validationError, setValidationError] = useState('');

  const updateItem = (index: number, field: keyof ItemDraft, value: any) => {
    setItems(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRegister = () => {
    // Validate that serial numbers and tags are filled
    for (let i = 0; i < items.length; i++) {
      if (!items[i].serialNumber.trim()) {
        setValidationError(`Unit #${i + 1} serial number cannot be empty.`);
        return;
      }
      if (!items[i].assetTag.trim()) {
        setValidationError(`Unit #${i + 1} asset tag cannot be empty.`);
        return;
      }
    }

    setValidationError('');
    const now = new Date().toISOString().slice(0, 10);

    const createdAssets: Asset[] = items.map((item, idx) => ({
      id: `ast-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
      assetTag: item.assetTag.trim(),
      barcode: item.barcode.trim(),
      name: `${request.preferredModel} (PR #${request.requestNumber})`,
      category: request.category,
      model: request.preferredModel,
      serialNumber: item.serialNumber.trim(),
      status: item.assignImmediately ? 'In Use' : 'In Stock',
      location: item.location.trim() || 'Depot Main Rack A1',
      assignedTo: item.assignImmediately ? request.requester.name : undefined,
      assignedEmail: item.assignImmediately ? request.requester.email : undefined,
      assignedDepartment: item.assignImmediately ? request.department : undefined,
      procurementRequestId: request.id,
      purchaseOrderNumber: request.purchaseOrder?.poNumber,
      lastAuditDate: now,
      specs: {}
    }));

    onConfirmRegistration(createdAssets);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="register-assets-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md ti-well flex items-center justify-center text-[#0F682C] border border-[#C5C3BC]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 id="register-assets-modal-title" className="text-sm font-bold text-[#181A1B] tracking-tight">
                Register Enrolled Hardware Assets • {request.requestNumber}
              </h2>
              <p className="text-[11px] text-[#686B6D]">
                Enroll delivered physical units into System Assist fleet inventory
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
          <div className="p-3 rounded-lg bg-[#EFEFEA] border border-[#D8D6CF] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] block">
                Equipment Class & Spec
              </span>
              <span className="text-xs font-semibold text-[#181A1B]">
                {request.preferredModel} ({request.category})
              </span>
              <span className="text-[11px] text-[#505457] block mt-0.5">
                Target Requester: {request.requester.name} • {request.department}
              </span>
            </div>
            <div className="text-right font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-[#686B6D] block">PO Reference</span>
              <span className="font-bold text-[#1956A6]">{request.purchaseOrder?.poNumber || 'N/A'}</span>
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#686B6D] block">
              Asset Identity Assignment ({items.length} unit(s) to register)
            </span>

            {items.map((item, index) => (
              <div key={index} className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-2.5">
                <div className="flex items-center justify-between border-b border-[#D8D6CF] pb-1.5">
                  <span className="font-bold text-[#181A1B] text-xs">
                    Unit #{index + 1}
                  </span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={item.assignImmediately}
                      onChange={e => updateItem(index, 'assignImmediately', e.target.checked)}
                      className="rounded border-[#C5C3BC] text-[#0F682C] focus:ring-[#0F682C]"
                    />
                    <span className="font-medium text-[#181A1B]">Deploy immediately to {request.requester.name}</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-[#505457] mb-0.5">
                      Serial Number <span className="text-[#C66A2B]">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.serialNumber}
                      onChange={e => updateItem(index, 'serialNumber', e.target.value)}
                      className="w-full h-7 px-2 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-[#505457] mb-0.5">
                      Asset Tag (AST) <span className="text-[#C66A2B]">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.assetTag}
                      onChange={e => updateItem(index, 'assetTag', e.target.value)}
                      className="w-full h-7 px-2 text-xs font-mono font-bold bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-[#505457] mb-0.5">
                      Barcode Identifier <span className="text-[#C66A2B]">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.barcode}
                      onChange={e => updateItem(index, 'barcode', e.target.value)}
                      className="w-full h-7 px-2 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-[#505457] mb-0.5">
                    Storage / Deployment Location
                  </label>
                  <input
                    type="text"
                    value={item.location}
                    onChange={e => updateItem(index, 'location', e.target.value)}
                    className="w-full h-7 px-2 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                  />
                </div>
              </div>
            ))}
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
            onClick={handleRegister}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Commit to Fleet Inventory & Fulfill
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
};
