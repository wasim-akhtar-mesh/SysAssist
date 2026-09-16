import { describe, it, expect } from 'vitest';
import { 
  canUserApproveRequest, 
  canActorApprove,
  transitionRequest, 
  calculateProcurementMetrics,
  isRequestEditable
} from '../services/procurementService';
import { 
  ProcurementRequest, 
  SimulatedUserRole, 
  ProcurementStatus 
} from '../types';

const itHeadRole: SimulatedUserRole = {
  id: 'it_head',
  name: 'Wasim Akhtar',
  email: 'wasim.akhtar@meshconnect.internal',
  department: 'Hardware Operations',
  badge: 'IT Lead',
  description: 'IT Operations Head'
};

const financeRole: SimulatedUserRole = {
  id: 'finance',
  name: 'Marcus Vance',
  email: 'marcus.vance@meshconnect.internal',
  department: 'Finance & Budget',
  badge: 'Finance Controller',
  description: 'Financial Controller'
};

const requesterRole: SimulatedUserRole = {
  id: 'requester',
  name: 'Elena Rostova',
  email: 'elena.rostova@meshconnect.internal',
  department: 'Engineering Infrastructure',
  badge: 'Requester',
  description: 'Staff Engineer'
};

const purchasingRole: SimulatedUserRole = {
  id: 'purchasing',
  name: 'Diana Sterling',
  email: 'diana.sterling@meshconnect.internal',
  department: 'Procurement & Vendor Ops',
  badge: 'Purchasing Buyer',
  description: 'Purchasing Buyer'
};

function createMockPR(status: ProcurementStatus, overrides: Partial<ProcurementRequest> = {}): ProcurementRequest {
  return {
    id: 'pr-test-1',
    requestNumber: 'PR-2026-0099',
    status,
    requester: {
      name: 'Elena Rostova',
      email: 'elena.rostova@meshconnect.internal',
      department: 'Engineering Infrastructure'
    },
    department: 'Engineering Infrastructure',
    manager: 'Sarah Lin',
    costCentre: 'CC-ENG-4402',
    category: 'Laptop',
    preferredModel: 'ThinkPad P1 Gen 7',
    quantity: 1,
    businessJustification: 'High-throughput system simulation testing',
    requestType: 'New Equipment',
    requiredByDate: '2026-10-15',
    urgency: 'Standard',
    estimatedUnitPrice: 2499,
    currency: 'USD',
    estimatedTotalCost: 2499,
    preferredVendor: 'Lenovo Direct',
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

describe('System Assist Guarded Procurement Workflow', () => {
  describe('Rule 1: Self-Approval Prevention', () => {
    it('prohibits requester from approving their own request even if they hold IT Head role', () => {
      const selfPR = createMockPR('IT Head Review', {
        requester: {
          name: 'Wasim Akhtar',
          email: 'wasim.akhtar@meshconnect.internal',
          department: 'Hardware Operations'
        }
      });

      const check = canUserApproveRequest(selfPR, itHeadRole);
      expect(check.canApprove).toBe(false);
      expect(check.reason).toContain('prohibited from approving their own');
    });

    it('prohibits requester from approving their own request even if they hold Finance role', () => {
      const selfPR = createMockPR('Finance Review', {
        requester: {
          name: 'Marcus Vance',
          email: 'marcus.vance@meshconnect.internal',
          department: 'Finance & Budget'
        }
      });

      const check = canUserApproveRequest(selfPR, financeRole);
      expect(check.canApprove).toBe(false);
      expect(check.reason).toContain('prohibited from approving their own');
    });

    it('permits approval when approver is not the requester', () => {
      const standardPR = createMockPR('IT Head Review');
      const itCheck = canUserApproveRequest(standardPR, itHeadRole);
      expect(itCheck.canApprove).toBe(true);

      const financePR = createMockPR('Finance Review', {
        approvals: [
          {
            id: 'appr-1',
            stage: 'IT Head Review',
            approverName: 'Wasim Akhtar',
            approverRole: 'IT Lead',
            decision: 'Approved',
            timestamp: new Date().toISOString()
          }
        ]
      });
      const finCheck = canUserApproveRequest(financePR, financeRole);
      expect(finCheck.canApprove).toBe(true);
    });
  });

  describe('Rule 2: Dual Approval Chain Order', () => {
    it('does not allow Finance to approve before IT Head Review completes', () => {
      const pr = createMockPR('IT Head Review');
      const finCheck = canUserApproveRequest(pr, financeRole);
      expect(finCheck.canApprove).toBe(false);
    });

    it('does not allow Finance transition without prior IT Head approval', () => {
      const pr = createMockPR('Finance Review', { approvals: [] });
      const finResult = transitionRequest(pr, 'FINANCE_APPROVE', financeRole);
      expect(finResult.success).toBe(false);
      expect(finResult.error).toContain('IT Head approval must occur before');
    });

    it('correctly advances through IT Head -> Finance Review -> Purchasing Queue', () => {
      const initialPR = createMockPR('IT Head Review');

      // 1. IT Head Approves
      const itResult = transitionRequest(initialPR, 'IT_APPROVE', itHeadRole, {
        notes: 'Technical specification verified'
      });
      expect(itResult.success).toBe(true);
      expect(itResult.updatedRequest?.status).toBe('Finance Review');

      // 2. Finance Approves
      const finResult = transitionRequest(itResult.updatedRequest!, 'FINANCE_APPROVE', financeRole, {
        notes: 'Budget authorized'
      });
      expect(finResult.success).toBe(true);
      expect(finResult.updatedRequest?.status).toBe('Purchasing Queue');
    });
  });

  describe('Rule 3: PO Budget Enforcement & Cost Increases', () => {
    it('returns request to Finance Review if PO total exceeds approved budget', () => {
      const prInQueue = createMockPR('Purchasing Queue', {
        financeApprovedAmount: 2500,
        estimatedTotalCost: 2500
      });

      // Price increased to 2800 (> 2500 approved)
      const costExceededResult = transitionRequest(prInQueue, 'CREATE_PO', purchasingRole, {
        notes: 'Vendor quote increased by +$300 for express delivery',
        purchaseOrder: {
          poNumber: 'PO-2026-9001',
          vendor: 'Lenovo Direct',
          finalUnitPrice: 2800,
          quantity: 1,
          currency: 'USD',
          orderDate: '2026-09-16',
          expectedDeliveryDate: '2026-09-25',
          finalTotalCost: 2800
        }
      });

      // Guard triggered: returns to Finance Review
      expect(costExceededResult.updatedRequest?.status).toBe('Finance Review');
      expect(costExceededResult.error).toContain('exceeds Finance-approved limit');
      expect(costExceededResult.updatedRequest?.auditLogs.some(l => l.action.includes('Returned to Finance Review'))).toBe(true);
    });
  });

  describe('Rule 4: Rejections and Change Requests Require Written Reason', () => {
    it('rejects state transition if written reason is empty', () => {
      const pr = createMockPR('IT Head Review');
      const result = transitionRequest(pr, 'IT_REJECT', itHeadRole, { reason: '   ' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('A written reason is required');
    });

    it('requires written reason when requesting changes', () => {
      const pr = createMockPR('IT Head Review');
      const result = transitionRequest(pr, 'IT_REQUEST_CHANGES', itHeadRole, { reason: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('A written reason is required');
    });

    it('succeeds with audit record when written reason is provided', () => {
      const pr = createMockPR('IT Head Review');
      const result = transitionRequest(pr, 'IT_REJECT', itHeadRole, { 
        reason: 'Excess spare capacity already deployed to team' 
      });
      expect(result.success).toBe(true);
      expect(result.updatedRequest?.status).toBe('Rejected');
      expect(result.updatedRequest?.auditLogs[0].notes).toContain('Excess spare capacity already deployed to team');
    });
  });

  describe('Rule 5: Terminal States and Immutability', () => {
    it('marks Closed, Rejected, and Cancelled requests as not editable', () => {
      expect(isRequestEditable(createMockPR('Closed'))).toBe(false);
      expect(isRequestEditable(createMockPR('Rejected'))).toBe(false);
      expect(isRequestEditable(createMockPR('Cancelled'))).toBe(false);
      expect(isRequestEditable(createMockPR('Assigned/Fulfilled'))).toBe(false);
    });

    it('permits editing only on Draft and Changes Requested', () => {
      expect(isRequestEditable(createMockPR('Draft'))).toBe(true);
      expect(isRequestEditable(createMockPR('Changes Requested'))).toBe(true);
      expect(isRequestEditable(createMockPR('IT Head Review'))).toBe(false);
    });
  });

  describe('Telemetry & Metrics Computation', () => {
    it('correctly calculates metrics for dashboard telemetry', () => {
      const list: ProcurementRequest[] = [
        createMockPR('IT Head Review'),
        createMockPR('Finance Review'),
        createMockPR('Purchasing Queue'),
        createMockPR('Ordered', {
          purchaseOrder: {
            poNumber: 'PO-001',
            vendor: 'Dell',
            finalUnitPrice: 1000,
            quantity: 1,
            currency: 'USD',
            orderDate: '2026-08-01',
            expectedDeliveryDate: '2026-08-15', // Overdue
            finalTotalCost: 1000
          }
        }),
        createMockPR('Changes Requested')
      ];

      const metrics = calculateProcurementMetrics(list, itHeadRole);
      expect(metrics.totalOpenRequests).toBe(5);
      expect(metrics.awaitingMyApproval).toBe(1); // Only IT Head Review (1)
      expect(metrics.purchasingQueueCount).toBe(1);
      expect(metrics.overdueDeliveriesCount).toBe(1);
      expect(metrics.changesRequestedCount).toBe(1);
    });
  });
});
