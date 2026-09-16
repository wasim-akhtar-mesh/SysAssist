import React from 'react';

interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'monochrome' | 'muted' | 'light';
  className?: string;
  showWordmark?: boolean;
  tagline?: boolean;
  collapsed?: boolean;
}

/**
 * System Assist Precision Instrument Brand Mark
 * 
 * Architecture: "The Tag-Node Monogram" (SA Monogram)
 * Palette: Titanium & Ink (Deep Graphite #151719 & Restrained Burnt Orange #C66A2B)
 * Silhouette: Precision asset-tag chamfer with calibrated circular node apertures
 * and an architectural 'S' circuit path.
 * Crisp, flat, recognizable down to 16px.
 */
export const SystemAssistSymbol: React.FC<{
  size?: number;
  variant?: 'accent' | 'monochrome' | 'muted' | 'light';
  className?: string;
}> = ({ size = 28, variant = 'accent', className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="System Assist Precision Tag-Node Monogram"
      className={`shrink-0 ${className}`}
    >
      {/* Outer Calibrated Instrument Housing Bezel */}
      <rect
        x="1"
        y="1"
        width="30"
        height="30"
        rx="6"
        fill={variant === 'light' ? '#FAF9F5' : '#151719'}
        stroke={variant === 'light' ? '#C9C7BF' : '#2A2E33'}
        strokeWidth="1.5"
      />
      <rect
        x="2.5"
        y="2.5"
        width="27"
        height="27"
        rx="4.5"
        fill="none"
        stroke={variant === 'light' ? '#DFDDD6' : '#373D44'}
        strokeWidth="0.75"
      />

      {/* Upper Tag Terminal with Chamfer & Node Pass */}
      <path
        d="M10 9.5H20C21.933 9.5 23.5 11.067 23.5 13V13.5C23.5 15.157 22.157 16.5 20.5 16.5H14.5C13.119 16.5 12 17.619 12 19V19.5"
        stroke={variant === 'monochrome' ? '#E5E4DE' : '#C66A2B'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Lower Return Bracket Node */}
      <path
        d="M18.5 12.5V13C18.5 14.381 17.381 15.5 16 15.5H11.5C9.843 15.5 8.5 16.843 8.5 18.5V19C8.5 20.933 10.067 22.5 12 22.5H22"
        stroke={variant === 'monochrome' ? '#D0CECA' : '#C66A2B'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Precision Aperture Nodes (Bead-blasted Titanium pins) */}
      <circle
        cx="12"
        cy="12"
        r="1.75"
        fill={variant === 'light' ? '#181A1B' : '#FAF9F5'}
      />
      <circle
        cx="20"
        cy="20"
        r="1.75"
        fill={variant === 'light' ? '#181A1B' : '#FAF9F5'}
      />
    </svg>
  );
};

// Backward-compatible alias
export const SysAssistSymbol = SystemAssistSymbol;

/**
 * Rail Header Lockup (Used in Desktop Navigation Rail)
 */
export const SystemAssistRailLockup: React.FC<{
  collapsed?: boolean;
  className?: string;
}> = ({ collapsed = false, className = '' }) => {
  if (collapsed) {
    return (
      <div className={`flex items-center justify-center p-2 ${className}`} title="System Assist IT Workstation">
        <SystemAssistSymbol size={28} variant="accent" />
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 select-none ${className}`}>
      <SystemAssistSymbol size={30} variant="accent" />
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-sans font-bold tracking-[0.12em] text-[#FAF9F5] text-sm leading-none whitespace-nowrap">
            SYSTEM ASSIST
          </span>
          <span className="text-[9px] font-sans font-semibold tracking-wide px-1 py-0.5 rounded bg-[#C66A2B]/20 text-[#E08544] border border-[#C66A2B]/40 leading-none shrink-0">
            v3.0
          </span>
        </div>
        <span className="text-[10px] font-sans text-[#8C8F92] mt-1 leading-none truncate">
          Hardware & Procurement Operations
        </span>
      </div>
    </div>
  );
};

// Backward-compatible alias
export const SysAssistRailLockup = SystemAssistRailLockup;

/**
 * Horizontal Wordmark Lockup
 */
export const SystemAssistWordmark: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'accent',
  className = '',
  tagline = true
}) => {
  const pixelSize = typeof size === 'number' ? size : size === 'sm' ? 22 : size === 'lg' ? 32 : 28;

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <SystemAssistSymbol size={pixelSize} variant={variant} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <span className="font-sans font-bold tracking-[0.12em] text-[#FAF9F5] text-sm leading-none whitespace-nowrap">
            SYSTEM ASSIST
          </span>
          <span className="text-[9px] font-sans font-semibold tracking-wider px-1 py-0.5 rounded bg-[#C66A2B]/20 text-[#E08544] border border-[#C66A2B]/40 leading-none uppercase shrink-0">
            OPERATIONS
          </span>
        </div>
        {tagline && (
          <span className="text-[10px] font-sans text-[#8C8F92] mt-0.5 leading-none">
            Precision IT Fleet & Procurement Instrumentation
          </span>
        )}
      </div>
    </div>
  );
};

// Backward-compatible alias
export const SysAssistWordmark = SystemAssistWordmark;
