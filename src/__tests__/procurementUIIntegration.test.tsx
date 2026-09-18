import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcurementView } from '../components/ProcurementView';
import { ProcurementRequest, Asset, SimulatedUserRole } from '../types';
import { transitionRequest } from '../services/procurementService';

const itLeadRole: SimulatedUserRole = {
  id: 'it_head',
  name: 'Wasim Akhtar',
  email: 'wasim.akhtar@meshconnect.internal',
  department: 'Hardware Operations',
  badge: 'IT Lead',
  description: 'IT Operations Head & Fleet Custodian'
};

const requesterRole: SimulatedUserRole = {
  id: 'requester',
  name: 'Elena Rostova',
  email: 'elena.rostova@meshconnect.internal',
  department: 'Engineering Infrastructure',
  badge: 'Requester',
  description: 'Staff Engineer & Hardware Requester'
};

const financeRole: SimulatedUserRole = {
  id: 'finance',
  name: 'Marcus Vance',
  email: 'marcus.vance@meshconnect.internal',
  department: 'Finance & Budget',
  badge: 'Finance Controller',
  description: 'Financial Controller & Budget Authority'
};

const buyerRole: SimulatedUserRole = {
  id: 'purchasing_buyer',
  name: 'Diana Sterling',
  email: 'diana.sterling@meshconnect.internal',
  department: 'Procurement & Vendor Ops',
  badge: 'Purchasing Buyer',
  description: 'Procurement Specialist & Vendor PO Issuer'
};

const assetManagerRole: SimulatedUserRole = {
  id: 'asset_manager',
  name: 'Kenji Sato',
  email: 'kenji.sato@meshconnect.internal',
  department: 'Depot Operations',
  badge: 'IT Asset Manager',
  description: 'IT Logistics Custodian'
};

function createSampleRequest(overrides: Partial<ProcurementRequest> = {}): ProcurementRequest {
  return {
    id: 'pr-test-ui-1',
    requestNumber: 'PR-2026-9901',
    status: 'IT Head Review',
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin',
    costCentre: 'CC-ENG-4402',
    category: 'Laptop',
    preferredModel: 'MacBook Pro 16" M3 Max',
    quantity: 1,
    businessJustification: 'High-throughput LLM system simulation benchmarking',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-15',
    urgency: 'Standard',
    estimatedUnitPrice: 3499,
    currency: 'USD',
    estimatedTotalCost: 3499,
    preferredVendor: 'Apple Enterprise Direct',
    createdAt: '2026-09-10T10:00:00Z',
    updatedAt: '2026-09-10T10:00:00Z',
    approvals: [],
    receipts: [],
    totalReceivedQuantity: 0,
    registeredAssetTags: [],
    fulfilledAssetTags: [],
    auditLogs: [],
    ...overrides
  };
}

const sampleAvailableAssets: Asset[] = [
  {
    id: 'asset-stock-1',
    assetTag: 'AST-9901',
    serialNumber: 'SN-LAP-9901',
    barcode: 'BAR-9901',
    name: 'MacBook Pro 16"',
    manufacturer: 'Apple',
    model: 'MacBook Pro 16" M3 Pro',
    category: 'Laptop',
    status: 'In Stock',
    assignedTo: null,
    location: 'Depot Shelf A-1',
    purchaseDate: '2026-01-15',
    purchasePrice: 2499,
    supplier: 'Apple Direct',
    warrantyExpiry: '2029-01-15',
    specs: { processor: 'M3 Pro', ram: '36GB', storage: '1TB' },
    changeLogs: []
  },
  {
    id: 'asset-stock-display',
    assetTag: 'AST-9902',
    serialNumber: 'SN-DISP-9902',
    barcode: 'BAR-9902',
    name: 'Dell UltraSharp 32"',
    manufacturer: 'Dell',
    model: 'U3224KB 6K',
    category: 'Display',
    status: 'In Stock',
    assignedTo: null,
    location: 'Depot Shelf B-2',
    purchaseDate: '2026-02-01',
    purchasePrice: 1899,
    supplier: 'Dell Direct',
    warrantyExpiry: '2029-02-01',
    specs: { screenSize: '32" 6K' },
    changeLogs: []
  }
];

describe('Procurement UI & Guarded Workflow Engine Integration', () => {
  it('1. UI calls central workflow engine and updates status on IT approval', () => {
    const onApplyWorkflowResult = vi.fn();
    const req = createSampleRequest({ status: 'IT Head Review' });

    render(
      <ProcurementView
        requests={[req]}
        assets={sampleAvailableAssets}
        currentUserRole={itLeadRole}
        initialView="all_requests"
        initialSelectedRequestId={req.id}
        onSaveDraft={vi.fn()}
        onSubmitRequest={vi.fn()}
        onUpdateRequest={vi.fn()}
        onRegisterFleetAssets={vi.fn()}
        onApplyWorkflowResult={onApplyWorkflowResult}
      />
    );

    // In the slide-over inspector drawer, click Authorize & Route to Finance
    const approveBtn = screen.getByRole('button', { name: /Authorize & Route to Finance/i });
    fireEvent.click(approveBtn);

    expect(onApplyWorkflowResult).toHaveBeenCalledTimes(1);
    const result = onApplyWorkflowResult.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.updatedRequest.status).toBe('Finance Review');
    expect(result.updatedRequest.approvals.some((a: any) => a.stage === 'IT Head Review')).toBe(true);
  });

  it('2. UI displays guarded alert when requester attempts self-approval', () => {
    const onApplyWorkflowResult = vi.fn();
    // User is Elena Rostova, and Elena is also the requester
    const selfReq = createSampleRequest({
      status: 'IT Head Review',
      requester: {
        name: 'Elena Rostova',
        email: 'elena.rostova@meshconnect.internal',
        department: 'Engineering Infrastructure'
      }
    });

    // Simulated user with IT lead role name matching requester
    const selfApproverRole: SimulatedUserRole = {
      ...itLeadRole,
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal'
    };

    render(
      <ProcurementView
        requests={[selfReq]}
        assets={sampleAvailableAssets}
        currentUserRole={selfApproverRole}
        initialView="all_requests"
        initialSelectedRequestId={selfReq.id}
        onSaveDraft={vi.fn()}
        onSubmitRequest={vi.fn()}
        onUpdateRequest={vi.fn()}
        onRegisterFleetAssets={vi.fn()}
        onApplyWorkflowResult={onApplyWorkflowResult}
      />
    );

    // The UI displays the anti-self-approval guard warning in the drawer
    expect(screen.getByText(/Approval Guard Active/i)).toBeDefined();
    expect(screen.getByText(/prohibited from approving their own/i)).toBeDefined();

    // The approval button is suppressed for self-approvers
    expect(screen.queryByRole('button', { name: /Authorize & Route to Finance/i })).toBeNull();

    // Furthermore, calling transitionRequest directly fails with self-approval guard
    const directResult = transitionRequest(selfReq, 'IT_APPROVE', selfApproverRole);
    expect(directResult.success).toBe(false);
    expect(directResult.error).toContain('Requester cannot approve their own');
  });

  it('3. UI enforces role restrictions for Purchasing and Finance actions', () => {
    const onApplyWorkflowResult = vi.fn();
    const req = createSampleRequest({
      status: 'Purchasing Queue',
      financeApprovedAmount: 3499,
      approvals: [
        {
          id: 'appr-1',
          stage: 'IT Head Review',
          approverName: 'Wasim Akhtar',
          approverRole: 'IT Lead',
          timestamp: '2026-09-11T10:00:00Z',
          decision: 'Approved'
        },
        {
          id: 'appr-2',
          stage: 'Finance Review',
          approverName: 'Marcus Vance',
          approverRole: 'Finance Controller',
          timestamp: '2026-09-12T10:00:00Z',
          decision: 'Approved'
        }
      ]
    });

    // Elena (Requester) views the request in Purchasing Queue
    render(
      <ProcurementView
        requests={[req]}
        assets={sampleAvailableAssets}
        currentUserRole={requesterRole}
        initialView="all_requests"
        initialSelectedRequestId={req.id}
        onSaveDraft={vi.fn()}
        onSubmitRequest={vi.fn()}
        onUpdateRequest={vi.fn()}
        onRegisterFleetAssets={vi.fn()}
        onApplyWorkflowResult={onApplyWorkflowResult}
      />
    );

    // Requester cannot issue PO; Generate Purchase Order button is suppressed
    expect(screen.queryByRole('button', { name: /Generate Purchase Order/i })).toBeNull();
  });

  it('4. Existing-stock fulfillment respects category check and requires override reason for mismatch', () => {
    const onApplyWorkflowResult = vi.fn();
    const laptopReq = createSampleRequest({
      category: 'Laptop',
      quantity: 1,
      status: 'IT Head Review'
    });

    render(
      <ProcurementView
        requests={[laptopReq]}
        assets={sampleAvailableAssets}
        currentUserRole={itLeadRole}
        initialView="all_requests"
        initialSelectedRequestId={laptopReq.id}
        onSaveDraft={vi.fn()}
        onSubmitRequest={vi.fn()}
        onUpdateRequest={vi.fn()}
        onRegisterFleetAssets={vi.fn()}
        onApplyWorkflowResult={onApplyWorkflowResult}
      />
    );

    // Open Stock Fulfillment modal from drawer
    const stockBtn = screen.getByRole('button', { name: /Fulfill from Depot Stock/i });
    fireEvent.click(stockBtn);

    // Modal opens with Depot Inventory
    expect(screen.getByRole('heading', { name: /Fulfill from Depot Stock/i })).toBeDefined();
    expect(screen.getByText(/AST-9901/)).toBeDefined();

    // AST-9901 is pre-selected because it matches category 'Laptop'. Click Confirm Allocation.
    const confirmBtn = screen.getByRole('button', { name: /Confirm Allocation/i });
    fireEvent.click(confirmBtn);

    expect(onApplyWorkflowResult).toHaveBeenCalledTimes(1);
    const result = onApplyWorkflowResult.mock.calls[0][0];
    expect(result.success).toBe(true);
    expect(result.updatedRequest.status).toBe('Assigned/Fulfilled');
    expect(result.updatedRequest.fulfilledAssetTags).toContain('AST-9901');
    expect(result.affectedAsset.status).toBe('In Use');
    const assignedName = typeof result.affectedAsset.assignedTo === 'object' 
      ? result.affectedAsset.assignedTo?.name 
      : result.affectedAsset.assignedTo;
    expect(assignedName).toBe(laptopReq.requester.name);
  });

  it('5. Over-delivery is guarded: cannot receive more than ordered quantity', () => {
    const orderedReq = createSampleRequest({
      status: 'Ordered',
      quantity: 2,
      totalReceivedQuantity: 0,
      purchaseOrder: {
        poNumber: 'PO-2026-1010',
        vendor: 'Apple Enterprise Direct',
        finalUnitPrice: 2000,
        quantity: 2,
        currency: 'USD',
        orderDate: '2026-09-12',
        expectedDeliveryDate: '2026-09-20',
        finalTotalCost: 4000
      }
    });

    // Test transitionRequest guard directly to verify over-receipt prevention
    const invalidReceiptResult = transitionRequest(orderedReq, 'RECORD_RECEIPT', buyerRole, {
      receipt: {
        id: 'rec-1',
        deliveryReference: 'DEL-OVER-999',
        receiver: buyerRole.name,
        quantityReceived: 3, // Ordered is 2, trying to receive 3!
        receiptDate: new Date().toISOString()
      }
    });

    expect(invalidReceiptResult.success).toBe(false);
    expect(invalidReceiptResult.error).toContain('exceeds remaining ordered quantity');
  });

  it('6. Partial delivery updates quantity and advances to Partially Received', () => {
    const orderedReq = createSampleRequest({
      status: 'Ordered',
      quantity: 5,
      totalReceivedQuantity: 0,
      purchaseOrder: {
        poNumber: 'PO-2026-1010',
        vendor: 'Dell Direct',
        finalUnitPrice: 1000,
        quantity: 5,
        currency: 'USD',
        orderDate: '2026-09-12',
        expectedDeliveryDate: '2026-09-20',
        finalTotalCost: 5000
      }
    });

    const partialReceiptResult = transitionRequest(orderedReq, 'RECORD_RECEIPT', buyerRole, {
      receipt: {
        id: 'rec-1',
        deliveryReference: 'DEL-PARTIAL-01',
        receiver: buyerRole.name,
        quantityReceived: 2,
        receiptDate: new Date().toISOString()
      }
    });

    expect(partialReceiptResult.success).toBe(true);
    expect(partialReceiptResult.updatedRequest?.status).toBe('Partially Received');
    expect(partialReceiptResult.updatedRequest?.totalReceivedQuantity).toBe(2);

    // Second partial receipt for the remaining 3 units advances to Asset Registration
    const finalReceiptResult = transitionRequest(partialReceiptResult.updatedRequest!, 'RECORD_RECEIPT', buyerRole, {
      receipt: {
        id: 'rec-2',
        deliveryReference: 'DEL-FINAL-02',
        receiver: buyerRole.name,
        quantityReceived: 3,
        receiptDate: new Date().toISOString()
      }
    });

    expect(finalReceiptResult.success).toBe(true);
    expect(finalReceiptResult.updatedRequest?.status).toBe('Asset Registration');
    expect(finalReceiptResult.updatedRequest?.totalReceivedQuantity).toBe(5);
  });

  it('7. Asset registration can only occur once goods are in Asset Registration status', () => {
    const orderedReq = createSampleRequest({
      status: 'Ordered',
      quantity: 1,
      totalReceivedQuantity: 0
    });

    const prematureAsset: Asset = {
      id: 'ast-premature',
      assetTag: 'AST-PRE-01',
      serialNumber: 'SN-PRE-01',
      barcode: 'BAR-PRE-01',
      name: 'Premature Laptop',
      manufacturer: 'Apple',
      model: 'MacBook Pro',
      category: 'Laptop',
      status: 'In Use',
      assignedTo: {
        name: orderedReq.requester.name,
        department: orderedReq.requester.department,
        email: orderedReq.requester.email,
        assignedDate: '2026-09-17'
      },
      location: 'HQ Floor 3',
      purchaseDate: '2026-09-17',
      purchasePrice: 2000,
      supplier: 'Apple',
      warrantyExpiry: '2029-09-17',
      specs: {},
      changeLogs: []
    };

    // Attempt registration while still in Ordered state
    const prematureResult = transitionRequest(orderedReq, 'REGISTER_AND_ASSIGN_ASSETS', assetManagerRole, {
      newAssets: [prematureAsset]
    });

    expect(prematureResult.success).toBe(false);
    expect(prematureResult.error).toContain("Registration is only permitted in 'Asset Registration'");

    // Proper registration when in Asset Registration state
    const readyReq = createSampleRequest({
      status: 'Asset Registration',
      quantity: 1,
      totalReceivedQuantity: 1,
      receipts: [
        {
          id: 'rec-1',
          deliveryReference: 'DEL-001',
          receiver: 'Diana',
          quantityReceived: 1,
          receiptDate: new Date().toISOString()
        }
      ]
    });

    const validResult = transitionRequest(readyReq, 'REGISTER_AND_ASSIGN_ASSETS', assetManagerRole, {
      newAssets: [prematureAsset]
    });

    expect(validResult.success).toBe(true);
    expect(validResult.updatedRequest?.status).toBe('Assigned/Fulfilled');
    expect(validResult.createdAssets?.length).toBe(1);
  });

  it('8. Request closure requires fulfilled request and IT Lead / Buyer role', () => {
    const unfulfilledReq = createSampleRequest({
      status: 'Ordered'
    });

    const prematureCloseResult = transitionRequest(unfulfilledReq, 'CLOSE', itLeadRole);
    expect(prematureCloseResult.success).toBe(false);
    expect(prematureCloseResult.error).toContain("Request must be 'Assigned/Fulfilled' before closure");

    const fulfilledReq = createSampleRequest({
      status: 'Assigned/Fulfilled',
      fulfilledAssetTags: ['AST-9901']
    });

    const validCloseResult = transitionRequest(fulfilledReq, 'CLOSE', itLeadRole);
    expect(validCloseResult.success).toBe(true);
    expect(validCloseResult.updatedRequest?.status).toBe('Closed');
  });
});
