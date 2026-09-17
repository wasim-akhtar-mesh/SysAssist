import { Asset, ChangeLogEntry, JiraTicket } from '../types';

/**
 * Centralized, collision-safe identifier generation engine for System Assist.
 * Checks existing collections before returning unique tags, keys, barcodes, and IDs.
 */

let counter = 0;

function getEntropy(): string {
  counter = (counter + 1) % 10000;
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const cnt = counter.toString().padStart(4, '0');
  return `${rand}${cnt}`;
}

/**
 * Generate a unique Asset Tag (e.g. AST-8835) that does not collide with any existing assets.
 */
export function generateUniqueAssetTag(existingAssets: Pick<Asset, 'assetTag'>[] = []): string {
  const existingTags = new Set(existingAssets.map(a => a.assetTag.toUpperCase()));

  // Determine highest existing AST-XXXX number if available
  let maxNum = 8820;
  for (const a of existingAssets) {
    const match = a.assetTag.match(/AST-(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }

  // Try sequential increment first
  let candidateNum = maxNum + 1;
  let candidate = `AST-${candidateNum}`;
  while (existingTags.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = `AST-${candidateNum}`;
  }

  return candidate;
}

/**
 * Generate a collision-safe internal Asset ID (e.g. ast-1710500000000-0419).
 */
export function generateUniqueAssetId(existingAssets: Pick<Asset, 'id'>[] = []): string {
  const existingIds = new Set(existingAssets.map(a => a.id));
  let candidate: string;
  do {
    candidate = `ast-${Date.now()}-${getEntropy()}`;
  } while (existingIds.has(candidate));

  return candidate;
}

/**
 * Generate a collision-safe unique Code128 barcode number (11 digits, e.g. 8821940210).
 */
export function generateUniqueBarcode(existingAssets: Pick<Asset, 'barcode'>[] = []): string {
  const existingBarcodes = new Set(existingAssets.map(a => a.barcode));

  let candidate: string;
  do {
    const randomDigits = Math.floor(100000000 + Math.random() * 900000000).toString();
    candidate = `88${randomDigits}`;
  } while (existingBarcodes.has(candidate));

  return candidate;
}

/**
 * Generate a collision-safe Jira Ticket Key (e.g. SYS-1085).
 */
export function generateUniqueJiraKey(existingTickets: Pick<JiraTicket, 'key'>[] = []): string {
  const existingKeys = new Set(existingTickets.map(t => t.key.toUpperCase()));

  let maxNum = 1000;
  for (const t of existingTickets) {
    const match = t.key.match(/SYS-(\d+)/i);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }

  let candidateNum = maxNum + 1;
  let candidate = `SYS-${candidateNum}`;
  while (existingKeys.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = `SYS-${candidateNum}`;
  }

  return candidate;
}

/**
 * Generate a collision-safe ChangeLogEntry ID (e.g. log-1710500000000-0419).
 */
export function generateUniqueLogId(existingLogs: Pick<ChangeLogEntry, 'id'>[] = []): string {
  const existingLogIds = new Set(existingLogs.map(l => l.id));
  let candidate: string;
  do {
    candidate = `log-${Date.now()}-${getEntropy()}`;
  } while (existingLogIds.has(candidate));

  return candidate;
}

/**
 * Generate a collision-safe Procurement Request Number (e.g. PR-2026-0001).
 */
export function generateUniqueProcurementNumber(existingRequests: { requestNumber: string }[] = []): string {
  const year = new Date().getFullYear();
  const existingNumbers = new Set(existingRequests.map(r => r.requestNumber.toUpperCase()));

  let maxNum = 0;
  const regex = new RegExp(`^PR-${year}-(\\d+)`, 'i');
  for (const r of existingRequests) {
    const match = r.requestNumber.match(regex);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  }

  let candidateNum = maxNum + 1;
  let candidate = `PR-${year}-${candidateNum.toString().padStart(4, '0')}`;
  while (existingNumbers.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = `PR-${year}-${candidateNum.toString().padStart(4, '0')}`;
  }

  return candidate;
}

/**
 * Generate a collision-safe Purchase Order Number (e.g. PO-2026-0101).
 */
export function generateUniquePONumber(existingRequests: { purchaseOrder?: { poNumber: string } }[] = []): string {
  const year = new Date().getFullYear();
  const existingPOs = new Set<string>();
  existingRequests.forEach(r => {
    if (r.purchaseOrder?.poNumber) {
      existingPOs.add(r.purchaseOrder.poNumber.toUpperCase());
    }
  });

  let maxNum = 100;
  const regex = new RegExp(`^PO-${year}-(\\d+)`, 'i');
  existingPOs.forEach(po => {
    const match = po.match(regex);
    if (match) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  });

  let candidateNum = maxNum + 1;
  let candidate = `PO-${year}-${candidateNum.toString().padStart(4, '0')}`;
  while (existingPOs.has(candidate.toUpperCase())) {
    candidateNum++;
    candidate = `PO-${year}-${candidateNum.toString().padStart(4, '0')}`;
  }

  return candidate;
}

