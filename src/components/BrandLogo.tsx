import React from 'react';

interface BrandLogoProps {
  size?: number | 'sm' | 'md' | 'lg';
  variant?: 'accent' | 'monochrome' | 'muted';
  className?: string;
  showWordmark?: boolean;
  tagline?: boolean;
}

/**
 * SysAssist Precision Instrument Brand Mark
 * 
 * Concept: "The Tag-Node Monogram"
 * Geometry: Interlocking geometric precision facets forming an architectural 'S'.
 * The upper facet incorporates an angled asset-tag chamfer and circular node aperture,
 * bridging diagonally into a calibrated lower bracket node.
 * Highly legible from 16px to 48px+ without decorative clutter.
 */
export const SysAssistSymbol: React.FC<{
  size?: number;
  variant?: 'accent' | 'monochrome' | 'muted';
  className?: string;
}> = ({ size = 28, variant = 'accent', className = '' }) => {
  // Color tokens
  const accentGradientId = `sa-grad-${Math.random().toString(36).substring(2, 7)}`;
  const accentGlowId = `sa-glow-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="SysAssist Precision Instrument Monogram"
      className={`shrink-0 ${className}`}
    >
      <defs>
        <linearGradient id={accentGradientId} x1="3" y1="3" x2="29" y2="29" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id={`${accentGradientId}-subtle`} x1="16" y1="4" x2="16" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0.7" />
        </linearGradient>
      </defs>

      {variant === 'accent' ? (
        <>
          {/* Outer Calibration Frame Ring (Precision Instrument Bezel) */}
          <rect
            x="1.5"
            y="1.5"
            width="29"
            height="29"
            rx="7"
            fill="#12161d"
            stroke="#2b3442"
            strokeWidth="1"
          />
          <rect
            x="2.5"
            y="2.5"
            width="27"
            height="27"
            rx="6"
            fill="none"
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth="1"
          />

          {/* Upper Tag-Node Arc: chamfered corner tag with aperture */}
          <path
            d="M 10 9 L 20 9 C 22.209 9 24 10.791 24 13 L 24 14 C 24 15.657 22.657 17 21 17 L 15 17 C 13.895 17 13 17.895 13 19 L 13 20"
            stroke={`url(#${accentGradientId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Lower Return Node Arc */}
          <path
            d="M 19 12 L 19 13 C 19 14.105 18.105 15 17 15 L 11 15 C 9.343 15 8 16.343 8 18 L 8 19 C 8 21.209 9.791 23 12 23 L 22 23"
            stroke={`url(#${accentGradientId})`}
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Upper Precision Aperture Node (Asset Tag Pin) */}
          <circle cx="12" cy="12" r="1.75" fill="#38bdf8" />
          
          {/* Lower Precision Anchor Node */}
          <circle cx="20" cy="20" r="1.75" fill="#60a5fa" />
        </>
      ) : variant === 'monochrome' ? (
        <>
          <rect
            x="1.5"
            y="1.5"
            width="29"
            height="29"
            rx="7"
            fill="#1e2229"
            stroke="#3a424e"
            strokeWidth="1"
          />
          <path
            d="M 10 9 L 20 9 C 22.209 9 24 10.791 24 13 L 24 14 C 24 15.657 22.657 17 21 17 L 15 17 C 13.895 17 13 17.895 13 19 L 13 20"
            stroke="#f1f5f9"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 19 12 L 19 13 C 19 14.105 18.105 15 17 15 L 11 15 C 9.343 15 8 16.343 8 18 L 8 19 C 8 21.209 9.791 23 12 23 L 22 23"
            stroke="#cbd5e1"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.75" fill="#ffffff" />
          <circle cx="20" cy="20" r="1.75" fill="#94a3b8" />
        </>
      ) : (
        /* Muted / Low-contrast */
        <>
          <rect
            x="1.5"
            y="1.5"
            width="29"
            height="29"
            rx="7"
            fill="#13161b"
            stroke="#252c37"
            strokeWidth="1"
          />
          <path
            d="M 10 9 L 20 9 C 22.209 9 24 10.791 24 13 L 24 14 C 24 15.657 22.657 17 21 17 L 15 17 C 13.895 17 13 17.895 13 19 L 13 20"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 19 12 L 19 13 C 19 14.105 18.105 15 17 15 L 11 15 C 9.343 15 8 16.343 8 18 L 8 19 C 8 21.209 9.791 23 12 23 L 22 23"
            stroke="#475569"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="1.5" fill="#94a3b8" />
          <circle cx="20" cy="20" r="1.5" fill="#64748b" />
        </>
      )}
    </svg>
  );
};

export const SysAssistWordmark: React.FC<BrandLogoProps> = ({
  size = 'md',
  variant = 'accent',
  className = '',
  tagline = true
}) => {
  const pixelSize = typeof size === 'number' ? size : size === 'sm' ? 24 : size === 'lg' ? 36 : 30;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <SysAssistSymbol size={pixelSize} variant={variant} />
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2">
          <span className="font-sans font-extrabold tracking-[0.16em] text-slate-100 text-sm sm:text-base leading-none">
            SYSASSIST
          </span>
          <span className="text-[9px] font-sans font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-800/40 uppercase">
            INSTRUMENT
          </span>
        </div>
        {tagline && (
          <span className="text-[10px] font-sans tracking-wide text-slate-400 mt-0.5 leading-none">
            Precision IT Asset Infrastructure
          </span>
        )}
      </div>
    </div>
  );
};
