import React from 'react';
import { soundFx } from '../services/audioService';

interface ScrewHeadProps {
  rotation?: number;
  size?: 'sm' | 'md';
}

/**
 * Restrained chassis screw mount for hardware label plates and physical plates only.
 * Not used on standard interface cards.
 */
export const ScrewHead: React.FC<ScrewHeadProps> = ({ rotation = 45, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  return (
    <div 
      className={`${dim} rounded-full bg-[#272d38] border border-[#1b2029] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2),0_1px_1px_rgba(0,0,0,0.6)] relative flex items-center justify-center pointer-events-none select-none`}
      aria-hidden="true"
    >
      <div 
        className="w-[60%] h-[1px] bg-[#11141a]"
        style={{ transform: `rotate(${rotation}deg)` }}
      />
    </div>
  );
};

interface LedIndicatorProps {
  color: 'green' | 'amber' | 'red' | 'blue';
  pulse?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Calibrated Instrument Status LED
 * Calm, physically plausible luminescence with subtle housing bezel.
 */
export const LedIndicator: React.FC<LedIndicatorProps> = ({ color, pulse = false, label, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  const colorClasses = {
    green: 'led-indicator-green',
    amber: 'led-indicator-amber',
    red: 'led-indicator-red',
    blue: 'led-indicator-blue'
  };

  return (
    <div className="flex items-center gap-1.5 select-none" role="status" aria-label={label || `${color} status indicator`}>
      <div className="p-0.5 rounded-full led-housing-precision flex items-center justify-center">
        <div 
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}
        />
      </div>
      {label && (
        <span className="text-[11px] font-sans font-medium tracking-wide text-slate-300">
          {label}
        </span>
      )}
    </div>
  );
};

interface SkeuoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'accent' | 'primary' | 'emerald' | 'danger' | 'recessed' | 'subtle';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  activeState?: boolean;
}

/**
 * Tactile Precision Push-Button
 * 120ms transitions, 1px depression on click, clear WCAG focus ring.
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
    sm: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
    md: 'px-3.5 py-2 text-xs font-medium gap-2 min-h-[36px]',
    lg: 'px-4 py-2.5 text-sm font-medium gap-2 min-h-[40px]'
  };

  const variantStyles = {
    standard: 'instrument-btn text-slate-200 hover:text-white',
    accent: 'instrument-btn-primary font-semibold',
    primary: 'instrument-btn-primary font-semibold',
    emerald: 'instrument-btn-emerald font-semibold',
    danger: 'bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-200 active:translate-y-[1px] focus-visible:ring-red-500 shadow-sm',
    recessed: 'instrument-well text-slate-300 hover:text-slate-100 border border-white/[0.06] hover:border-white/[0.12] active:translate-y-[1px]',
    subtle: 'bg-transparent hover:bg-white/[0.05] text-slate-300 hover:text-slate-100 border border-transparent active:translate-y-[1px]'
  };

  const activeStyle = activeState 
    ? 'bg-[#1e2736] border-blue-500/70 text-blue-200 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] font-semibold' 
    : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center rounded-lg cursor-pointer select-none font-sans transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none ${sizeStyles[size]} ${variantStyles[variant]} ${activeStyle} ${className}`}
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
  color?: 'sky' | 'emerald' | 'amber' | 'red';
}

/**
 * Calibrated Instrument Readout
 * Matte recessed display bezel with crisp typography and subtle luminescence.
 */
export const SegmentedDisplay: React.FC<SegmentedDisplayProps> = ({ 
  value, 
  label, 
  unit, 
  color = 'sky' 
}) => {
  const colorMap = {
    sky: 'text-blue-400 border-blue-500/20',
    emerald: 'text-emerald-400 border-emerald-500/20',
    amber: 'text-amber-400 border-amber-500/20',
    red: 'text-rose-400 border-rose-500/20'
  };

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[11px] font-sans uppercase tracking-wider text-slate-400 mb-1.5 font-medium">
          {label}
        </span>
      )}
      <div className={`instrument-readout px-3 py-2 rounded-lg flex items-baseline justify-between gap-2 border ${colorMap[color]}`}>
        <span className="text-xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {unit && (
          <span className="text-[11px] text-slate-400 font-sans tracking-normal">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Status Badge for Asset Statuses and Jira Priorities
 */
export const StatusBadge: React.FC<{
  status: string;
  type?: 'status' | 'priority' | 'category';
}> = ({ status, type = 'status' }) => {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
  let dotColor: 'green' | 'amber' | 'red' | 'blue' = 'blue';

  if (status === 'In Stock') {
    badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
    dotColor = 'green';
  } else if (status === 'In Use') {
    badgeStyle = 'bg-blue-950/60 text-blue-300 border-blue-800/40';
    dotColor = 'blue';
  } else if (status === 'Maintenance') {
    badgeStyle = 'bg-amber-950/60 text-amber-300 border-amber-800/40';
    dotColor = 'amber';
  } else if (status === 'Highest' || status === 'High') {
    badgeStyle = 'bg-rose-950/60 text-rose-300 border-rose-800/40';
    dotColor = 'red';
  } else if (status === 'Fulfilled') {
    badgeStyle = 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40';
    dotColor = 'green';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-sans font-medium border ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        dotColor === 'green' ? 'bg-emerald-400' :
        dotColor === 'amber' ? 'bg-amber-400' :
        dotColor === 'red' ? 'bg-rose-400' : 'bg-blue-400'
      }`} />
      <span>{status}</span>
    </span>
  );
};
