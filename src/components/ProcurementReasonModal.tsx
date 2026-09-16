import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw, XCircle, Send } from 'lucide-react';
import { SkeuoButton } from './SkeuoComponents';

interface ProcurementReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'reject' | 'changes_requested';
  requestNumber: string;
  onSubmit: (reason: string) => void;
}

export const ProcurementReasonModal: React.FC<ProcurementReasonModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  actionLabel,
  actionType,
  requestNumber,
  onSubmit
}) => {
  if (!isOpen) return null;

  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('A written reason is strictly required by the audit guard.');
      return;
    }
    setError('');
    onSubmit(reason.trim());
    onClose();
  };

  const isReject = actionType === 'reject';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reason-modal-title"
    >
      <div className="bg-[#FAF9F5] border border-[#C5C3BC] rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-[#181A1B]">
        <div className="px-5 py-3.5 bg-[#EAE8E2] border-b border-[#D8D6CF] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-md ti-well flex items-center justify-center border border-[#C5C3BC] ${
              isReject ? 'text-[#B91C1C]' : 'text-[#D97706]'
            }`}>
              {isReject ? <XCircle className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
            </div>
            <div>
              <h2 id="reason-modal-title" className="text-sm font-bold text-[#181A1B]">
                {title} • {requestNumber}
              </h2>
              <p className="text-[11px] text-[#686B6D]">{description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-[#686B6D] hover:text-[#181A1B] hover:bg-[#DFDDD6] cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-xs">
          {error && (
            <div className="p-2.5 rounded bg-[#FDF2F2] border border-[#F87171] text-[#B91C1C] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-[#505457] mb-1">
              Required Review Reason / Justification <span className="text-[#C66A2B]">*</span>
            </label>
            <textarea
              rows={4}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={isReject 
                ? 'State the organizational, technical, or budgetary grounds for rejecting this request.' 
                : 'Detail the modifications or missing information required before this request can be approved.'
              }
              className="w-full p-2.5 text-xs bg-[#FAF9F5] border border-[#C5C3BC] rounded text-[#181A1B] focus:border-[#C66A2B] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-[#EAE8E2] border-t border-[#D8D6CF] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md ti-btn text-xs text-[#505457] hover:text-[#181A1B] cursor-pointer"
          >
            Cancel
          </button>

          <SkeuoButton
            size="sm"
            variant={isReject ? 'standard' : 'primary'}
            onClick={handleSubmit}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            {actionLabel}
          </SkeuoButton>
        </div>
      </div>
    </div>
  );
};
