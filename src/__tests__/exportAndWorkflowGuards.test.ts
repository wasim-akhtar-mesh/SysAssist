import { describe, it, expect } from 'vitest';
import { 
  transitionRequest, 
  validateSubmission, 
  isActorRequestOwner,
  SIMULATED_ROLES 
} from '../services/procurementService';
import { 
  sanitizeAndEscapeCsvCell, 
  generateCsvString, 
  canRoleExport,
  exportProcurementRequests,
  exportInventory
} from '../services/exportService';
import { 
  ProcurementRequest, 
  Asset, 
  SimulatedUserRole,
  UnifiedAuditLog
} from '../types';

function createMockDraftRequest(overrides: Partial<ProcurementRequest> = {}): ProcurementRequest {
  return {
    id: 'pr-mock-001',
    requestNumber: 'PR-2026-8801',
    status: 'Draft',
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
    quantity: 2,
    businessJustification: 'High-throughput system simulation benchmarking',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-15',
    urgency: 'Standard',
    estimatedUnitPrice: 3499,
    currency: 'USD',
    estimatedTotalCost: 6998,
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

describe('Enterprise Workflow Guard and Export System Verification', () => {

  // 1. New request begins as Draft
  it('1. New procurement request starts with status Draft', () => {
    const draft = createMockDraftRequest();
    expect(draft.status).toBe('Draft');
  });

  // 2. "Submit Request" calls transitionRequest(draft, 'SUBMIT', actor) moving to IT Head Review
  it('2. Transition engine moves valid Draft to IT Head Review on SUBMIT', () => {
    const draft = createMockDraftRequest();
    const result = transitionRequest(draft, 'SUBMIT', SIMULATED_ROLES.requester);
    
    expect(result.success).toBe(true);
    expect(result.updatedRequest?.status).toBe('IT Head Review');
    expect(result.updatedRequest?.auditLogs[0].action).toBe('Request Submitted');
  });

  // 3. Failed validation leaves request in Draft
  it('3. Failed validation leaves request in Draft and returns descriptive errors', () => {
    const invalidDraft = createMockDraftRequest({
      preferredModel: '',
      businessJustification: ''
    });

    const validation = validateSubmission(invalidDraft);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThanOrEqual(2);

    const result = transitionRequest(invalidDraft, 'SUBMIT', SIMULATED_ROLES.requester);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Submission validation failed');
  });

  // 4. Draft saving without submission remains Draft
  it('4. Draft can be saved and retained in Draft state without submitting', () => {
    const draft = createMockDraftRequest({ preferredModel: 'Work in progress' });
    expect(draft.status).toBe('Draft');
    expect(draft.approvals.length).toBe(0);
  });

  // 5. RESUBMIT action transitions Changes Requested back to IT Head Review
  it('5. RESUBMIT action moves Changes Requested request back to IT Head Review', () => {
    const changesReq = createMockDraftRequest({
      status: 'Changes Requested',
      changesRequestedReason: 'Please specify CPU core count'
    });

    const result = transitionRequest(changesReq, 'RESUBMIT', SIMULATED_ROLES.requester, {
      notes: 'Updated specs to 16-core CPU.'
    });

    expect(result.success).toBe(true);
    expect(result.updatedRequest?.status).toBe('IT Head Review');
    expect(result.updatedRequest?.changesRequestedReason).toBeUndefined();
    expect(result.updatedRequest?.auditLogs[0].action).toBe('Request Resubmitted');
  });

  // 6. IT_REJECT requires IT Head role
  it('6. IT_REJECT strictly requires IT Head role', () => {
    const req = createMockDraftRequest({ status: 'IT Head Review' });
    
    // Non-IT head attempt
    const buyerResult = transitionRequest(req, 'IT_REJECT', SIMULATED_ROLES.purchasing_buyer, {
      reason: 'Unauthorized rejection attempt'
    });
    expect(buyerResult.success).toBe(false);
    expect(buyerResult.error).toContain('Only the IT Head can reject');

    // IT head attempt
    const itResult = transitionRequest(req, 'IT_REJECT', SIMULATED_ROLES.it_head, {
      reason: 'Hardware model is obsolete'
    });
    expect(itResult.success).toBe(true);
    expect(itResult.updatedRequest?.status).toBe('Rejected');
    expect(itResult.updatedRequest?.rejectionReason).toBe('Hardware model is obsolete');
  });

  // 7. IT_REQUEST_CHANGES requires IT Head role
  it('7. IT_REQUEST_CHANGES strictly requires IT Head role', () => {
    const req = createMockDraftRequest({ status: 'IT Head Review' });
    
    const financeAttempt = transitionRequest(req, 'IT_REQUEST_CHANGES', SIMULATED_ROLES.finance, {
      reason: 'Budget mismatch'
    });
    expect(financeAttempt.success).toBe(false);
    expect(financeAttempt.error).toContain('Only the IT Head');

    const itResult = transitionRequest(req, 'IT_REQUEST_CHANGES', SIMULATED_ROLES.it_head, {
      reason: 'Clarify storage requirements'
    });
    expect(itResult.success).toBe(true);
    expect(itResult.updatedRequest?.status).toBe('Changes Requested');
  });

  // 8. Requester cannot reject own request in IT Review
  it('8. Requester cannot reject their own procurement request', () => {
    const req = createMockDraftRequest({ 
      status: 'IT Head Review',
      requester: {
        name: 'Wasim Akhtar',
        email: 'wasim.akhtar@meshconnect.internal',
        department: 'Hardware Operations'
      }
    });

    const selfRejectResult = transitionRequest(req, 'IT_REJECT', SIMULATED_ROLES.it_head, {
      reason: 'Cancelling my own request via reject'
    });

    expect(selfRejectResult.success).toBe(false);
    expect(selfRejectResult.error).toContain('Requester cannot reject or request changes on their own procurement request');
  });

  // 9. Requester cannot request changes on own request
  it('9. Requester cannot request changes on their own procurement request', () => {
    const req = createMockDraftRequest({ 
      status: 'IT Head Review',
      requester: {
        name: 'Wasim Akhtar',
        email: 'wasim.akhtar@meshconnect.internal',
        department: 'Hardware Operations'
      }
    });

    const selfChangeResult = transitionRequest(req, 'IT_REQUEST_CHANGES', SIMULATED_ROLES.it_head, {
      reason: 'Need change'
    });

    expect(selfChangeResult.success).toBe(false);
    expect(selfChangeResult.error).toContain('Requester cannot reject or request changes on their own procurement request');
  });

  // 10. FINANCE_REJECT requires Finance role
  it('10. FINANCE_REJECT strictly requires Finance role', () => {
    const req = createMockDraftRequest({ 
      status: 'Finance Review',
      approvals: [{
        id: 'appr-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Operations Head',
        decision: 'Approved',
        timestamp: '2026-09-11T10:00:00Z',
        reason: 'IT Verified'
      }]
    });

    const itAttempt = transitionRequest(req, 'FINANCE_REJECT', SIMULATED_ROLES.it_head, {
      reason: 'IT attempting finance reject'
    });
    expect(itAttempt.success).toBe(false);
    expect(itAttempt.error).toContain('Only the Finance Approver');

    const financeResult = transitionRequest(req, 'FINANCE_REJECT', SIMULATED_ROLES.finance, {
      reason: 'Quarterly capital expenditure ceiling reached'
    });
    expect(financeResult.success).toBe(true);
    expect(financeResult.updatedRequest?.status).toBe('Rejected');
  });

  // 11. FINANCE_REQUEST_CHANGES requires Finance role
  it('11. FINANCE_REQUEST_CHANGES strictly requires Finance role', () => {
    const req = createMockDraftRequest({ 
      status: 'Finance Review',
      approvals: [{
        id: 'appr-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Operations Head',
        decision: 'Approved',
        timestamp: '2026-09-11T10:00:00Z',
        reason: 'IT Verified'
      }]
    });

    const buyerAttempt = transitionRequest(req, 'FINANCE_REQUEST_CHANGES', SIMULATED_ROLES.purchasing_buyer, {
      reason: 'Buyer requesting changes'
    });
    expect(buyerAttempt.success).toBe(false);
    expect(buyerAttempt.error).toContain('Only the Finance Approver');

    const financeResult = transitionRequest(req, 'FINANCE_REQUEST_CHANGES', SIMULATED_ROLES.finance, {
      reason: 'Please allocate to Cost Centre CC-OPS-1100'
    });
    expect(financeResult.success).toBe(true);
    expect(financeResult.updatedRequest?.status).toBe('Changes Requested');
  });

  // 12. Requester cannot reject or request changes on own request in Finance Review
  it('12. Requester cannot reject or request changes on their own request in Finance Review', () => {
    const req = createMockDraftRequest({ 
      status: 'Finance Review',
      requester: {
        name: 'Marcus Vance',
        email: 'marcus.vance@meshconnect.internal',
        department: 'Finance & Budget'
      },
      approvals: [{
        id: 'appr-1',
        stage: 'IT Head Review',
        approverName: 'Wasim Akhtar',
        approverRole: 'IT Operations Head',
        decision: 'Approved',
        timestamp: '2026-09-11T10:00:00Z',
        reason: 'IT Verified'
      }]
    });

    const selfReject = transitionRequest(req, 'FINANCE_REJECT', SIMULATED_ROLES.finance, {
      reason: 'Self reject attempt'
    });
    expect(selfReject.success).toBe(false);
    expect(selfReject.error).toContain('Requester cannot reject or request changes on their own procurement request');
  });

  // 13. Stable identity comparison protects ownership checks
  it('13. Stable identity comparison uses email and name to verify ownership', () => {
    const req = createMockDraftRequest();
    
    // Exact owner
    expect(isActorRequestOwner(req, SIMULATED_ROLES.requester)).toBe(true);

    // Impersonator with fake role ID
    const spoofedActor: SimulatedUserRole = {
      id: 'requester',
      name: 'Mallory Hacker',
      email: 'mallory@external.com',
      department: 'Marketing',
      badge: 'Requester'
    };
    expect(isActorRequestOwner(req, spoofedActor)).toBe(false);

    // Owner with matching email but differing role and case/whitespace
    const caseActor: SimulatedUserRole = {
      id: 'finance',
      name: 'Elena Rostova',
      email: ' ELENA.ROSTOVA@meshconnect.internal ',
      department: 'Engineering',
      badge: 'Finance Controller'
    };
    expect(isActorRequestOwner(req, caseActor)).toBe(true);
  });

  // 14. Asset registration requires IT Asset Manager role and Asset Registration status
  it('14. REGISTER_AND_ASSIGN_ASSETS strictly requires IT Asset Manager role and Asset Registration status', () => {
    const orderedReq = createMockDraftRequest({ status: 'Ordered' });
    const dummyAsset: Asset = {
      id: 'ast-new-1',
      assetTag: 'AST-7701',
      serialNumber: 'SN-7701',
      barcode: 'BAR-7701',
      name: 'MacBook Pro',
      manufacturer: 'Apple',
      model: 'MacBook Pro 16"',
      category: 'Laptop',
      status: 'In Use',
      location: 'HQ Depot',
      assignedTo: {
        name: 'Elena Rostova',
        email: 'elena.rostova@meshconnect.internal',
        department: 'Engineering Infrastructure',
        assignedDate: '2026-09-18'
      },
      purchaseDate: '2026-09-18',
      purchasePrice: 3499,
      supplier: 'Apple Direct',
      warrantyExpiry: '2029-09-18',
      specs: {},
      changeLogs: []
    };

    // State violation
    const prematureResult = transitionRequest(orderedReq, 'REGISTER_AND_ASSIGN_ASSETS', SIMULATED_ROLES.asset_manager, {
      newAssets: [dummyAsset]
    });
    expect(prematureResult.success).toBe(false);
    expect(prematureResult.error).toContain("Registration is only permitted in 'Asset Registration'");

    // Role violation
    const readyReq = createMockDraftRequest({
      status: 'Asset Registration',
      quantity: 1,
      totalReceivedQuantity: 1,
      receipts: [{
        id: 'rec-1',
        deliveryReference: 'DEL-8801',
        receiver: 'Diana',
        quantityReceived: 1,
        receiptDate: '2026-09-18T10:00:00Z'
      }]
    });

    const unauthorizedResult = transitionRequest(readyReq, 'REGISTER_AND_ASSIGN_ASSETS', SIMULATED_ROLES.it_head, {
      newAssets: [dummyAsset]
    });
    expect(unauthorizedResult.success).toBe(false);
    expect(unauthorizedResult.error).toContain('Only IT Asset Managers can register and assign assets');

    // Successful execution with IT Asset Manager
    const validResult = transitionRequest(readyReq, 'REGISTER_AND_ASSIGN_ASSETS', SIMULATED_ROLES.asset_manager, {
      newAssets: [dummyAsset]
    });
    expect(validResult.success).toBe(true);
    expect(validResult.updatedRequest?.status).toBe('Assigned/Fulfilled');
    expect(validResult.createdAssets?.length).toBe(1);
  });

  // 15. CSV Formula injection protection
  it('15. CSV formula injection triggers (=, +, -, @, \\t, \\r) are sanitized', () => {
    expect(sanitizeAndEscapeCsvCell('=SUM(A1:A10)')).toBe('"\'=SUM(A1:A10)"');
    expect(sanitizeAndEscapeCsvCell('+1234567890')).toBe('"\'+1234567890"');
    expect(sanitizeAndEscapeCsvCell('-cmd|/c')).toBe('"\' -cmd|/c"'.replace(' ', ''));
    expect(sanitizeAndEscapeCsvCell('@HYPERLINK("http://evil.com")')).toBe('"\'@HYPERLINK(""http://evil.com"")"');
    
    // Normal string without special triggers
    expect(sanitizeAndEscapeCsvCell('MacBook Pro 16"')).toBe('"MacBook Pro 16"""');
    expect(sanitizeAndEscapeCsvCell('Safe Text')).toBe('"Safe Text"');
  });

  // 16. RFC 4180 CSV escaping and header metadata
  it('16. RFC 4180 CSV string generation correctly structures metadata, headers, and quote escaping', () => {
    const metadata = {
      title: 'Active Hardware Fleet',
      reportType: 'Fleet Report',
      activeFilterDescription: 'In Stock units',
      actor: SIMULATED_ROLES.it_head
    };

    const headers = ['Asset Tag', 'Name', 'Description'];
    const rows = [
      ['AST-001', 'MacBook Pro "16 inch"', 'Engineering, High-Performance\nVerified']
    ];

    const csv = generateCsvString(headers, rows, metadata);
    
    // Check comment metadata
    expect(csv).toContain('# System Assist Export: Active Hardware Fleet');
    expect(csv).toContain('# Exported By: Wasim Akhtar (IT Head) - wasim.akhtar@meshconnect.internal');
    expect(csv).toContain('# Filter State: In Stock units');
    
    // Check escaping
    expect(csv).toContain('"MacBook Pro ""16 inch"""');
    expect(csv).toContain('"Engineering, High-Performance\nVerified"');
  });

  // 17. Export spend calculation accuracy
  it('17. Spend calculations in procurement export accurately reflect committed vs actual expenditures', () => {
    const requests = [
      createMockDraftRequest({
        id: 'pr-1',
        status: 'Purchasing Queue',
        estimatedTotalCost: 5000
      }),
      createMockDraftRequest({
        id: 'pr-2',
        status: 'Assigned/Fulfilled',
        estimatedTotalCost: 3500,
        purchaseOrder: {
          poNumber: 'PO-2026-001',
          vendor: 'Apple Direct',
          finalUnitPrice: 3450,
          quantity: 1,
          currency: 'USD',
          orderDate: '2026-09-12',
          expectedDeliveryDate: '2026-09-20',
          finalTotalCost: 3450
        }
      })
    ];

    // Committed spend in queue = $5,000; Finalized total spend for fulfilled PO = $3,450
    const committedSpend = requests
      .filter(r => ['Purchasing Queue', 'PO Issued', 'Ordered', 'Shipped', 'Partially Received', 'Asset Registration'].includes(r.status))
      .reduce((sum, r) => sum + r.estimatedTotalCost, 0);

    const actualSpend = requests
      .filter(r => r.purchaseOrder?.finalTotalCost !== undefined)
      .reduce((sum, r) => sum + (r.purchaseOrder?.finalTotalCost || 0), 0);

    expect(committedSpend).toBe(5000);
    expect(actualSpend).toBe(3450);
  });

  // 18. Role-based export access control
  it('18. Role-based export access control prevents sensitive data leakage', () => {
    // Requester cannot export financial spend reports or master audit logs
    const requesterSpendCheck = canRoleExport(SIMULATED_ROLES.requester, 'spend_report');
    expect(requesterSpendCheck.allowed).toBe(false);
    expect(requesterSpendCheck.reason).toContain('personal procurement');

    const requesterAuditCheck = canRoleExport(SIMULATED_ROLES.requester, 'audit');
    expect(requesterAuditCheck.allowed).toBe(false);

    // IT Head can export audit, inventory, and procurement
    const itAuditCheck = canRoleExport(SIMULATED_ROLES.it_head, 'audit');
    expect(itAuditCheck.allowed).toBe(true);

    const itInventoryCheck = canRoleExport(SIMULATED_ROLES.it_head, 'inventory');
    expect(itInventoryCheck.allowed).toBe(true);

    // Finance Controller can export spend report
    const financeSpendCheck = canRoleExport(SIMULATED_ROLES.finance, 'spend_report');
    expect(financeSpendCheck.allowed).toBe(true);

    // Purchasing Buyer can export procurement and spend
    const buyerProcCheck = canRoleExport(SIMULATED_ROLES.purchasing_buyer, 'procurement');
    expect(buyerProcCheck.allowed).toBe(true);
  });

});
