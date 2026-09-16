import React, { useState } from 'react';
import { 
  X, 
  Boxes, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Laptop, 
  Monitor, 
  Cpu,
  ArrowRight
} from 'lucide-react';
import { Asset, ProcurementRequest } from '../types';
import { SkeuoButton, LedIndicator } from './SkeuoComponents';

interface ExistingStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProcurementRequest;
  availableAssets: Asset[];
  onConfirmFulfillment: (assetId: string, overrideMismatch: boolean, reason?: string) => void;
}

export const ExistingStockModal: React.FC<ExistingStockModalProps> = ({
  isOpen,
  onClose,
  request,
  availableAssets,
  onConfirmFulfillment
}) => {
  if (!isOpen) return null;

  // Only consider currently available In Stock items
  const inStockAssets = availableAssets.filter(a => a.status === 'In Stock');
  const matchingCategoryAssets = inStockAssets.filter(a => a.category === request.category);
  const otherCategoryAssets = inStockAssets.filter(a => a.category !== request.category);

  const [selectedAssetId, setSelectedAssetId] = useState<string>(
    matchingCategoryAssets[0]?.id || inStockAssets[0]?.id || ''
  );
  const [allowCategoryMismatch, setAllowCategoryMismatch] = useState<boolean>(false);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [validationError, setValidationError] = useState<string>('');

  const selectedAsset = inStockAssets.find(a => a.id === selectedAssetId);
  const isCategoryMismatch = Boolean(selectedAsset && selectedAsset.category !== request.category);

  const handleConfirm = () => {
    if (!selectedAsset) {
      setValidationError('Please select an in-stock asset to fulfill this request.');
      return;
    }

    if (isCategoryMismatch) {
      if (!allowCategoryMismatch) {
        setValidationError(`Selected asset category (${selectedAsset.category}) does not match requested category (${request.category}). Check the explicit override box to proceed.`);
        return;
      }
      if (!overrideReason.trim()) {
        setValidationError('Please provide a written justification for the category override.');
        return;
      }
    }

    setValidationError('');
    onConfirmFulfillment(selectedAsset.id, isCategoryMismatch, overrideReason.trim() || undefined);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stock-fulfill-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md ti-well flex items-center justify-center text-[#0F682C] border border-[#C5C3BC]">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 id="stock-fulfill-modal-title" className="text-sm font-bold text-[#181A1B] tracking-tight">
                Fulfill from Depot Stock • {request.requestNumber}
              </h2>
              <p className="text-[11px] text-[#686B6D]">
                Immediate hardware allocation bypassing Purchasing and Finance queues
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
          {/* Target Request Summary */}
          <div className="p-3 rounded-lg bg-[#EFEFEA] border border-[#D8D6CF] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] block">
                Requested Hardware
              </span>
              <span className="text-xs font-semibold text-[#181A1B]">
                {request.preferredModel} ({request.category})
              </span>
              <span className="text-[11px] text-[#505457] block mt-0.5">
                Assignee: {request.requester.name} • {request.department}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#686B6D] block">
                Required Units
              </span>
              <span className="text-sm font-mono font-bold text-[#181A1B]">
                {request.quantity}x unit(s)
              </span>
            </div>
          </div>

          {validationError && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Compatible In-Stock Assets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#686B6D]">
                Available Compatible Depot Inventory ({matchingCategoryAssets.length} units found)
              </span>
            </div>

            {inStockAssets.length === 0 ? (
              <div className="p-4 rounded border border-dashed border-[#C5C3BC] text-center text-[#686B6D]">
                No depot assets are currently in 'In Stock' status. Procurement through vendor required.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {inStockAssets.map(asset => {
                  const isMatch = asset.category === request.category;
                  const isSelected = selectedAssetId === asset.id;

                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`w-full text-left p-2.5 rounded-md border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected 
                          ? 'border-[#C66A2B] bg-[#C66A2B]/10 ring-1 ring-[#C66A2B]' 
                          : 'border-[#D8D6CF] bg-[#FAF9F5] hover:border-[#737577]'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-[#181A1B]">
                            {asset.assetTag}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#EBF7EE] text-[#0F682C] border border-[#B7E5C3]">
                            {asset.status}
                          </span>
                          {!isMatch && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                              Category Mismatch ({asset.category})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#181A1B] font-medium truncate mt-0.5">
                          {asset.name} • {asset.model}
                        </div>
                        <div className="text-[10px] text-[#686B6D] mt-0.5 truncate">
                          Location: {asset.location} • S/N: {asset.serialNumber}
                        </div>
                      </div>

                      <div className="w-5 h-5 rounded-full border border-[#C5C3BC] flex items-center justify-center shrink-0">
                        {isSelected && <div className="w-3 h-3 rounded-full bg-[#C66A2B]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Mismatch Warning & Override */}
          {isCategoryMismatch && (
            <div className="p-3 rounded-lg bg-[#FFFBEB] border border-[#FDE68A] space-y-2 text-xs">
              <div className="flex items-start gap-2 text-[#92400E]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Category Mismatch Warning</span>
                  <span>
                    You selected a <strong>{selectedAsset?.category}</strong>, but the request is for a <strong>{request.category}</strong>.
                  </span>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#181A1B] cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={allowCategoryMismatch}
                  onChange={e => setAllowCategoryMismatch(e.target.checked)}
                  className="rounded border-[#C5C3BC] text-[#C66A2B] focus:ring-[#C66A2B]"
                />
                <span className="font-medium">Authorize explicit category mismatch fulfillment</span>
              </label>

              {allowCategoryMismatch && (
                <div>
                  <label className="block text-[11px] font-medium text-[#505457] mb-1">
                    Override Justification Reason <span className="text-[#C66A2B]">*</span>
                  </label>
                  <input
                    type="text"
                    value={overrideReason}
                    onChange={e => setOverrideReason(e.target.value)}
                    placeholder="Explain technical rationale for fulfilling an alternate equipment category."
                    className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}
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
            disabled={inStockAssets.length === 0}
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Confirm Allocation & Fulfill
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
};
