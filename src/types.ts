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
  processor: string;
  ram: string;
  storage: string;
  display?: string;
  os?: string;
  batteryHealth?: number; // 0-100%
  batteryCycles?: number;
  graphics?: string;
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
    | 'CREATED';
  property: string;
  oldValue: string;
  newValue: string;
  reason?: string;
  jiraTicketKey?: string;
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
