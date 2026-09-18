export type AssetCategory = 
  | 'Laptop'
  | 'Display'
  | 'Dock'
  | 'Keyboard'
  | 'Mouse'
  | 'Audio/Headset'
  | 'Other';

export type AssetStatus = 
  | 'In Use' 
  | 'In Stock' 
  | 'Maintenance' 
  | 'Retired' 
  | 'In Transit';

export interface Assignee {
  name: string;
  email: string;
  department: string;
  assignedDate: string;
  employeeId?: string;
  role?: string;
}

export interface HardwareSpecs {
  // Laptop / General Computing specs
  processor?: string;
  ram?: string;
  storage?: string;
  display?: string;
  os?: string;
  batteryHealth?: number; // 0-100%
  batteryCycles?: number;
  graphics?: string;

  // Display-specific specs
  screenSize?: string;
  resolution?: string;
  connectionPorts?: string;
  refreshRate?: string;

  // Dock-specific specs
  ports?: string;
  connectionStandard?: string;
  powerDelivery?: string;

  // Keyboard-specific specs
  keyboardLayout?: string;
  switchType?: string;
  connectivity?: string;

  // Mouse-specific specs
  sensorType?: string;
  dpi?: string;

  // Audio / Headset-specific specs
  batteryLife?: string;
  audioFeatures?: string;

  // General fallback/generic metadata
  generalSpecs?: string;
}

export interface AppleCoverage {
  isAppleDevice: boolean;
  modelName: string;
  serialNumber: string;
  purchaseDate: string;
  warrantyStatus: 'Active AppleCare+' | 'Limited Warranty' | 'Expired' | 'Out of Warranty';
  coverageEndDate: string;
  agreementNumber: string;
  appleCareEligible: boolean;
  hardwareCoverage: 'Covered' | 'Expired' | 'Pending Review';
  techSupportCoverage: 'Active' | 'Expired';
  lastSyncTimestamp: string;
}

export interface ChangeLogEntry {
  id: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  timestamp: string;
  performedBy: string;
  action: 
    | 'REASSIGN' 
    | 'STATUS_CHANGE' 
    | 'LOCATION_CHANGE' 
    | 'SPEC_UPDATE' 
    | 'JIRA_LINK' 
    | 'CHECK_IN' 
    | 'CHECK_OUT' 
    | 'WARRANTY_SYNC' 
    | 'CREATED'
    | 'PROCUREMENT_LINK'
    | 'PROCUREMENT_FULFILL'
    | 'PROCUREMENT_OVERRIDE';
  property: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  jiraTicketKey?: string;
  procurementRequestNumber?: string;
}

export interface Asset {
  id: string;
  assetTag: string; // e.g. "AST-9402"
  barcode: string;  // e.g. "8821940210"
  name: string;
  manufacturer: string;
  model: string;
  category: AssetCategory;
  serialNumber: string;
  status: AssetStatus;
  location: string;
  assignedTo: Assignee | null;
  purchaseDate: string;
  purchasePrice: number;
  supplier: string;
  warrantyExpiry: string;
  specs: HardwareSpecs;
  appleCoverage?: AppleCoverage;
  linkedJiraKey?: string;
  linkedProcurementId?: string;
  purchaseOrderNumber?: string;
  notes?: string;
  changeLogs: ChangeLogEntry[];
}

export interface JiraTicket {
  id?: string;
  key: string; // e.g. "SYS-1048"
  summary: string;
  description: string;
  issueType?: 'Hardware Request' | 'Defect / Repair' | 'Decommission' | 'New Hire Provisioning';
  status: 'Open' | 'In Progress' | 'Awaiting Hardware' | 'Fulfilled' | 'Closed';
  priority: 'Highest' | 'High' | 'Medium' | 'Low';
  requester: {
    name: string;
    email: string;
    department: string;
  };
  requestedCategory?: AssetCategory; // Structured requested category
  requestedEquipment?: string;
  requestedHardware?: string;
  createdAt?: string;
  createdDate?: string;
  updatedAt?: string;
  linkedAssetTag?: string;
  fulfilledAssetTag?: string;
}

export interface InventoryThreshold {
  category: AssetCategory;
  modelName: string;
  minQuantity: number;
  criticalThreshold: number;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
  department: string;
}

// ---------------------------------------------------------------------------
// Procurement Module Types
// ---------------------------------------------------------------------------

export type ProcurementStatus =
  | 'Draft'
  | 'Submitted'
  | 'IT Head Review'
  | 'Finance Review'
  | 'Purchasing Queue'
  | 'Ordered'
  | 'Shipped'
  | 'Partially Received'
  | 'Received'
  | 'Asset Registration'
  | 'Assigned/Fulfilled'
  | 'Closed'
  | 'Changes Requested'
  | 'Rejected'
  | 'Cancelled';

export type ProcurementRole = 
  | 'requester' 
  | 'it_head' 
  | 'finance' 
  | 'purchasing' 
  | 'purchasing_buyer'
  | 'asset_manager';

export type ProcurementViewType = 'my_requests' | 'awaiting_approval' | 'purchasing_queue' | 'all_requests';

export interface SimulatedUserRole {
  id: ProcurementRole;
  name: string;
  email: string;
  title?: string;
  department: string;
  badge: string;
  description?: string;
  exportScope?: string;
}

export type ProcurementUrgency = 'Standard' | 'Urgent' | 'Critical';
export type ProcurementRequestType = 'New Equipment' | 'Replacement';

export interface ApprovalDecision {
  id: string;
  stage?: 'IT Head Review' | 'Finance Review';
  level?: string;
  approverName: string;
  approverRole?: string;
  approverEmail?: string;
  decision: 'Approved' | 'Rejected' | 'Changes Requested';
  timestamp: string;
  reason?: string;
}

export interface PurchaseOrderInfo {
  poNumber: string;
  vendor: string;
  finalUnitPrice: number;
  quantity: number;
  currency: string;
  orderDate: string;
  expectedDeliveryDate: string;
  trackingReference?: string;
  purchasingNotes?: string;
  finalTotalCost: number;
}

export interface DeliveryReceipt {
  id: string;
  quantityReceived: number;
  receiptDate: string;
  receiver: string;
  deliveryReference: string;
  notes?: string;
}

export interface ProcurementAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  role: string;
  requestNumber: string;
  action: string;
  previousState: string;
  newState: string;
  notes?: string;
}

export interface ProcurementRequest {
  id: string;
  requestNumber: string; // e.g. "PR-2026-0001"
  status: ProcurementStatus;
  requester: {
    name: string;
    email: string;
    department: string;
  };
  department: string;
  manager: string;
  costCentre: string;
  category: AssetCategory;
  preferredModel: string;
  quantity: number;
  businessJustification: string;
  requestType: ProcurementRequestType;
  requiredByDate: string;
  urgency: ProcurementUrgency;
  estimatedUnitPrice: number;
  currency: string;
  estimatedTotalCost: number;
  preferredVendor: string;
  vendorQuoteReference?: string;
  replacementAssetTag?: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
  approvals: ApprovalDecision[];
  purchaseOrder?: PurchaseOrderInfo;
  receipts: DeliveryReceipt[];
  totalReceivedQuantity: number;
  registeredAssetTags: string[];
  fulfilledAssetTags: string[];
  stockFulfilled?: boolean;
  overrideStockMismatch?: boolean;
  rejectionReason?: string;
  changesRequestedReason?: string;
  financeApprovedAmount?: number;
  auditLogs: ProcurementAuditLog[];
}

export interface UnifiedAuditLog {
  id: string;
  timestamp: string;
  source: 'Procurement' | 'Hardware Fleet';
  reference: string;
  referenceType: 'PR' | 'AST';
  action: string;
  property: string;
  oldValue: string;
  newValue: string;
  performedBy: string;
  role?: string;
  reason?: string;
  poNumber?: string;
  deliveryReference?: string;
  jiraTicketKey?: string;
}

