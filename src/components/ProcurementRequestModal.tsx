import React, { useState } from 'react';
import { 
  X, 
  FileCheck2, 
  AlertCircle, 
  Save, 
  Send,
  DollarSign,
  Calendar,
  Layers,
  Building,
  User,
  CheckCircle2
} from 'lucide-react';
import { 
  ProcurementRequest, 
  AssetCategory, 
  ProcurementUrgency, 
  ProcurementRequestType,
  SimulatedUserRole 
} from '../types';
import { SkeuoButton } from './SkeuoComponents';
import { generateUniqueProcurementNumber } from '../utils/idGenerator';
import { validateSubmission, transitionRequest } from '../services/procurementService';

interface ProcurementRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SimulatedUserRole;
  existingRequests: ProcurementRequest[];
  initialData?: Partial<ProcurementRequest>;
  onSaveDraft: (request: ProcurementRequest) => void;
  onSubmitRequest: (request: ProcurementRequest) => void;
}

export const ProcurementRequestModal: React.FC<ProcurementRequestModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  existingRequests,
  initialData,
  onSaveDraft,
  onSubmitRequest
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(initialData?.id);
  const requestNumber = initialData?.requestNumber || generateUniqueProcurementNumber(existingRequests);

  const [department, setDepartment] = useState(initialData?.department || currentUser.department || 'Engineering');
  const [manager, setManager] = useState(initialData?.manager || 'Sarah Lin (Director of Platform)');
  const [costCentre, setCostCentre] = useState(initialData?.costCentre || 'CC-ENG-4402');
  const [category, setCategory] = useState<AssetCategory>(initialData?.category || 'Laptop');
  const [preferredModel, setPreferredModel] = useState(initialData?.preferredModel || '');
  const [quantity, setQuantity] = useState<number>(initialData?.quantity || 1);
  const [businessJustification, setBusinessJustification] = useState(initialData?.businessJustification || '');
  const [requestType, setRequestType] = useState<ProcurementRequestType>(initialData?.requestType || 'New Equipment');
  const [requiredByDate, setRequiredByDate] = useState(
    initialData?.requiredByDate || 
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [urgency, setUrgency] = useState<ProcurementUrgency>(initialData?.urgency || 'Standard');
  const [estimatedUnitPrice, setEstimatedUnitPrice] = useState<number>(initialData?.estimatedUnitPrice || 1899);
  const [currency, setCurrency] = useState(initialData?.currency || 'USD');
  const [preferredVendor, setPreferredVendor] = useState(initialData?.preferredVendor || 'Apple Enterprise Direct');
  const [vendorQuoteReference, setVendorQuoteReference] = useState(initialData?.vendorQuoteReference || '');
  const [replacementAssetTag, setReplacementAssetTag] = useState(initialData?.replacementAssetTag || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const estimatedTotalCost = Math.max(0, (estimatedUnitPrice || 0) * (quantity || 0));

  const buildRequestObject = (status: 'Draft' | 'IT Head Review'): ProcurementRequest => {
    const now = new Date().toISOString();
    return {
      id: initialData?.id || `pr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestNumber,
      status,
      requester: initialData?.requester || {
        name: currentUser.name,
        email: currentUser.email,
        department: department || currentUser.department
      },
      department,
      manager,
      costCentre,
      category,
      preferredModel,
      quantity,
      businessJustification,
      requestType,
      requiredByDate,
      urgency,
      estimatedUnitPrice,
      currency,
      estimatedTotalCost,
      preferredVendor,
      vendorQuoteReference: vendorQuoteReference.trim() || undefined,
      replacementAssetTag: requestType === 'Replacement' ? replacementAssetTag.trim() || undefined : undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      createdAt: initialData?.createdAt || now,
      updatedAt: now,
      approvals: initialData?.approvals || [],
      receipts: initialData?.receipts || [],
      totalReceivedQuantity: initialData?.totalReceivedQuantity || 0,
      registeredAssetTags: initialData?.registeredAssetTags || [],
      fulfilledAssetTags: initialData?.fulfilledAssetTags || [],
      auditLogs: initialData?.auditLogs && initialData.auditLogs.length > 0 ? initialData.auditLogs : [
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: currentUser.name,
          role: currentUser.badge,
          requestNumber,
          action: 'Draft Created',
          previousState: 'None',
          newState: 'Draft',
          notes: 'Unfinished draft saved.'
        }
      ]
    };
  };

  const handleSaveDraftClick = () => {
    const draft = buildRequestObject('Draft');
    onSaveDraft(draft);
    onClose();
  };

  const handleSubmitClick = () => {
    // 1. Every newly created request begins as Draft
    const draft = buildRequestObject('Draft');

    // 4. Failed validation or authorization leaves the request as Draft in storage
    onSaveDraft(draft);

    // Check submission validity using transitionRequest engine
    const action = (initialData?.status === 'Changes Requested') ? 'RESUBMIT' : 'SUBMIT';
    const transitionResult = transitionRequest(draft, action, currentUser);

    if (!transitionResult.success) {
      setValidationErrors([transitionResult.error || 'Submission authorization failed. Request remains saved as Draft.']);
      return;
    }

    setValidationErrors([]);
    // 3. Only the transition engine can move it to IT Head Review
    onSubmitRequest(transitionResult.updatedRequest!);
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="procurement-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-[#181A1B]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md ti-well flex items-center justify-center text-[#C66A2B] border border-[#C5C3BC]">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div>
              <h2 id="procurement-modal-title" className="text-sm font-bold text-[#181A1B] tracking-tight">
                {isEditing ? `Edit Procurement Request • ${requestNumber}` : `New Procurement Request • ${requestNumber}`}
              </h2>
              <p className="text-[11px] text-[#686B6D]">
                Guarded hardware acquisition workflow with dual IT & Finance authorization
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#686B6D] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer"
            aria-label="Close procurement request modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Errors Notice */}
        {validationErrors.length > 0 && (
          <div className="px-5 py-2.5 bg-[#FDF2F2] border-b border-[#F87171] text-[#B91C1C] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Please resolve the following before submission:</strong>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Form Body - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Section 1: Organizational & Financial Identity */}
          <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
              <Building className="w-3 h-3 text-[#C66A2B]" />
              <span>1. Organizational Cost Attribution</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Requester
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.name} (${currentUser.badge})`}
                  className="w-full h-8 px-2.5 text-xs bg-[#E8E6E0] border border-[#C5C3BC] rounded text-[#505457] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Department <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Engineering"
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Approving Manager <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="text"
                  value={manager}
                  onChange={e => setManager(e.target.value)}
                  placeholder="e.g. Sarah Lin"
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Cost Centre <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="text"
                  value={costCentre}
                  onChange={e => setCostCentre(e.target.value)}
                  placeholder="e.g. CC-ENG-4402"
                  className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Request Type <span className="text-[#C66A2B]">*</span>
                </label>
                <select
                  value={requestType}
                  onChange={e => setRequestType(e.target.value as ProcurementRequestType)}
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                >
                  <option value="New Equipment">New Equipment (Allocation)</option>
                  <option value="Replacement">Replacement (Defect / Cycle)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Urgency Level <span className="text-[#C66A2B]">*</span>
                </label>
                <select
                  value={urgency}
                  onChange={e => setUrgency(e.target.value as ProcurementUrgency)}
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                >
                  <option value="Standard">Standard (10-15 business days)</option>
                  <option value="Urgent">Urgent (5-7 business days)</option>
                  <option value="Critical">Critical (Immediate SLA)</option>
                </select>
              </div>
            </div>

            {requestType === 'Replacement' && (
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Replacement Asset Tag (Asset being decommissioned or swapped)
                </label>
                <input
                  type="text"
                  value={replacementAssetTag}
                  onChange={e => setReplacementAssetTag(e.target.value)}
                  placeholder="e.g. AST-8835"
                  className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>
            )}
          </div>

          {/* Section 2: Hardware Specification & Quantities */}
          <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
              <Layers className="w-3 h-3 text-[#2C6E9B]" />
              <span>2. Equipment Specification & Logistics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Category <span className="text-[#C66A2B]">*</span>
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as AssetCategory)}
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden font-medium"
                >
                  <option value="Laptop">Laptop Workstation</option>
                  <option value="Display">Display / Monitor</option>
                  <option value="Dock">Thunderbolt / USB-C Dock</option>
                  <option value="Keyboard">Keyboard</option>
                  <option value="Mouse">Mouse / Trackpad</option>
                  <option value="Audio/Headset">Audio / Headset</option>
                  <option value="Other">Other Auxiliary Equipment</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Preferred Model or Technical Specification <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="text"
                  value={preferredModel}
                  onChange={e => setPreferredModel(e.target.value)}
                  placeholder="e.g. MacBook Pro 16&quot; M3 Max, 64GB RAM, 2TB SSD"
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Quantity Required <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full h-8 px-2.5 text-xs font-mono font-bold bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Required-By Date <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="date"
                  value={requiredByDate}
                  onChange={e => setRequiredByDate(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Preferred Sourcing Vendor <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="text"
                  value={preferredVendor}
                  onChange={e => setPreferredVendor(e.target.value)}
                  placeholder="e.g. Apple Enterprise Direct"
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Business Justification & Mission Impact <span className="text-[#C66A2B]">*</span>
              </label>
              <textarea
                rows={2}
                value={businessJustification}
                onChange={e => setBusinessJustification(e.target.value)}
                placeholder="Explain why this equipment is required, who will use it, and the operational outcome."
                className="w-full p-2 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Section 3: Financial Pricing & Dynamic Calculator */}
          <div className="p-3 rounded-lg ti-well border border-[#D8D6CF] space-y-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#686B6D] flex items-center gap-1.5">
              <DollarSign className="w-3 h-3 text-[#0F682C]" />
              <span>3. Financial Estimation & Quotation</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Estimated Unit Price <span className="text-[#C66A2B]">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={estimatedUnitPrice}
                  onChange={e => setEstimatedUnitPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Currency <span className="text-[#C66A2B]">*</span>
                </label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden font-mono font-bold"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#505457] mb-1">
                  Vendor Quote Reference (Optional)
                </label>
                <input
                  type="text"
                  value={vendorQuoteReference}
                  onChange={e => setVendorQuoteReference(e.target.value)}
                  placeholder="e.g. QUOTE-2026-992"
                  className="w-full h-8 px-2.5 text-xs font-mono bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Dynamic Total Cost Box */}
            <div className="p-2.5 bg-[#EAE8E2] rounded border border-[#C5C3BC] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#505457] block">
                  Computed Estimated Total Commitment:
                </span>
                <span className="text-[10px] text-[#686B6D]">
                  {quantity} unit(s) × {currency} {estimatedUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="text-base font-mono font-bold text-[#181A1B] px-2.5 py-1 bg-[#FAF9F5] rounded border border-[#C5C3BC]">
                {currency} {estimatedTotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[#505457] mb-1">
                Additional Technical or Packaging Notes (Optional)
              </label>
              <input
                type="text"
                value={additionalNotes}
                onChange={e => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Include UK power adapters; bulk packaging preferred"
                className="w-full h-8 px-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-3 bg-[#EAE8E2] border-t border-[#D8D6CF] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md ti-btn text-xs text-[#505457] hover:text-[#181A1B] cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <SkeuoButton
              size="sm"
              variant="standard"
              onClick={handleSaveDraftClick}
              icon={<Save className="w-3.5 h-3.5 text-[#505457]" />}
            >
              Save as Draft
            </SkeuoButton>

            <SkeuoButton
              size="sm"
              variant="primary"
              onClick={handleSubmitClick}
              icon={<Send className="w-3.5 h-3.5" />}
            >
              Submit for Review
            </SkeuoButton>
          </div>
        </div>
      </div>
    </div>
  );
};
