import React from 'react';
import { soundFx } from '../services/audioService';

interface ScrewHeadProps {
  rotation?: number;
  size?: 'sm' | 'md';
}

export const ScrewHead: React.FC<ScrewHeadProps> = ({ rotation = 45, size = 'sm' }) => {
  const dim = size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5';
  return (
    <div 
      className={`${dim} rounded-full screw-head relative flex items-center justify-center pointer-events-none select-none`}
      title="Reinforced Chassis Mount"
    >
      <div 
        className="w-[70%] h-[1.5px] bg-[#0f1217] rounded-xs shadow-[0_0.5px_0_rgba(255,255,255,0.2)]"
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

export const LedIndicator: React.FC<LedIndicatorProps> = ({ color, pulse = false, label, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5'
  };

  const colorClasses = {
    green: 'led-green',
    amber: 'led-amber',
    red: 'led-red',
    blue: 'led-blue'
  };

  return (
    <div className="flex items-center gap-2 select-none">
      <div className="p-0.5 rounded-full led-housing flex items-center justify-center">
        <div 
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} ${pulse ? 'animate-pulse' : ''}`}
        />
      </div>
      {label && (
        <span className="text-xs font-mono tracking-wider uppercase text-slate-400 text-engraved font-semibold">
          {label}
        </span>
      )}
    </div>
  );
};

interface SkeuoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'standard' | 'accent' | 'emerald' | 'danger' | 'recessed';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  activeState?: boolean;
}

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
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5'
  };

  const variantStyles = {
    standard: 'skeuo-btn text-slate-200 hover:text-white',
    accent: 'skeuo-btn-accent text-white font-medium',
    emerald: 'skeuo-btn-emerald text-white font-medium',
    danger: 'bg-gradient-to-b from-red-700 to-red-900 border border-red-500/40 text-red-100 shadow-[0_4px_10px_rgba(239,68,68,0.25)] active:translate-y-0.5 active:shadow-inner',
    recessed: 'skeuo-recessed text-slate-300 border border-slate-700/50 hover:border-slate-500/50'
  };

  const activeStyle = activeState ? 'border-sky-400/80 bg-[#16202c] shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] text-sky-300 font-semibold' : '';

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`relative inline-flex items-center justify-center font-medium rounded-lg cursor-pointer select-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]} ${variantStyles[variant]} ${activeStyle} ${className}`}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
};

interface SegmentedDisplayProps {
  value: string | number;
  label?: string;
  unit?: string;
  color?: 'sky' | 'emerald' | 'amber' | 'red';
}

export const SegmentedDisplay: React.FC<SegmentedDisplayProps> = ({ 
  value, 
  label, 
  unit, 
  color = 'sky' 
}) => {
  const colorMap = {
    sky: 'text-sky-400 border-sky-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]',
    emerald: 'text-emerald-400 border-emerald-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]',
    amber: 'text-amber-400 border-amber-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]',
    red: 'text-red-400 border-red-500/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.9)]'
  };

  return (
    <div className="flex flex-col">
      {label && (
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 font-semibold">
          {label}
        </span>
      )}
      <div className={`digital-display px-3 py-1.5 rounded-md flex items-baseline justify-between gap-2 ${colorMap[color]}`}>
        <span className="text-xl font-bold tracking-widest font-mono drop-shadow-[0_0_8px_currentColor]">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-slate-500 font-mono tracking-tight uppercase">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};
