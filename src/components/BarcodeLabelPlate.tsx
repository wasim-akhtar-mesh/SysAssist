import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Asset } from '../types';
import { SkeuoButton } from './SkeuoComponents';
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
          lineColor: '#181A1B',
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

    const doc = printWindow.document;

    // Reset document
    doc.open();
    doc.write('<!DOCTYPE html><html><head></head><body></body></html>');
    doc.close();

    doc.title = `Asset Tag - ${asset.assetTag}`;

    // Construct style safely
    const styleEl = doc.createElement('style');
    styleEl.textContent = `
      body { font-family: monospace; padding: 20px; background: white; color: black; margin: 0; }
      .tag-box { border: 2px solid black; padding: 16px; width: 320px; text-align: center; border-radius: 6px; box-sizing: border-box; }
      .tag-header { font-size: 10px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 4px; margin-bottom: 8px; letter-spacing: 1px; }
      .tag-id { font-size: 20px; font-weight: bold; letter-spacing: 2px; }
      .tag-barcode { margin: 8px 0; display: flex; justify-content: center; }
      .meta { font-size: 10px; margin-top: 6px; word-break: break-word; }
    `;
    doc.head.appendChild(styleEl);

    // Build container box using safe DOM APIs
    const tagBox = doc.createElement('div');
    tagBox.className = 'tag-box';

    const header = doc.createElement('div');
    header.className = 'tag-header';
    header.textContent = 'SYSTEM ASSIST HARDWARE OPERATIONS • CALIBRATED TAG';
    tagBox.appendChild(header);

    const tagId = doc.createElement('div');
    tagId.className = 'tag-id';
    tagId.textContent = asset.assetTag;
    tagBox.appendChild(tagId);

    const barcodeContainer = doc.createElement('div');
    barcodeContainer.className = 'tag-barcode';
    if (barcodeSvgRef.current) {
      try {
        const importedSvg = doc.importNode(barcodeSvgRef.current, true);
        barcodeContainer.appendChild(importedSvg);
      } catch {
        // fallback text representation if SVG clone fails
        const fallbackText = doc.createElement('div');
        fallbackText.textContent = asset.barcode;
        barcodeContainer.appendChild(fallbackText);
      }
    }
    tagBox.appendChild(barcodeContainer);

    const snMeta = doc.createElement('div');
    snMeta.className = 'meta';
    const strongSn = doc.createElement('strong');
    strongSn.textContent = 'S/N: ';
    snMeta.appendChild(strongSn);
    snMeta.appendChild(doc.createTextNode(asset.serialNumber));
    tagBox.appendChild(snMeta);

    const nameMeta = doc.createElement('div');
    nameMeta.className = 'meta';
    nameMeta.textContent = asset.name;
    tagBox.appendChild(nameMeta);

    doc.body.appendChild(tagBox);

    // Trigger printing safely
    setTimeout(() => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch {
        // handled gracefully
      }
    }, 150);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      {/* Precision Bead-blasted Aluminum Chassis Badge */}
      <div className="relative w-full p-4 rounded-lg bg-[#E2E0D8] text-[#181A1B] shadow-[0_2px_8px_rgba(24,26,27,0.1),inset_0_1px_0_rgba(255,255,255,0.8)] border border-[#C5C3BC] select-none overflow-hidden">
        
        {/* Precision Registration Pin Markers in corners */}
        <div className="absolute top-2 left-2 w-1.5 h-1.5 rounded-full bg-[#181A1B]/20 border border-[#181A1B]/40" />
        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#181A1B]/20 border border-[#181A1B]/40" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full bg-[#181A1B]/20 border border-[#181A1B]/40" />
        <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-[#181A1B]/20 border border-[#181A1B]/40" />

        {/* Plate Content */}
        <div className="px-2 py-1 text-center flex flex-col items-center">
          <div className="text-[9px] font-sans tracking-widest uppercase font-bold text-[#505457] border-b border-[#C5C3BC] pb-1 w-full text-center">
            SYSTEM ASSIST HARDWARE OPERATIONS • CALIBRATED TAG
          </div>

          <div className="mt-2 flex items-baseline justify-between w-full px-1">
            <span className="text-xl font-mono font-bold tracking-wider text-[#181A1B]">
              {asset.assetTag}
            </span>
            <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-[#181A1B] text-[#FAF9F5] uppercase tracking-wide">
              {asset.category}
            </span>
          </div>

          {/* Barcode SVG */}
          <div className="w-full flex justify-center py-1">
            <svg ref={barcodeSvgRef} className="max-w-full h-auto" />
          </div>

          {/* Asset Metadata Footer */}
          <div className="grid grid-cols-2 gap-2 w-full text-[10px] font-mono text-[#181A1B] pt-1.5 border-t border-[#C5C3BC] mt-1">
            <div className="text-left truncate">
              <span className="font-sans font-medium text-[#686B6D] text-[9px] uppercase">S/N: </span>
              <span>{asset.serialNumber}</span>
            </div>
            <div className="text-right truncate">
              <span className="font-sans font-medium text-[#686B6D] text-[9px] uppercase">LOCATION: </span>
              <span className="truncate">{asset.location}</span>
            </div>
          </div>
        </div>
      </div>

      {showPrintButton && (
        <SkeuoButton
          size="sm"
          variant="standard"
          onClick={handlePrint}
          icon={<Printer className="w-3.5 h-3.5 text-[#686B6D]" />}
        >
          Print Physical Tag Plate
        </SkeuoButton>
      )}
    </div>
  );
};
