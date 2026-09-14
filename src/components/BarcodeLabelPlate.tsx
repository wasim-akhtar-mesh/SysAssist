import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Asset } from '../types';
import { ScrewHead, SkeuoButton } from './SkeuoComponents';
import { Printer } from 'lucide-react';

interface BarcodeLabelPlateProps {
  asset: Asset;
  showPrintButton?: boolean;
}

export const BarcodeLabelPlate: React.FC<BarcodeLabelPlateProps> = ({ asset, showPrintButton = true }) => {
  const barcodeSvgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (barcodeSvgRef.current && asset.barcode) {
      try {
        JsBarcode(barcodeSvgRef.current, asset.barcode, {
          format: 'CODE128',
          lineColor: '#0f172a',
          width: 1.6,
          height: 38,
          displayValue: true,
          font: 'monospace',
          fontSize: 11,
          margin: 4,
          background: 'transparent'
        });
      } catch {
        // Barcode render fallback
      }
    }
  }, [asset.barcode]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Tag - ${asset.assetTag}</title>
          <style>
            body { font-family: monospace; padding: 20px; background: white; color: black; }
            .tag-box { border: 2px solid black; padding: 16px; width: 320px; text-align: center; border-radius: 8px; }
            .tag-header { font-size: 11px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-bottom: 8px; }
            .tag-id { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
            .meta { font-size: 10px; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="tag-box">
            <div class="tag-header">PROPERTY OF MESHCONNECT IT INFRASTRUCTURE</div>
            <div class="tag-id">${asset.assetTag}</div>
            <div style="margin: 8px 0;">${barcodeSvgRef.current?.outerHTML || ''}</div>
            <div class="meta"><strong>S/N:</strong> ${asset.serialNumber}</div>
            <div class="meta">${asset.name}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Physical Skeuomorphic Metallic Label Plate */}
      <div className="relative p-4 rounded-xl bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1] to-[#94a3b8] text-slate-900 shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-1px_2px_rgba(0,0,0,0.4)] border border-slate-400 select-none overflow-hidden">
        
        {/* Real corner screw mounts */}
        <div className="absolute top-2 left-2"><ScrewHead rotation={45} size="sm" /></div>
        <div className="absolute top-2 right-2"><ScrewHead rotation={135} size="sm" /></div>
        <div className="absolute bottom-2 left-2"><ScrewHead rotation={90} size="sm" /></div>
        <div className="absolute bottom-2 right-2"><ScrewHead rotation={15} size="sm" /></div>

        {/* Brushed metal reflection overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none transform -skew-x-12" />

        {/* Plate Content */}
        <div className="px-4 py-1 text-center flex flex-col items-center">
          <div className="text-[9px] font-mono tracking-widest uppercase font-bold text-slate-700 border-b border-slate-400/80 pb-1 w-full text-center">
            SYSASSIST IT ASSET REGISTRATION • DO NOT REMOVE
          </div>

          <div className="mt-2 flex items-baseline justify-between w-full px-2">
            <span className="text-xl font-mono font-black tracking-widest text-slate-950 drop-shadow-[0_1px_0_rgba(255,255,255,0.8)]">
              {asset.assetTag}
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-100 uppercase">
              {asset.category}
            </span>
          </div>

          {/* Barcode SVG */}
          <div className="w-full flex justify-center py-1">
            <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
          </div>

          {/* Asset Metadata Footer */}
          <div className="grid grid-cols-2 gap-2 w-full text-[10px] font-mono text-slate-800 pt-1 border-t border-slate-400/60 mt-1">
            <div className="text-left truncate">
              <span className="font-semibold text-slate-600">S/N: </span>
              <span className="font-bold">{asset.serialNumber}</span>
            </div>
            <div className="text-right truncate font-medium">
              {asset.manufacturer} {asset.model}
            </div>
          </div>
        </div>
      </div>

      {showPrintButton && (
        <div className="flex justify-end">
          <SkeuoButton size="sm" onClick={handlePrint} icon={<Printer className="w-3.5 h-3.5" />}>
            Print Metallic Asset Tag
          </SkeuoButton>
        </div>
      )}
    </div>
  );
};
