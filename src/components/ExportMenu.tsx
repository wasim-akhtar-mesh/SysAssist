import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Check, AlertCircle } from 'lucide-react';
import { SkeuoButton } from './SkeuoComponents';

export interface ExportOption {
  id: string;
  label: string;
  count: number;
  disabled?: boolean;
  disabledReason?: string;
  onExport: () => { success: boolean; count: number; error?: string };
}

interface ExportMenuProps {
  options: ExportOption[];
  buttonSize?: 'sm' | 'md';
  variant?: 'standard' | 'primary' | 'ghost';
  label?: string;
  className?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  options,
  buttonSize = 'sm',
  variant = 'standard',
  label = 'Export',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation (Escape to close)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleExecuteExport = (opt: ExportOption) => {
    if (opt.disabled || opt.count === 0) return;

    try {
      const res = opt.onExport();
      if (res.success) {
        setStatusAnnouncement(`Successfully exported ${res.count} records for ${opt.label}.`);
        setIsOpen(false);
      } else {
        setStatusAnnouncement(`Export failed: ${res.error || 'Unknown authorization error.'}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Export failed.';
      setStatusAnnouncement(`Export failed: ${msg}`);
    }
  };

  const allDisabled = options.every(o => o.disabled || o.count === 0);

  return (
    <div 
      className={`relative inline-block text-left ${className}`} 
      ref={containerRef}
      onKeyDown={handleKeyDown}
    >
      {/* Screen-reader live region for announcements without sound */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        role="status"
      >
        {statusAnnouncement}
      </div>

      <SkeuoButton
        size={buttonSize}
        variant={variant}
        onClick={() => setIsOpen(!isOpen)}
        icon={<Download className="w-3.5 h-3.5 text-[#505457]" />}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`${label} menu`}
        className="cursor-pointer"
      >
        <span>{label}</span>
        <ChevronDown className={`w-3 h-3 text-[#707375] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </SkeuoButton>

      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-72 rounded-lg bg-[#FAF9F5] border border-[#C5C3BC] shadow-xl py-1 z-30 divide-y divide-[#EAE8E2] text-xs animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-1.5 bg-[#F0EFEA] text-[10px] font-mono uppercase tracking-wider text-[#686B6D] flex items-center justify-between">
            <span>Export Data (CSV)</span>
            <span className="text-[#2C6E9B]">RFC 4180 / UTF-8</span>
          </div>

          <div className="py-1">
            {options.map((opt) => {
              const isDisabled = opt.disabled || opt.count === 0;

              return (
                <div key={opt.id} className="relative group">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={isDisabled}
                    onClick={() => handleExecuteExport(opt)}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between gap-2 transition-colors ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed bg-[#F6F5F0]' 
                        : 'hover:bg-[#EAE8E2] text-[#181A1B] cursor-pointer'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-medium text-[#181A1B] truncate">{opt.label}</span>
                      {isDisabled && opt.disabledReason && (
                        <span className="text-[10px] text-[#B91C1C] flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{opt.disabledReason}</span>
                        </span>
                      )}
                      {isDisabled && opt.count === 0 && !opt.disabledReason && (
                        <span className="text-[10px] text-[#707375] mt-0.5">
                          0 matching records
                        </span>
                      )}
                    </div>

                    <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded shrink-0 border ${
                      isDisabled 
                        ? 'bg-[#E5E3DD] text-[#8C8F91] border-[#D8D6CF]' 
                        : 'bg-[#E2EFF7] text-[#1E5275] border-[#B2D8EE]'
                    }`}>
                      {opt.count} {opt.count === 1 ? 'record' : 'records'}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-1.5 bg-[#F6F5F0] text-[9.5px] text-[#707375] flex items-center justify-between">
            <span>Includes Excel formula protection</span>
            <span className="text-[#15803D] font-medium">BOM Encoded</span>
          </div>
        </div>
      )}
    </div>
  );
};
