import { ProcurementRequest } from '../types';

export const INITIAL_PROCUREMENT_REQUESTS: ProcurementRequest[] = [
  {
    id: 'pr-001',
    requestNumber: 'PR-2026-0001',
    status: 'IT Head Review',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin (Director of Platform)',
    costCentre: 'CC-ENG-4402',
    category: 'Laptop',
    preferredModel: 'MacBook Pro 16" Apple M3 Max (64GB RAM, 2TB SSD)',
    quantity: 1,
    businessJustification: 'Local compilation of distributed consensus nodes and telemetry microservices required for production deployments.',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-15',
    urgency: 'Urgent',
    estimatedUnitPrice: 3499,
    currency: 'USD',
    estimatedTotalCost: 3499,
    preferredVendor: 'Apple Enterprise Direct',
    vendorQuoteReference: 'APL-Q-99482',
    additionalNotes: 'Requires Space Black finish with US ANSI keyboard layout.',
    createdAt: '2026-09-12T09:30:00Z',
    updatedAt: '2026-09-12T09:30:00Z',
    approvals: [],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-1-1',
        timestamp: '2026-09-12T09:30:00Z',
        actor: 'Elena Rostova',
        role: 'Requester',
        requestNumber: 'PR-2026-0001',
        action: 'Request Submitted',
        previousState: 'Draft',
        newState: 'IT Head Review',
        notes: 'Submitted for IT Head evaluation.'
      }
    ]
  },
  {
    id: 'pr-002',
    requestNumber: 'PR-2026-0002',
    status: 'Finance Review',
    requester: {
      name: 'Liam Chen',
      email: 'liam.chen@meshconnect.internal',
      department: 'Frontend Engineering'
    },
    department: 'Frontend Engineering',
    manager: 'Wasim Akhtar',
    costCentre: 'CC-ENG-4401',
    category: 'Display',
    preferredModel: 'Apple Studio Display 27" 5K (Nano-texture Glass, Tilt-adjustable Stand)',
    quantity: 2,
    businessJustification: 'Dual high-DPI display setup for high-fidelity UI engineering and precision color calibration.',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-20',
    urgency: 'Standard',
    estimatedUnitPrice: 1899,
    currency: 'USD',
    estimatedTotalCost: 3798,
    preferredVendor: 'Apple Enterprise Direct',
    vendorQuoteReference: 'APL-Q-99712',
    financeApprovedAmount: 3798,
    createdAt: '2026-09-10T11:00:00Z',
    updatedAt: '2026-09-11T14:20:00Z',
    approvals: [
      {
        id: 'appr-pr-2-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Lead & Infrastructure Head',
        decision: 'Approved',
        timestamp: '2026-09-11T14:20:00Z',
        reason: 'Technical compatibility and dual-display workstation power requirements confirmed.'
      }
    ],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-2-2',
        timestamp: '2026-09-11T14:20:00Z',
        actor: 'Wasim Akhtar',
        role: 'IT Head',
        requestNumber: 'PR-2026-0002',
        action: 'IT Head Approval',
        previousState: 'IT Head Review',
        newState: 'Finance Review',
        notes: 'Technical specifications approved. Forwarded for financial budget authorization.'
      },
      {
        id: 'audit-pr-2-1',
        timestamp: '2026-09-10T11:00:00Z',
        actor: 'Liam Chen',
        role: 'Requester',
        requestNumber: 'PR-2026-0002',
        action: 'Request Submitted',
        previousState: 'Draft',
        newState: 'IT Head Review',
        notes: 'Submitted for hardware evaluation.'
      }
    ]
  },
  {
    id: 'pr-003',
    requestNumber: 'PR-2026-0003',
    status: 'Purchasing Queue',
    requester: {
      name: 'Sofia Alvarez',
      email: 'sofia.alvarez@meshconnect.internal',
      department: 'Data Engineering'
    },
    department: 'Data Engineering',
    manager: 'Raj Patel (Head of Data)',
    costCentre: 'CC-DAT-3301',
    category: 'Dock',
    preferredModel: 'CalDigit TS4 Thunderbolt 4 Station (18 Ports, 98W Power Delivery)',
    quantity: 3,
    businessJustification: 'Standardization on Thunderbolt 4 multi-monitor docking for analytics team.',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-01',
    urgency: 'Standard',
    estimatedUnitPrice: 399,
    currency: 'USD',
    estimatedTotalCost: 1197,
    financeApprovedAmount: 1197,
    preferredVendor: 'CalDigit Enterprise',
    vendorQuoteReference: 'CD-2026-114',
    createdAt: '2026-09-08T10:15:00Z',
    updatedAt: '2026-09-09T16:00:00Z',
    approvals: [
      {
        id: 'appr-pr-3-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Lead',
        decision: 'Approved',
        timestamp: '2026-09-09T11:00:00Z',
        reason: 'Depot stock at zero. Approved for procurement.'
      },
      {
        id: 'appr-pr-3-2',
        stage: 'Finance Review',
        approverName: 'Marcus Vance',
        approverRole: 'Financial Controller',
        decision: 'Approved',
        timestamp: '2026-09-09T16:00:00Z',
        reason: 'Authorized within Q3 hardware budget.'
      }
    ],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-3-3',
        timestamp: '2026-09-09T16:00:00Z',
        actor: 'Marcus Vance',
        role: 'Finance Approver',
        requestNumber: 'PR-2026-0003',
        action: 'Finance Approval',
        previousState: 'Finance Review',
        newState: 'Purchasing Queue',
        notes: 'Budget approved for USD 1,197. Ready for purchase order generation.'
      }
    ]
  },
  {
    id: 'pr-004',
    requestNumber: 'PR-2026-0004',
    status: 'Shipped',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin',
    costCentre: 'CC-ENG-4402',
    category: 'Keyboard',
    preferredModel: 'Keychron Q1 Pro Wireless Custom Mechanical Keyboard (Banana Switches)',
    quantity: 2,
    businessJustification: 'Ergonomic mechanical keyboard replacements for platform engineering leads.',
    requestType: 'Replacement',
    requiredByDate: '2026-09-28',
    urgency: 'Standard',
    estimatedUnitPrice: 199,
    currency: 'USD',
    estimatedTotalCost: 398,
    financeApprovedAmount: 398,
    preferredVendor: 'Keychron Direct',
    purchaseOrder: {
      poNumber: 'PO-2026-0104',
      vendor: 'Keychron Direct',
      finalUnitPrice: 199,
      quantity: 2,
      currency: 'USD',
      orderDate: '2026-09-12',
      expectedDeliveryDate: '2026-09-20',
      trackingReference: '1Z9999999999999999',
      purchasingNotes: 'Dispatched via UPS Express. Signature required.',
      finalTotalCost: 398
    },
    createdAt: '2026-09-05T08:00:00Z',
    updatedAt: '2026-09-13T10:00:00Z',
    approvals: [
      {
        id: 'appr-pr-4-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Lead',
        decision: 'Approved',
        timestamp: '2026-09-06T09:00:00Z'
      },
      {
        id: 'appr-pr-4-2',
        stage: 'Finance Review',
        approverName: 'Marcus Vance',
        approverRole: 'Financial Controller',
        decision: 'Approved',
        timestamp: '2026-09-07T10:00:00Z'
      }
    ],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-4-4',
        timestamp: '2026-09-13T10:00:00Z',
        actor: 'Diana Sterling',
        role: 'Purchasing Buyer',
        requestNumber: 'PR-2026-0004',
        action: 'Order Dispatched / In Transit',
        previousState: 'Ordered',
        newState: 'Shipped',
        notes: 'UPS tracking: 1Z9999999999999999.'
      }
    ]
  },
  {
    id: 'pr-005',
    requestNumber: 'PR-2026-0005',
    status: 'Draft',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin',
    costCentre: 'CC-ENG-4402',
    category: 'Audio/Headset',
    preferredModel: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    quantity: 1,
    businessJustification: 'Acoustic isolation for open office focus during infrastructure deployments.',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-30',
    urgency: 'Standard',
    estimatedUnitPrice: 399,
    currency: 'USD',
    estimatedTotalCost: 399,
    preferredVendor: 'B&H Photo Video Enterprise',
    createdAt: '2026-09-15T14:00:00Z',
    updatedAt: '2026-09-15T14:00:00Z',
    approvals: [],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-5-1',
        timestamp: '2026-09-15T14:00:00Z',
        actor: 'Elena Rostova',
        role: 'Requester',
        requestNumber: 'PR-2026-0005',
        action: 'Draft Created',
        previousState: 'None',
        newState: 'Draft',
        notes: 'Unfinished draft saved.'
      }
    ]
  },
  {
    id: 'pr-006',
    requestNumber: 'PR-2026-0006',
    status: 'Changes Requested',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin',
    costCentre: 'CC-ENG-4402',
    category: 'Mouse',
    preferredModel: 'Logitech MX Master 3S Wireless Performance Mouse',
    quantity: 3,
    businessJustification: 'High-precision wireless input peripherals for test automation bench engineers.',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-10',
    urgency: 'Standard',
    estimatedUnitPrice: 99,
    currency: 'USD',
    estimatedTotalCost: 297,
    preferredVendor: 'Logitech Business Direct',
    createdAt: '2026-09-11T11:00:00Z',
    updatedAt: '2026-09-12T14:30:00Z',
    approvals: [],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-6-1',
        timestamp: '2026-09-11T11:00:00Z',
        actor: 'Elena Rostova',
        role: 'Requester',
        requestNumber: 'PR-2026-0006',
        action: 'Request Submitted',
        previousState: 'Draft',
        newState: 'IT Head Review',
        notes: 'Submitted for hardware allocation.'
      },
      {
        id: 'audit-pr-6-2',
        timestamp: '2026-09-12T14:30:00Z',
        actor: 'Wasim Akhtar',
        role: 'IT Lead',
        requestNumber: 'PR-2026-0006',
        action: 'Changes Requested',
        previousState: 'IT Head Review',
        newState: 'Changes Requested',
        notes: 'Please verify whether Bluetooth or Bolt receivers are required for the target workstations.'
      }
    ]
  },
  {
    id: 'pr-007',
    requestNumber: 'PR-2026-0007',
    status: 'Ordered',
    requester: {
      name: 'Liam Chen',
      email: 'liam.chen@meshconnect.internal',
      department: 'Frontend Engineering'
    },
    department: 'Frontend Engineering',
    manager: 'Wasim Akhtar',
    costCentre: 'CC-ENG-4401',
    category: 'Display',
    preferredModel: 'Dell UltraSharp 32" 4K Video Conferencing Monitor (U3223VZ)',
    quantity: 1,
    businessJustification: 'High-resolution integrated display and 4K webcam for remote engineering standups.',
    requestType: 'New Equipment',
    requiredByDate: '2026-09-05',
    urgency: 'Urgent',
    estimatedUnitPrice: 899,
    currency: 'USD',
    estimatedTotalCost: 899,
    financeApprovedAmount: 899,
    preferredVendor: 'Dell Enterprise Direct',
    purchaseOrder: {
      poNumber: 'PO-2026-0098',
      vendor: 'Dell Enterprise Direct',
      finalUnitPrice: 899,
      quantity: 1,
      currency: 'USD',
      orderDate: '2026-08-25',
      expectedDeliveryDate: '2026-09-02',
      trackingReference: '1Z8820192830192831',
      purchasingNotes: 'Carrier delayed at distribution hub. Expedited tracking requested.',
      finalTotalCost: 899
    },
    createdAt: '2026-08-20T08:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z',
    approvals: [
      {
        id: 'appr-pr-7-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Lead',
        decision: 'Approved',
        timestamp: '2026-08-22T09:00:00Z'
      },
      {
        id: 'appr-pr-7-2',
        stage: 'Finance Review',
        approverName: 'Marcus Vance',
        approverRole: 'Financial Controller',
        decision: 'Approved',
        timestamp: '2026-08-24T10:00:00Z'
      }
    ],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [
      {
        id: 'audit-pr-7-1',
        timestamp: '2026-08-25T11:00:00Z',
        actor: 'Diana Sterling',
        role: 'Purchasing Buyer',
        requestNumber: 'PR-2026-0007',
        action: 'Purchase Order Issued',
        previousState: 'Purchasing Queue',
        newState: 'Ordered',
        notes: 'PO issued. Carrier tracking 1Z8820192830192831.'
      }
    ]
  }
];
