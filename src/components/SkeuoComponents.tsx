import React from 'react';
import { soundFx } from '../services/audioService';

interface LedIndicatorProps {
  color: 'green' | 'amber' | 'red' | 'blue';
  pulse?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Calibrated Instrument Status LED
 * Calm, physically plausible luminescence with recessed housing bezel.
 * Green, amber, and red strictly indicate actual operational states.
 */
export const LedIndicator: React.FC<LedIndicatorProps> = ({ 
  color, 
  pulse = false, 
  label, 
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const colorClasses = {
    green: 'ti-led-green',
    amber: 'ti-led-amber',
    red: 'ti-led-red',
    blue: 'ti-led-blue'
  };

  return (
    <div className={`flex items-center gap-1.5 select-none ${className}`} role="status" aria-label={label || `${color} status indicator`}>
      <div className="p-0.5 rounded-full ti-led-housing flex items-center justify-center">
        <div 
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}
        />
      </div>
      {label && (
        <span className="text-[11px] font-sans font-medium text-[#505457]">
          {label}
        </span>
      )}
    </div>
  );
};

interface SkeuoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'accent' | 'primary' | 'danger' | 'recessed' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  activeState?: boolean;
}

/**
 * Tactile Machined Push-Button (Titanium & Ink)
 * Satin finish with subtle top highlight and soft lower shadow.
 * 1px depression on click, steel blue focus ring.
 */
export const SkeuoButton: React.FC<SkeuoButtonProps> = ({
  children,
  variant = 'standard',
  size = 'md',
  icon,
  activeState = false,
  className = '',
  onClick,
  disabled,
  ...rest
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      soundFx.playMechanicalClick();
      onClick?.(e);
    }
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[30px]',
    md: 'px-3.5 py-2 text-xs font-medium gap-2 min-h-[34px]',
    lg: 'px-4 py-2.5 text-sm font-medium gap-2 min-h-[38px]'
  };

  const variantStyles = {
    standard: 'ti-btn text-[#181A1B] hover:text-[#000000]',
    accent: 'ti-btn-accent',
    primary: 'ti-btn-accent',
    danger: 'bg-[#982B2B] hover:bg-[#832222] border border-[#711A1A] text-white active:translate-y-[1px] shadow-xs',
    recessed: 'ti-well text-[#181A1B] hover:border-[#B5B3AA] active:translate-y-[1px]',
    subtle: 'bg-transparent hover:bg-black/[0.04] text-[#505457] hover:text-[#181A1B] border border-transparent active:translate-y-[1px]'
  };

  const activeStyle = activeState 
    ? 'bg-[#E2E0D8] border-[#A9A79D] text-[#181A1B] shadow-[inset_0_1.5px_3px_rgba(24,26,27,0.14)] font-semibold' 
    : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-md cursor-pointer select-none font-sans transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-[#2C6E9B] focus-visible:outline-offset-1 ${sizeStyles[size]} ${variantStyles[variant]} ${activeStyle} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span className="truncate">{children}</span>}
    </button>
  );
};

interface SegmentedDisplayProps {
  value: string | number;
  label?: string;
  unit?: string;
  color?: 'neutral' | 'emerald' | 'amber' | 'red' | 'blue';
}

/**
 * Calibrated Instrument Readout
 * Recessed telemetry display with crisp high-contrast typography.
 */
export const SegmentedDisplay: React.FC<SegmentedDisplayProps> = ({ 
  value, 
  label, 
  unit, 
  color = 'neutral' 
}) => {
  const accentBorder = {
    neutral: 'border-[#C8C6BD]',
    emerald: 'border-[#10B981]/40',
    amber: 'border-[#D97706]/40',
    red: 'border-[#DC2626]/40',
    blue: 'border-[#2563EB]/40'
  };

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[11px] font-sans uppercase tracking-wider text-[#686B6D] mb-1 font-medium">
          {label}
        </span>
      )}
      <div className={`ti-readout px-3 py-1.5 rounded-md flex items-baseline justify-between gap-2 border ${accentBorder[color]}`}>
        <span className="text-lg sm:text-xl font-bold font-mono tracking-tight text-[#181A1B]">
          {value}
        </span>
        {unit && (
          <span className="text-[11px] text-[#686B6D] font-sans tracking-normal">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Status Badge for Asset Statuses and Jira Priorities
 * Strictly light-theme compliant with high contrast.
 */
export const StatusBadge: React.FC<{
  status: string;
  type?: 'status' | 'priority' | 'category';
  className?: string;
}> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-[#ECEAE4] text-[#47494B] border-[#D4D2CA]';
  let dotColor = 'bg-[#7A7C7E]';

  if (status === 'In Stock') {
    badgeStyle = 'bg-[#EBF7EE] text-[#0F682C] border-[#B7E5C3]';
    dotColor = 'bg-[#10B981]';
  } else if (status === 'In Use') {
    badgeStyle = 'bg-[#EEF4FB] text-[#1956A6] border-[#BCD4F3]';
    dotColor = 'bg-[#2563EB]';
  } else if (status === 'Maintenance') {
    badgeStyle = 'bg-[#FFF8E6] text-[#8C4F00] border-[#FFE299]';
    dotColor = 'bg-[#D97706]';
  } else if (status === 'Highest' || status === 'High') {
    badgeStyle = 'bg-[#FDF0EE] text-[#A81F1A] border-[#F6B8B3]';
    dotColor = 'bg-[#DC2626]';
  } else if (status === 'Medium') {
    badgeStyle = 'bg-[#FFF8E6] text-[#8C4F00] border-[#FFE299]';
    dotColor = 'bg-[#D97706]';
  } else if (status === 'Low') {
    badgeStyle = 'bg-[#ECEAE4] text-[#47494B] border-[#D4D2CA]';
    dotColor = 'bg-[#7A7C7E]';
  } else if (status === 'Fulfilled') {
    badgeStyle = 'bg-[#EBF7EE] text-[#0F682C] border-[#B7E5C3]';
    dotColor = 'bg-[#10B981]';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium border ${badgeStyle} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span className="truncate">{status}</span>
    </span>
  );
};
