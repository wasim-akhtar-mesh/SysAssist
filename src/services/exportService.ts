import { 
  Asset, 
  ProcurementRequest, 
  JiraTicket, 
  ChangeLogEntry, 
  UnifiedAuditLog,
  SimulatedUserRole,
  AssetCategory
} from '../types';
import { isActorRequestOwner } from './procurementService';

export type ExportType = 
  | 'inventory' 
  | 'procurement' 
  | 'spend_report' 
  | 'inventory_valuation' 
  | 'stock_replenishment' 
  | 'jira' 
  | 'audit' 
  | 'operational_summary';

export interface ExportMetadata {
  title: string;
  reportType: string;
  activeFilterDescription?: string;
  actor: SimulatedUserRole;
}

/**
 * RFC 4180-compliant CSV cell formatting with Formula Injection (CSV Injection) protection.
 * Sanitizes characters '=', '+', '-', '@', '\t', '\r' at cell start by prepending a single quote.
 */
export function sanitizeAndEscapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val);

  // Check for formula injection triggers at beginning of cell
  const formulaChars = ['=', '+', '-', '@', '\t', '\r'];
  if (formulaChars.some(char => str.startsWith(char))) {
    str = `'${str}`;
  }

  // If the cell contains quotes, commas, newlines, or carriage returns, wrap in quotes and double internal quotes
  const needsWrapping = str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r') || str.startsWith("'");

  if (needsWrapping) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return `"${str}"`;
}

/**
 * Builds RFC 4180 CSV string with UTF-8 BOM, metadata comments, and rows.
 */
export function generateCsvString(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  metadata: ExportMetadata
): string {
  const now = new Date();
  const dateStr = now.toISOString();

  const commentRows: string[] = [
    `# System Assist Export: ${metadata.title}`,
    `# Generated At: ${dateStr}`,
    `# Exported By: ${metadata.actor.name} (${metadata.actor.badge}) - ${metadata.actor.email}`,
    `# Role Scope: ${metadata.actor.exportScope || 'Standard'}`,
    `# Filter State: ${metadata.activeFilterDescription || 'All records within authorization scope'}`,
    `# Data System: Local System Assist State (Verified Internal Browser Storage)`,
    '#'
  ];

  const headerRow = headers.map(h => sanitizeAndEscapeCsvCell(h)).join(',');
  const dataRows = rows.map(row => row.map(cell => sanitizeAndEscapeCsvCell(cell)).join(','));

  const fullContent = [
    ...commentRows,
    headerRow,
    ...dataRows
  ].join('\r\n');

  return fullContent;
}

/**
 * Downloads a CSV string via Blob and temporary Object URL, cleaning up afterward.
 */
export function downloadCsvFile(csvContent: string, reportSlug: string): void {
  const datePart = new Date().toISOString().split('T')[0];
  const filename = `System_Assist_${reportSlug}_${datePart}.csv`;

  // Prepend UTF-8 BOM (\uFEFF) for Excel compatibility
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Verifies role-based export authorization
 */
export function canRoleExport(
  role: SimulatedUserRole, 
  exportType: ExportType
): { allowed: boolean; reason?: string } {
  if (role.id === 'requester') {
    if (exportType === 'procurement') {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Requesters can export their own personal procurement requests only.' 
    };
  }

  if (role.id === 'it_head') {
    if (
      exportType === 'procurement' || 
      exportType === 'stock_replenishment' || 
      exportType === 'operational_summary' || 
      exportType === 'jira' || 
      exportType === 'inventory' ||
      exportType === 'audit'
    ) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'IT Head export scope includes operational requests, inventory, stock replenishment, audit trail, and system summaries.' 
    };
  }

  if (role.id === 'finance') {
    if (
      exportType === 'procurement' || 
      exportType === 'spend_report' || 
      exportType === 'inventory_valuation'
    ) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Finance Controller export scope includes procurement requests, spend analysis, and inventory valuations.' 
    };
  }

  if (role.id === 'purchasing' || role.id === 'purchasing_buyer') {
    if (
      exportType === 'procurement' || 
      exportType === 'spend_report' || 
      exportType === 'stock_replenishment'
    ) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'Purchasing Buyers can export purchasing requests, purchase orders, spend, and vendor deliveries.' 
    };
  }

  if (role.id === 'asset_manager') {
    if (
      exportType === 'inventory' || 
      exportType === 'inventory_valuation' || 
      exportType === 'stock_replenishment' || 
      exportType === 'audit' || 
      exportType === 'operational_summary'
    ) {
      return { allowed: true };
    }
    return { 
      allowed: false, 
      reason: 'IT Asset Managers can export fleet inventory, valuation, stock replenishment, and audit logs.' 
    };
  }

  return { allowed: true };
}

/**
 * Filter data strictly respecting active role permissions
 */
export function scopeProcurementRequestsForRole(
  requests: ProcurementRequest[], 
  role: SimulatedUserRole
): ProcurementRequest[] {
  if (role.id === 'requester') {
    return requests.filter(r => isActorRequestOwner(r, role));
  }
  return requests;
}

// --------------------------------------------------------------------------
// 1. INVENTORY EXPORT (Category-aware specifications)
// --------------------------------------------------------------------------

export function exportInventory(
  assets: Asset[], 
  filterLabel: string, 
  actor: SimulatedUserRole,
  specificType: 'All' | 'Laptops' | 'Peripherals' = 'All'
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'inventory');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  if (assets.length === 0) {
    return { success: false, count: 0, error: 'No inventory records matching current filter.' };
  }

  const headers = [
    'Asset Tag',
    'Barcode',
    'Serial Number',
    'Equipment Category',
    'Asset Name',
    'Manufacturer',
    'Model',
    'Status',
    'Assigned User',
    'Assigned Email',
    'Department',
    'Location',
    'Purchase Date',
    'Purchase Price',
    'Supplier',
    'Warranty Expiry',
    'Linked Jira Ticket',
    'Linked Procurement Request',
    'Purchase-Order Number',
    'Hardware Specifications',
    'Last Audit / Update Date'
  ];

  const rows = assets.map(a => {
    // Format category-aware hardware specifications cleanly
    let specsFormatted = '';
    if (a.category === 'Laptop' && a.specs) {
      const parts = [];
      if (a.specs.processor) parts.push(`CPU: ${a.specs.processor}`);
      if (a.specs.ram) parts.push(`RAM: ${a.specs.ram}`);
      if (a.specs.storage) parts.push(`Storage: ${a.specs.storage}`);
      if (a.specs.display) parts.push(`Screen: ${a.specs.display}`);
      specsFormatted = parts.join(' | ');
    } else if (a.specs) {
      // Peripherals or others: never label with CPU/RAM/Storage if empty or not applicable
      const parts = [];
      if (a.specs.screenSize) parts.push(`Size: ${a.specs.screenSize}`);
      if (a.specs.resolution) parts.push(`Resolution: ${a.specs.resolution}`);
      if (a.specs.ports) parts.push(`Ports: ${a.specs.ports}`);
      if (a.specs.connectivity) parts.push(`Connectivity: ${a.specs.connectivity}`);
      if (a.specs.keyboardLayout) parts.push(`Layout: ${a.specs.keyboardLayout}`);
      if (a.specs.sensorType) parts.push(`Sensor: ${a.specs.sensorType}`);
      if (a.specs.audioFeatures) parts.push(`Audio: ${a.specs.audioFeatures}`);
      specsFormatted = parts.length > 0 ? parts.join(' | ') : (a.model || '');
    }

    const lastLogDate = a.changeLogs && a.changeLogs.length > 0 ? a.changeLogs[0].timestamp : a.purchaseDate;

    return [
      a.assetTag,
      a.barcode,
      a.serialNumber,
      a.category,
      a.name,
      a.manufacturer,
      a.model,
      a.status,
      a.assignedTo?.name || 'Unassigned',
      a.assignedTo?.email || '',
      a.assignedTo?.department || a.location || '',
      a.location,
      a.purchaseDate,
      a.purchasePrice !== undefined ? `$${a.purchasePrice.toFixed(2)}` : 'Unknown / Missing',
      a.supplier || '',
      a.warrantyExpiry || 'N/A',
      a.linkedJiraKey || '',
      a.linkedProcurementId || '',
      a.purchaseOrderNumber || '',
      specsFormatted,
      lastLogDate
    ];
  });

  const slug = specificType === 'Laptops' ? 'Laptops' : specificType === 'Peripherals' ? 'Peripherals' : 'Inventory';
  const csv = generateCsvString(headers, rows, {
    title: `${specificType} Hardware Inventory`,
    reportType: slug,
    activeFilterDescription: filterLabel,
    actor
  });

  downloadCsvFile(csv, slug);
  return { success: true, count: assets.length };
}

// --------------------------------------------------------------------------
// 2. PROCUREMENT DETAIL EXPORT
// --------------------------------------------------------------------------

export function exportProcurementRequests(
  requests: ProcurementRequest[],
  filterLabel: string,
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'procurement');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  const scoped = scopeProcurementRequestsForRole(requests, actor);
  if (scoped.length === 0) {
    return { success: false, count: 0, error: 'No procurement records accessible to your role.' };
  }

  const headers = [
    'Request Number',
    'Requester Name',
    'Requester Email',
    'Department',
    'Approving Manager',
    'Cost Centre',
    'Category',
    'Requested Model / Specification',
    'Quantity Requested',
    'Request Type',
    'Business Justification',
    'Required-By Date',
    'Urgency',
    'Status',
    'Estimated Unit Price',
    'Estimated Total',
    'Currency',
    'Finance-Approved Amount',
    'Vendor',
    'PO Number',
    'Final Unit Price',
    'Final PO Total',
    'Order Date',
    'Expected Delivery Date',
    'Tracking Reference',
    'Quantity Received',
    'Remaining Quantity',
    'Registered Asset Tags',
    'Assigned/Fulfilled Asset Tags',
    'Stock-Fulfilled Indicator',
    'Created Date',
    'Last Updated Date',
    'IT Approval Decision & Approver',
    'Finance Approval Decision & Approver',
    'Rejection / Change-Request Reason'
  ];

  const rows = scoped.map(r => {
    const itAppr = r.approvals?.find(a => a.stage === 'IT Head Review');
    const finAppr = r.approvals?.find(a => a.stage === 'Finance Review');

    const itDesc = itAppr ? `${itAppr.decision} by ${itAppr.approverName} (${itAppr.timestamp.split('T')[0]})` : 'Pending';
    const finDesc = finAppr ? `${finAppr.decision} by ${finAppr.approverName} (${finAppr.timestamp.split('T')[0]})` : 'Pending';

    const orderedQty = r.purchaseOrder?.quantity ?? r.quantity;
    const remainingQty = Math.max(0, orderedQty - (r.totalReceivedQuantity || 0));

    return [
      r.requestNumber,
      r.requester.name,
      r.requester.email,
      r.department,
      r.manager,
      r.costCentre,
      r.category,
      r.preferredModel,
      r.quantity,
      r.requestType,
      r.businessJustification,
      r.requiredByDate,
      r.urgency,
      r.status,
      r.estimatedUnitPrice,
      r.estimatedTotalCost,
      r.currency,
      r.financeApprovedAmount !== undefined ? r.financeApprovedAmount : '',
      r.purchaseOrder?.vendor || r.preferredVendor || '',
      r.purchaseOrder?.poNumber || '',
      r.purchaseOrder?.finalUnitPrice !== undefined ? r.purchaseOrder.finalUnitPrice : '',
      r.purchaseOrder?.finalTotalCost !== undefined ? r.purchaseOrder.finalTotalCost : '',
      r.purchaseOrder?.orderDate || '',
      r.purchaseOrder?.expectedDeliveryDate || '',
      r.purchaseOrder?.trackingReference || '',
      r.totalReceivedQuantity || 0,
      remainingQty,
      (r.registeredAssetTags || []).join('; '),
      (r.fulfilledAssetTags || []).join('; '),
      r.stockFulfilled ? 'Yes' : 'No',
      r.createdAt,
      r.updatedAt,
      itDesc,
      finDesc,
      r.rejectionReason || r.changesRequestedReason || ''
    ];
  });

  const csv = generateCsvString(headers, rows, {
    title: 'Procurement Request Register',
    reportType: 'Procurement',
    activeFilterDescription: filterLabel,
    actor
  });

  downloadCsvFile(csv, 'Procurement');
  return { success: true, count: scoped.length };
}

// --------------------------------------------------------------------------
// 3. PROCUREMENT SPEND REPORT (Multi-Currency Grouped Totals)
// --------------------------------------------------------------------------

export function exportProcurementSpendReport(
  requests: ProcurementRequest[],
  filterLabel: string,
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'spend_report');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  const scoped = scopeProcurementRequestsForRole(requests, actor);
  if (scoped.length === 0) {
    return { success: false, count: 0, error: 'No procurement records available for spend report.' };
  }

  // Multi-currency calculation
  const currencies = Array.from(new Set(scoped.map(r => r.currency || 'USD')));

  const summaryRows: (string | number | boolean | null | undefined)[][] = [];

  currencies.forEach(curr => {
    const currReqs = scoped.filter(r => (r.currency || 'USD') === curr);

    // 1. Requested estimate: submitted requests
    const submittedReqs = currReqs.filter(r => r.status !== 'Draft');
    const totalRequested = submittedReqs.reduce((sum, r) => sum + (r.estimatedTotalCost || 0), 0);

    // 2. Finance-approved value
    const approvedStatuses = ['Purchasing Queue', 'Ordered', 'Shipped', 'Partially Received', 'Received', 'Asset Registration', 'Assigned/Fulfilled', 'Closed'];
    const approvedReqs = currReqs.filter(r => approvedStatuses.includes(r.status));
    const totalApproved = approvedReqs.reduce((sum, r) => sum + (r.financeApprovedAmount || r.estimatedTotalCost || 0), 0);

    // 3. Committed spend: final PO total for issued purchase orders. Excludes draft, submitted, approvals, rejected, cancelled, and stock-fulfilled
    const committedStatuses = ['Ordered', 'Shipped', 'Partially Received', 'Received', 'Asset Registration', 'Assigned/Fulfilled', 'Closed'];
    const committedReqs = currReqs.filter(r => committedStatuses.includes(r.status) && r.purchaseOrder && !r.stockFulfilled);
    const totalCommitted = committedReqs.reduce((sum, r) => sum + (r.purchaseOrder?.finalTotalCost || 0), 0);

    // 4. Received value: final unit price * quantity received
    const totalReceivedValue = currReqs.reduce((sum, r) => {
      if (r.purchaseOrder && !r.stockFulfilled) {
        return sum + ((r.purchaseOrder.finalUnitPrice || 0) * (r.totalReceivedQuantity || 0));
      }
      return sum;
    }, 0);

    // 5. Cancelled or rejected value (reported separately, never in committed spend)
    const deadReqs = currReqs.filter(r => r.status === 'Cancelled' || r.status === 'Rejected');
    const totalCancelledOrRejected = deadReqs.reduce((sum, r) => sum + (r.estimatedTotalCost || 0), 0);

    // 6. Existing-stock fulfilment: quantity and avoided purchase value reported separately
    const stockFulfilledReqs = currReqs.filter(r => r.stockFulfilled);
    const totalAvoidedPurchase = stockFulfilledReqs.reduce((sum, r) => sum + (r.estimatedTotalCost || (r.quantity * r.estimatedUnitPrice) || 0), 0);
    const stockUnits = stockFulfilledReqs.reduce((sum, r) => sum + r.quantity, 0);

    // 7. Variance: final PO total minus original estimated total for issued POs
    const totalVariance = committedReqs.reduce((sum, r) => {
      return sum + ((r.purchaseOrder?.finalTotalCost || 0) - r.estimatedTotalCost);
    }, 0);

    // 8. Open commitments (committed spend minus received value)
    const openCommitments = Math.max(0, totalCommitted - totalReceivedValue);

    summaryRows.push([`--- FINANCIAL SUMMARY: ${curr} ---`, '', '', '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Metric', `Value (${curr})`, 'Notes', '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Total Requested Estimate', totalRequested.toFixed(2), `${submittedReqs.length} submitted requests`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Finance-Authorized Value', totalApproved.toFixed(2), `${approvedReqs.length} authorized requests`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Committed Spend (Issued POs)', totalCommitted.toFixed(2), `${committedReqs.length} issued vendor POs`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Received Delivered Value', totalReceivedValue.toFixed(2), 'Physical hardware arrived at depot', '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Open Purchasing Commitments', openCommitments.toFixed(2), 'Committed PO spend awaiting physical receipt', '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['PO to Estimate Variance', totalVariance.toFixed(2), 'Difference between negotiated PO total and estimate', '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Cancelled / Rejected Value', totalCancelledOrRejected.toFixed(2), `${deadReqs.length} requests terminated without spend`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['Avoided Spend (Stock Fulfilment)', totalAvoidedPurchase.toFixed(2), `${stockUnits} units repurposed from stock reserve`, '', '', '', '', '', '', '', '', '']);
    summaryRows.push(['', '', '', '', '', '', '', '', '', '', '', '']);
  });

  // Reconciled underlying detail rows
  summaryRows.push(['--- UNDERLYING RECONCILIATION DETAIL ROWS ---', '', '', '', '', '', '', '', '', '', '', '']);
  const detailHeaders = [
    'Request Number',
    'Requester',
    'Department',
    'Cost Centre',
    'Category',
    'Status',
    'Vendor',
    'PO Number',
    'Currency',
    'Estimated Total',
    'Committed PO Total',
    'Received Value',
    'Stock Fulfilled'
  ];
  summaryRows.push(detailHeaders);

  scoped.forEach(r => {
    const isCommitted = ['Ordered', 'Shipped', 'Partially Received', 'Received', 'Asset Registration', 'Assigned/Fulfilled', 'Closed'].includes(r.status) && r.purchaseOrder && !r.stockFulfilled;
    const committedVal = isCommitted ? (r.purchaseOrder?.finalTotalCost || 0) : 0;
    const receivedVal = (!r.stockFulfilled && r.purchaseOrder) ? ((r.purchaseOrder.finalUnitPrice || 0) * (r.totalReceivedQuantity || 0)) : 0;

    summaryRows.push([
      r.requestNumber,
      r.requester.name,
      r.department,
      r.costCentre,
      r.category,
      r.status,
      r.purchaseOrder?.vendor || r.preferredVendor || 'N/A',
      r.purchaseOrder?.poNumber || 'None',
      r.currency,
      r.estimatedTotalCost.toFixed(2),
      committedVal.toFixed(2),
      receivedVal.toFixed(2),
      r.stockFulfilled ? 'Yes' : 'No'
    ]);
  });

  const dummyHeaders = ['Report Section / Field', 'Value', 'Detail / Scope', '', '', '', '', '', '', '', '', '', ''];
  const csv = generateCsvString(dummyHeaders, summaryRows, {
    title: 'Procurement Spend & Financial Reconciliation Report',
    reportType: 'Spend_Report',
    activeFilterDescription: filterLabel,
    actor
  });

  downloadCsvFile(csv, 'Spend_Report');
  return { success: true, count: scoped.length };
}

// --------------------------------------------------------------------------
// 4. INVENTORY VALUATION REPORT
// --------------------------------------------------------------------------

export function exportInventoryValuation(
  assets: Asset[],
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'inventory_valuation');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  if (assets.length === 0) {
    return { success: false, count: 0, error: 'No inventory records available for valuation.' };
  }

  const missingPriceAssets = assets.filter(a => a.purchasePrice === undefined || a.purchasePrice === null);
  const validPriceAssets = assets.filter(a => a.purchasePrice !== undefined && a.purchasePrice !== null);

  const totalAcquisition = validPriceAssets.reduce((sum, a) => sum + (a.purchasePrice || 0), 0);

  // Group by Category + Model
  const groups: Record<string, {
    category: string;
    manufacturer: string;
    model: string;
    totalCount: number;
    withPriceCount: number;
    unitPrice: number;
    totalValue: number;
    assignedCount: number;
    availableCount: number;
    maintenanceCount: number;
    retiredCount: number;
    supplier: string;
    purchasePeriod: string;
  }> = {};

  assets.forEach(a => {
    const key = `${a.category}__${a.manufacturer}__${a.model}__${a.purchasePrice ?? 'unknown'}`;
    if (!groups[key]) {
      groups[key] = {
        category: a.category,
        manufacturer: a.manufacturer,
        model: a.model,
        totalCount: 0,
        withPriceCount: 0,
        unitPrice: a.purchasePrice ?? 0,
        totalValue: 0,
        assignedCount: 0,
        availableCount: 0,
        maintenanceCount: 0,
        retiredCount: 0,
        supplier: a.supplier || 'Standard Supply',
        purchasePeriod: a.purchaseDate ? a.purchaseDate.substring(0, 7) : 'Unknown'
      };
    }

    groups[key].totalCount += 1;
    if (a.purchasePrice !== undefined && a.purchasePrice !== null) {
      groups[key].withPriceCount += 1;
      groups[key].totalValue += a.purchasePrice;
    }
    if (a.status === 'In Use') groups[key].assignedCount += 1;
    else if (a.status === 'In Stock') groups[key].availableCount += 1;
    else if (a.status === 'Maintenance') groups[key].maintenanceCount += 1;
    else if (a.status === 'Retired') groups[key].retiredCount += 1;
  });

  const headers = [
    'Asset Category',
    'Manufacturer',
    'Model',
    'Quantity',
    'Unit Purchase Price',
    'Total Recorded Acquisition Value',
    'Assigned Qty',
    'Available Qty',
    'Maintenance Qty',
    'Retired Qty',
    'Supplier',
    'Purchase Period',
    'Price Status'
  ];

  const rows: (string | number | boolean | null | undefined)[][] = [
    // Top summary banner
    ['--- VALUATION SUMMARY ---', '', '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Fleet Count', assets.length, '', '', '', '', '', '', '', '', '', '', ''],
    ['Total Recorded Acquisition Value ($)', `$${totalAcquisition.toFixed(2)}`, '', '', '', '', '', '', '', '', '', '', ''],
    ['Records Missing Purchase Price', missingPriceAssets.length, 'Not artificially inflated; marked as Unknown', '', '', '', '', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', '', '', '', '', '']
  ];

  Object.values(groups).forEach(g => {
    const isUnknown = g.withPriceCount === 0;
    rows.push([
      g.category,
      g.manufacturer,
      g.model,
      g.totalCount,
      isUnknown ? 'Unknown / Missing' : `$${g.unitPrice.toFixed(2)}`,
      isUnknown ? 'Unknown / Missing' : `$${g.totalValue.toFixed(2)}`,
      g.assignedCount,
      g.availableCount,
      g.maintenanceCount,
      g.retiredCount,
      g.supplier,
      g.purchasePeriod,
      isUnknown ? 'Price Unknown' : 'Recorded'
    ]);
  });

  const csv = generateCsvString(headers, rows, {
    title: 'Hardware Fleet Valuation Report',
    reportType: 'Valuation',
    activeFilterDescription: `Total ${assets.length} assets evaluated (${missingPriceAssets.length} missing recorded unit price)`,
    actor
  });

  downloadCsvFile(csv, 'Valuation');
  return { success: true, count: assets.length };
}

// --------------------------------------------------------------------------
// 5. STOCK & REPLENISHMENT EXPORT
// --------------------------------------------------------------------------

export function exportStockReplenishment(
  categoriesSummary: Array<{
    category: string;
    model: string;
    total: number;
    available: number;
    assigned: number;
    buffer: number;
    critical: number;
    shortfall: number;
    recommendedOrder: number;
    estimatedCost: number;
    status: string;
    openPrs: string;
  }>,
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'stock_replenishment');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  if (categoriesSummary.length === 0) {
    return { success: false, count: 0, error: 'No stock data available.' };
  }

  const headers = [
    'Category',
    'Representative Model',
    'Total Stock',
    'Available in Depot',
    'Assigned to Personnel',
    'Minimum Target Buffer',
    'Critical Shortfall Threshold',
    'Shortfall Quantity',
    'Recommended Reorder Quantity',
    'Estimated Reorder Cost ($)',
    'Stock Health Status',
    'Related Open Procurement Requests'
  ];

  const rows = categoriesSummary.map(c => [
    c.category,
    c.model,
    c.total,
    c.available,
    c.assigned,
    c.buffer,
    c.critical,
    c.shortfall,
    c.recommendedOrder,
    c.estimatedCost > 0 ? `$${c.estimatedCost.toFixed(2)}` : 'N/A (Price Unknown)',
    c.status,
    c.openPrs || 'None'
  ]);

  const csv = generateCsvString(headers, rows, {
    title: 'Stock Reserves & Automated Replenishment Report',
    reportType: 'Stock_Replenishment',
    actor
  });

  downloadCsvFile(csv, 'Stock_Replenishment');
  return { success: true, count: categoriesSummary.length };
}

// --------------------------------------------------------------------------
// 6. JIRA REQUEST EXPORT
// --------------------------------------------------------------------------

export function exportJiraTickets(
  tickets: JiraTicket[],
  filterLabel: string,
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'jira');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  if (tickets.length === 0) {
    return { success: false, count: 0, error: 'No Jira ticket records available.' };
  }

  const headers = [
    'Jira Key',
    'Summary',
    'Issue Type',
    'Priority',
    'Status',
    'Requester Name',
    'Requester Email',
    'Department',
    'Requested Equipment',
    'Requested Category',
    'Created Date',
    'Updated Date',
    'Linked Asset Tag',
    'Fulfilled Asset Tag',
    'Storage Reference'
  ];

  const rows = tickets.map(t => [
    t.key,
    t.summary,
    t.issueType || 'Hardware Request',
    t.priority,
    t.status,
    t.requester.name,
    t.requester.email,
    t.requester.department || '',
    t.requestedEquipment || t.requestedHardware || t.summary,
    t.requestedCategory || 'Laptop',
    t.createdAt || t.createdDate || '',
    t.updatedAt || '',
    t.linkedAssetTag || '',
    t.fulfilledAssetTag || '',
    'System Assist Local Storage'
  ]);

  const csv = generateCsvString(headers, rows, {
    title: 'Jira Service Management Tickets (Internal State)',
    reportType: 'Jira_Tickets',
    activeFilterDescription: filterLabel,
    actor
  });

  downloadCsvFile(csv, 'Jira_Tickets');
  return { success: true, count: tickets.length };
}

// --------------------------------------------------------------------------
// 7. OPERATIONAL AUDIT TRAIL EXPORT
// --------------------------------------------------------------------------

export function exportAuditTrail(
  logs: UnifiedAuditLog[],
  filterLabel: string,
  actor: SimulatedUserRole
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(actor, 'audit');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  if (logs.length === 0) {
    return { success: false, count: 0, error: 'No audit trail records match current filter.' };
  }

  const headers = [
    'Event Timestamp',
    'Event Source',
    'Identifier (Asset Tag / PR Number)',
    'Action Taken',
    'Property Modified',
    'Previous State / Value',
    'New State / Value',
    'Actor Name',
    'Actor Role',
    'Reason / Operational Notes',
    'PO Number Reference',
    'Delivery Reference',
    'Jira Key Reference'
  ];

  const rows = logs.map(l => [
    l.timestamp,
    l.source,
    l.reference,
    l.action,
    l.property,
    l.oldValue || 'N/A',
    l.newValue || 'N/A',
    l.performedBy,
    l.role || 'Staff Operator',
    l.reason || '',
    l.poNumber || '',
    l.deliveryReference || '',
    l.jiraTicketKey || ''
  ]);

  const csv = generateCsvString(headers, rows, {
    title: 'Operational Audit & Lifecycle Trail',
    reportType: 'Audit_Trail',
    activeFilterDescription: filterLabel,
    actor
  });

  downloadCsvFile(csv, 'Audit_Trail');
  return { success: true, count: logs.length };
}

// --------------------------------------------------------------------------
// 8. DASHBOARD OPERATIONAL SUMMARY
// --------------------------------------------------------------------------

export function exportDashboardOperationalSummary(
  params: {
    assets: Asset[];
    procurementRequests: ProcurementRequest[];
    jiraTickets: JiraTicket[];
    actor: SimulatedUserRole;
  }
): { success: boolean; count: number; error?: string } {
  const auth = canRoleExport(params.actor, 'operational_summary');
  if (!auth.allowed) {
    return { success: false, count: 0, error: auth.reason };
  }

  const { assets, procurementRequests, jiraTickets, actor } = params;

  // Compute metrics
  const laptops = assets.filter(a => a.category === 'Laptop');
  const totalLaptops = laptops.length;
  const availableLaptops = laptops.filter(a => a.status === 'In Stock').length;
  const assignedLaptops = laptops.filter(a => a.status === 'In Use').length;
  const maintenanceLaptops = laptops.filter(a => a.status === 'Maintenance').length;

  const peripherals = assets.filter(a => a.category !== 'Laptop');
  const peripheralTotalsByCategory: Record<string, number> = {};
  peripherals.forEach(p => {
    peripheralTotalsByCategory[p.category] = (peripheralTotalsByCategory[p.category] || 0) + 1;
  });

  const openJira = jiraTickets.filter(j => j.status !== 'Fulfilled' && j.status !== 'Closed').length;

  // Stock categories below buffer
  const categories: AssetCategory[] = ['Laptop', 'Display', 'Dock', 'Keyboard', 'Mouse', 'Audio/Headset'];
  let lowStockCategoriesCount = 0;
  categories.forEach(cat => {
    const avail = assets.filter(a => a.category === cat && a.status === 'In Stock').length;
    if (avail < 2) lowStockCategoriesCount += 1;
  });

  const openProcurement = procurementRequests.filter(r => !['Closed', 'Rejected', 'Cancelled'].includes(r.status)).length;
  const awaitingIT = procurementRequests.filter(r => r.status === 'IT Head Review').length;
  const awaitingFinance = procurementRequests.filter(r => r.status === 'Finance Review').length;
  const awaitingPO = procurementRequests.filter(r => r.status === 'Purchasing Queue').length;
  const orderedOrInTransit = procurementRequests.filter(r => r.status === 'Ordered' || r.status === 'Shipped').length;

  const now = new Date();
  const overdueDeliveries = procurementRequests.filter(r => {
    if ((r.status === 'Ordered' || r.status === 'Shipped') && r.purchaseOrder?.expectedDeliveryDate) {
      return new Date(r.purchaseOrder.expectedDeliveryDate) < now;
    }
    return false;
  }).length;

  // Committed spend and received value by currency
  const currencies = Array.from(new Set(procurementRequests.map(r => r.currency || 'USD')));
  const committedByCurrency: Record<string, number> = {};
  const receivedByCurrency: Record<string, number> = {};

  currencies.forEach(c => {
    committedByCurrency[c] = 0;
    receivedByCurrency[c] = 0;
  });

  procurementRequests.forEach(r => {
    const c = r.currency || 'USD';
    const isCommitted = ['Ordered', 'Shipped', 'Partially Received', 'Received', 'Asset Registration', 'Assigned/Fulfilled', 'Closed'].includes(r.status) && r.purchaseOrder && !r.stockFulfilled;
    if (isCommitted) {
      committedByCurrency[c] = (committedByCurrency[c] || 0) + (r.purchaseOrder?.finalTotalCost || 0);
    }
    if (r.purchaseOrder && !r.stockFulfilled) {
      receivedByCurrency[c] = (receivedByCurrency[c] || 0) + ((r.purchaseOrder.finalUnitPrice || 0) * (r.totalReceivedQuantity || 0));
    }
  });

  const headers = ['Operational Dimension / Metric', 'Value', 'Category / Unit'];
  const rows: (string | number | boolean | null | undefined)[][] = [
    ['Total Laptop Workstations', totalLaptops, 'Units'],
    ['Available Laptops in Depot', availableLaptops, 'Units'],
    ['Assigned Laptops to Personnel', assignedLaptops, 'Units'],
    ['Maintenance / Repair Laptops', maintenanceLaptops, 'Units'],
    ['--- PERIPHERALS FLEET ---', '', ''],
    ...Object.entries(peripheralTotalsByCategory).map(([cat, count]) => [
      `Peripheral Count: ${cat}`, count, 'Units'
    ]),
    ['--- SERVICING & TICKETS ---', '', ''],
    ['Open Jira Provisioning Requests', openJira, 'Tickets'],
    ['Low-Stock Fleet Categories', lowStockCategoriesCount, 'Threshold Alerts'],
    ['--- PROCUREMENT PIPELINE ---', '', ''],
    ['Open Procurement Requests', openProcurement, 'Requests in Flight'],
    ['Requests Awaiting IT Head Review', awaitingIT, 'Requests'],
    ['Requests Awaiting Finance Review', awaitingFinance, 'Requests'],
    ['Requests Awaiting Vendor PO Issue', awaitingPO, 'Requests'],
    ['Ordered / In-Transit Vendor Orders', orderedOrInTransit, 'Purchase Orders'],
    ['Overdue Vendor Deliveries', overdueDeliveries, 'Orders past expected date'],
    ['--- PROCUREMENT FINANCIALS BY CURRENCY ---', '', '']
  ];

  currencies.forEach(c => {
    rows.push([`Committed PO Spend (${c})`, `$${(committedByCurrency[c] || 0).toFixed(2)}`, `${c} Currency`]);
    rows.push([`Received Delivered Value (${c})`, `$${(receivedByCurrency[c] || 0).toFixed(2)}`, `${c} Currency`]);
  });

  const csv = generateCsvString(headers, rows, {
    title: 'Executive Operational Telemetry Summary',
    reportType: 'Operational_Summary',
    actor
  });

  downloadCsvFile(csv, 'Operational_Summary');
  return { success: true, count: rows.length };
}

// Convenient alias
export const exportStockAssessments = exportStockReplenishment;
