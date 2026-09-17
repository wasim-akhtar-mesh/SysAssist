import { 
  ProcurementRequest, 
  ProcurementStatus, 
  ProcurementRole, 
  SimulatedUserRole,
  ApprovalDecision, 
  PurchaseOrderInfo, 
  DeliveryReceipt, 
  ProcurementAuditLog,
  Asset,
  ChangeLogEntry
} from '../types';
import { generateUniqueLogId } from '../utils/idGenerator';

export const SIMULATED_ROLES: Record<ProcurementRole, SimulatedUserRole> = {
  requester: {
    id: 'requester',
    name: 'Elena Rostova',
    email: 'elena.rostova@meshconnect.internal',
    title: 'Senior Systems Architect',
    department: 'Engineering Infrastructure',
    badge: 'Requester'
  },
  it_head: {
    id: 'it_head',
    name: 'Wasim Akhtar',
    email: 'wasim.akhtar@meshconnect.internal',
    title: 'IT Lead & Infrastructure Head',
    department: 'Hardware Operations',
    badge: 'IT Head'
  },
  finance: {
    id: 'finance',
    name: 'Marcus Vance',
    email: 'marcus.vance@meshconnect.internal',
    title: 'Financial Controller & VP Finance',
    department: 'Finance & Compliance',
    badge: 'Finance Approver'
  },
  purchasing: {
    id: 'purchasing',
    name: 'Diana Sterling',
    email: 'diana.sterling@meshconnect.internal',
    title: 'Principal Procurement Buyer',
    department: 'Global Sourcing',
    badge: 'Purchasing Buyer'
  },
  purchasing_buyer: {
    id: 'purchasing_buyer',
    name: 'Diana Sterling',
    email: 'diana.sterling@meshconnect.internal',
    title: 'Principal Procurement Buyer',
    department: 'Global Sourcing',
    badge: 'Purchasing Buyer'
  },
  asset_manager: {
    id: 'asset_manager',
    name: 'Kenji Sato',
    email: 'kenji.sato@meshconnect.internal',
    title: 'IT Logistics Custodian',
    department: 'Depot Operations',
    badge: 'IT Asset Manager'
  }
};

export interface TransitionResult {
  success: boolean;
  error?: string;
  updatedRequest?: ProcurementRequest;
  newAuditLog?: ProcurementAuditLog;
  affectedAsset?: Asset;
  affectedAssets?: Asset[];
  assetLog?: ChangeLogEntry;
  assetLogs?: ChangeLogEntry[];
  createdAssets?: Asset[];
}

/**
 * Validates request data before submission
 */
export function validateSubmission(request: Partial<ProcurementRequest>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!request.preferredModel?.trim()) {
    errors.push('Preferred model or hardware specification is required.');
  }
  if (!request.quantity || request.quantity < 1) {
    errors.push('Quantity must be at least 1 unit.');
  }
  if (!request.businessJustification?.trim()) {
    errors.push('Business justification is required.');
  }
  if (!request.department?.trim()) {
    errors.push('Department is required.');
  }
  if (!request.manager?.trim()) {
    errors.push('Approving manager is required.');
  }
  if (!request.costCentre?.trim()) {
    errors.push('Cost centre is required.');
  }
  if (!request.requiredByDate?.trim()) {
    errors.push('Required-by date is required.');
  }
  if (!request.estimatedUnitPrice || request.estimatedUnitPrice <= 0) {
    errors.push('Estimated unit price must be greater than zero.');
  }
  if (!request.preferredVendor?.trim()) {
    errors.push('Preferred vendor is required.');
  }
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if a status is terminal
 */
export function isTerminalStatus(status: ProcurementStatus): boolean {
  return status === 'Closed' || status === 'Rejected' || status === 'Cancelled';
}

/**
 * Determines whether an actor in a given role can approve or reject the request
 */
export function canActorApprove(request: ProcurementRequest, actor: SimulatedUserRole): { allowed: boolean; reason?: string } {
  if (isTerminalStatus(request.status)) {
    return { allowed: false, reason: `Request is in terminal state '${request.status}' and cannot be modified.` };
  }

  // Prevent self-approval
  if (request.requester.email.toLowerCase() === actor.email.toLowerCase() || 
      request.requester.name.toLowerCase() === actor.name.toLowerCase()) {
    return { allowed: false, reason: 'Requesters are strictly prohibited from approving their own procurement requests.' };
  }

  if (request.status === 'IT Head Review') {
    if (actor.id !== 'it_head') {
      return { allowed: false, reason: 'Only the IT Head can approve requests in IT Head Review.' };
    }
    return { allowed: true };
  }

  if (request.status === 'Finance Review') {
    if (actor.id !== 'finance') {
      return { allowed: false, reason: 'Only the Finance Approver can approve requests in Finance Review.' };
    }
    // Verify IT Head approval has already taken place
    const hasItApproval = request.approvals.some(a => a.stage === 'IT Head Review' && a.decision === 'Approved');
    if (!hasItApproval) {
      return { allowed: false, reason: 'IT Head approval must occur before Finance approval can proceed.' };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: `Current status '${request.status}' is not awaiting approval.` };
}

export type ProcurementAction = 
  | 'SUBMIT'
  | 'IT_APPROVE'
  | 'IT_REJECT'
  | 'IT_REQUEST_CHANGES'
  | 'IT_FULFILL_EXISTING_STOCK'
  | 'FINANCE_APPROVE'
  | 'FINANCE_REJECT'
  | 'FINANCE_REQUEST_CHANGES'
  | 'CREATE_PO'
  | 'MARK_SHIPPED'
  | 'RECORD_RECEIPT'
  | 'REGISTER_AND_ASSIGN_ASSETS'
  | 'CLOSE'
  | 'CANCEL'
  | 'RESUBMIT';

export interface TransitionPayload {
  reason?: string;
  notes?: string;
  stockAssetId?: string;
  stockAssetIds?: string[];
  stockAssetTag?: string;
  overrideMismatch?: boolean;
  purchaseOrder?: PurchaseOrderInfo;
  receipt?: DeliveryReceipt;
  registeredAssetTags?: string[];
  newAssets?: Asset[];
  availableAssets?: Asset[];
}

/**
 * Core guarded workflow transition engine.
 * Enforces all state-machine constraints and generates immutable audit records.
 */
export function transitionRequest(
  request: ProcurementRequest,
  action: ProcurementAction,
  actor: SimulatedUserRole,
  payload?: TransitionPayload
): TransitionResult {
  const timestamp = new Date().toISOString();
  const previousState = request.status;

  // 1. Guard against any transitions on terminal states
  if (isTerminalStatus(request.status)) {
    return {
      success: false,
      error: `Cannot perform action '${action}'. Request ${request.requestNumber} is in terminal state '${request.status}'.`
    };
  }

  // 2. Action: SUBMIT / RESUBMIT
  if (action === 'SUBMIT' || action === 'RESUBMIT') {
    if (request.status !== 'Draft' && request.status !== 'Changes Requested') {
      return {
        success: false,
        error: `Cannot submit request from status '${request.status}'. Only Draft or Changes Requested can be submitted.`
      };
    }
    const isRequester = actor.email.toLowerCase() === request.requester.email.toLowerCase() ||
                        actor.name.toLowerCase() === request.requester.name.toLowerCase() ||
                        actor.id === 'requester';
    if (!isRequester && actor.id !== 'it_head') {
      return {
        success: false,
        error: 'Only the requester can submit or resubmit this procurement request.'
      };
    }
    const validation = validateSubmission(request);
    if (!validation.valid) {
      return {
        success: false,
        error: `Submission validation failed: ${validation.errors.join(' ')}`
      };
    }

    const newState: ProcurementStatus = 'IT Head Review';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: action === 'RESUBMIT' ? 'Request Resubmitted' : 'Request Submitted',
      previousState,
      newState,
      notes: payload?.notes || 'Submitted for IT Head evaluation.'
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        rejectionReason: undefined,
        changesRequestedReason: undefined,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 3. Action: IT_APPROVE
  if (action === 'IT_APPROVE') {
    if (request.status !== 'IT Head Review') {
      return {
        success: false,
        error: `Cannot perform IT Approval from status '${request.status}'. Required status is 'IT Head Review'.`
      };
    }
    // Prevent self-approval
    if (request.requester.email.toLowerCase() === actor.email.toLowerCase() ||
        request.requester.name.toLowerCase() === actor.name.toLowerCase()) {
      return {
        success: false,
        error: 'Requester cannot approve their own procurement request.'
      };
    }
    if (actor.id !== 'it_head') {
      return {
        success: false,
        error: 'Only the IT Head can approve requests at this stage.'
      };
    }

    const newState: ProcurementStatus = 'Finance Review';
    const approval: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'IT Head Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: 'Approved',
      timestamp,
      reason: payload?.notes || 'Technical and architectural compatibility confirmed.'
    };

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'IT Head Approval',
      previousState,
      newState,
      notes: payload?.notes || 'Hardware specifications verified and approved for budget sign-off.'
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        approvals: [...request.approvals, approval],
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 4. Action: IT_FULFILL_EXISTING_STOCK
  if (action === 'IT_FULFILL_EXISTING_STOCK') {
    if (request.status !== 'IT Head Review') {
      return {
        success: false,
        error: `Cannot fulfill from stock from status '${request.status}'. Must be in 'IT Head Review'.`
      };
    }
    if (actor.id !== 'it_head') {
      return {
        success: false,
        error: 'Only the IT Head can fulfill requests from existing depot stock.'
      };
    }
    // Prevent self-approval / self-fulfillment
    if (request.requester.email.toLowerCase() === actor.email.toLowerCase() ||
        request.requester.name.toLowerCase() === actor.name.toLowerCase()) {
      return {
        success: false,
        error: 'Requester cannot approve or fulfill their own procurement request.'
      };
    }
    if (!payload?.availableAssets) {
      return {
        success: false,
        error: 'Available inventory must be provided.'
      };
    }

    const selectedAssetIds = payload.stockAssetIds && payload.stockAssetIds.length > 0
      ? payload.stockAssetIds
      : (payload.stockAssetId ? [payload.stockAssetId] : []);

    if (selectedAssetIds.length === 0) {
      return {
        success: false,
        error: 'Target asset ID(s) must be provided.'
      };
    }

    // Must select the required quantity
    if (selectedAssetIds.length !== request.quantity) {
      return {
        success: false,
        error: `Must select exactly ${request.quantity} asset(s) to fulfill this request (selected: ${selectedAssetIds.length}).`
      };
    }

    // Check for duplicate selections
    if (new Set(selectedAssetIds).size !== selectedAssetIds.length) {
      return {
        success: false,
        error: 'Duplicate assets selected. Each allocated asset must be unique.'
      };
    }

    // Validate every selected asset
    const selectedAssets: Asset[] = [];
    for (const id of selectedAssetIds) {
      const targetAsset = payload.availableAssets.find(a => a.id === id);
      if (!targetAsset) {
        return {
          success: false,
          error: `Asset ${id} not found in inventory.`
        };
      }
      if (targetAsset.status !== 'In Stock' || targetAsset.assignedTo !== null) {
        return {
          success: false,
          error: `Asset ${targetAsset.assetTag} (${targetAsset.name}) is currently '${targetAsset.status}' and cannot be assigned. Only unassigned 'In Stock' items can be fulfilled.`
        };
      }
      selectedAssets.push(targetAsset);
    }

    // Category mismatch check across all assets
    const categoryMismatch = selectedAssets.some(a => a.category !== request.category);
    if (categoryMismatch) {
      if (!payload.overrideMismatch) {
        return {
          success: false,
          error: `One or more selected assets do not match the requested category (${request.category}). Explicit mismatch override is required.`
        };
      }
      if (!payload.reason?.trim()) {
        return {
          success: false,
          error: 'A written justification is required when fulfilling with assets from an alternate category.'
        };
      }
    }

    const newState: ProcurementStatus = 'Assigned/Fulfilled';
    const itDecision: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'IT Head Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: 'Approved',
      timestamp,
      reason: `Fulfilled from depot stock: ${selectedAssets.map(a => a.assetTag).join(', ')}. Bypassed Purchasing.`
    };

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: categoryMismatch ? 'Fulfilled Existing Stock (Category Override)' : 'Fulfilled From Existing Stock',
      previousState,
      newState,
      notes: categoryMismatch
        ? `Fulfilled using alternate asset(s) ${selectedAssets.map(a => `${a.assetTag} (${a.category})`).join(', ')} vs requested ${request.category}. Override Reason: ${payload.reason}`
        : `Immediate allocation of in-stock ${selectedAssets.map(a => `${a.assetTag} (${a.model})`).join(', ')} to ${request.requester.name}.`
    };

    // Update the physical assets and create change logs
    const updatedAssets: Asset[] = [];
    const assetLogs: ChangeLogEntry[] = [];

    for (const targetAsset of selectedAssets) {
      const isMismatch = targetAsset.category !== request.category;
      const assetLog: ChangeLogEntry = {
        id: generateUniqueLogId([]),
        assetId: targetAsset.id,
        assetTag: targetAsset.assetTag,
        assetName: targetAsset.name,
        timestamp,
        performedBy: actor.name,
        action: isMismatch ? 'PROCUREMENT_OVERRIDE' : 'PROCUREMENT_FULFILL',
        property: 'assignedTo',
        oldValue: 'Depot Stock',
        newValue: `${request.requester.name} (${request.requester.department})`,
        reason: isMismatch 
          ? `Category override fulfillment for PR ${request.requestNumber}: ${payload.reason}` 
          : `Fulfilled procurement request ${request.requestNumber}`,
        procurementRequestNumber: request.requestNumber
      };
      assetLogs.push(assetLog);

      updatedAssets.push({
        ...targetAsset,
        status: 'In Use',
        assignedTo: {
          name: request.requester.name,
          email: request.requester.email,
          department: request.department,
          assignedDate: timestamp.slice(0, 10),
          role: 'Procurement Assignee'
        },
        linkedProcurementId: request.requestNumber,
        changeLogs: [assetLog, ...(targetAsset.changeLogs || [])]
      });
    }

    const fulfilledTags = selectedAssets.map(a => a.assetTag);
    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        stockFulfilled: true,
        overrideStockMismatch: categoryMismatch,
        fulfilledAssetTags: Array.from(new Set([...request.fulfilledAssetTags, ...fulfilledTags])),
        registeredAssetTags: Array.from(new Set([...request.registeredAssetTags, ...fulfilledTags])),
        approvals: [...request.approvals, itDecision],
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog,
      affectedAssets: updatedAssets,
      affectedAsset: updatedAssets[0],
      assetLogs,
      assetLog: assetLogs[0]
    };
  }

  // 5. Action: IT_REJECT or IT_REQUEST_CHANGES
  if (action === 'IT_REJECT' || action === 'IT_REQUEST_CHANGES') {
    if (request.status !== 'IT Head Review') {
      return {
        success: false,
        error: `Cannot reject/request changes from status '${request.status}'.`
      };
    }
    if (!payload?.reason?.trim()) {
      return {
        success: false,
        error: 'A written reason is required when rejecting or requesting changes on a request.'
      };
    }

    const newState: ProcurementStatus = action === 'IT_REJECT' ? 'Rejected' : 'Changes Requested';
    const decision: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'IT Head Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: action === 'IT_REJECT' ? 'Rejected' : 'Changes Requested',
      timestamp,
      reason: payload.reason
    };

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: action === 'IT_REJECT' ? 'IT Head Rejection' : 'IT Head Requested Changes',
      previousState,
      newState,
      notes: `Reason: ${payload.reason}`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        rejectionReason: action === 'IT_REJECT' ? payload.reason : undefined,
        changesRequestedReason: action === 'IT_REQUEST_CHANGES' ? payload.reason : undefined,
        approvals: [...request.approvals, decision],
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 6. Action: FINANCE_APPROVE
  if (action === 'FINANCE_APPROVE') {
    if (request.status !== 'Finance Review') {
      return {
        success: false,
        error: `Cannot perform Finance Approval from status '${request.status}'. Required status is 'Finance Review'.`
      };
    }
    // Verify IT Head approval occurred
    const hasItApproval = request.approvals.some(a => a.stage === 'IT Head Review' && a.decision === 'Approved');
    if (!hasItApproval) {
      return {
        success: false,
        error: 'IT Head approval must occur before Finance approval.'
      };
    }
    // Prevent self-approval
    if (request.requester.email.toLowerCase() === actor.email.toLowerCase() ||
        request.requester.name.toLowerCase() === actor.name.toLowerCase()) {
      return {
        success: false,
        error: 'Requester cannot approve their own procurement request.'
      };
    }
    if (actor.id !== 'finance') {
      return {
        success: false,
        error: 'Only the Finance Approver can approve requests at this stage.'
      };
    }

    const newState: ProcurementStatus = 'Purchasing Queue';
    const approval: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'Finance Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: 'Approved',
      timestamp,
      reason: payload?.notes || `Budget authorized for ${request.currency} ${request.estimatedTotalCost.toLocaleString()}.`
    };

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Finance Approval',
      previousState,
      newState,
      notes: `Approved for purchasing queue. Authorized budget ceiling: ${request.currency} ${request.estimatedTotalCost.toLocaleString()}.`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        financeApprovedAmount: request.estimatedTotalCost,
        updatedAt: timestamp,
        approvals: [...request.approvals, approval],
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 7. Action: FINANCE_REJECT or FINANCE_REQUEST_CHANGES
  if (action === 'FINANCE_REJECT' || action === 'FINANCE_REQUEST_CHANGES') {
    if (request.status !== 'Finance Review') {
      return {
        success: false,
        error: `Cannot reject/request changes from status '${request.status}'.`
      };
    }
    if (!payload?.reason?.trim()) {
      return {
        success: false,
        error: 'A written reason is required when rejecting or requesting changes.'
      };
    }

    const newState: ProcurementStatus = action === 'FINANCE_REJECT' ? 'Rejected' : 'Changes Requested';
    const decision: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'Finance Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: action === 'FINANCE_REJECT' ? 'Rejected' : 'Changes Requested',
      timestamp,
      reason: payload.reason
    };

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: action === 'FINANCE_REJECT' ? 'Finance Rejection' : 'Finance Requested Changes',
      previousState,
      newState,
      notes: `Reason: ${payload.reason}`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        rejectionReason: action === 'FINANCE_REJECT' ? payload.reason : undefined,
        changesRequestedReason: action === 'FINANCE_REQUEST_CHANGES' ? payload.reason : undefined,
        approvals: [...request.approvals, decision],
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 8. Action: CREATE_PO
  if (action === 'CREATE_PO') {
    if (actor.id !== 'purchasing' && actor.id !== 'purchasing_buyer') {
      return {
        success: false,
        error: 'Only Purchasing Buyers can issue purchase orders.'
      };
    }
    if (request.status !== 'Purchasing Queue') {
      return {
        success: false,
        error: `Cannot create Purchase Order from status '${request.status}'. Finance approval required first.`
      };
    }
    if (!payload?.purchaseOrder) {
      return {
        success: false,
        error: 'Purchase order details are required.'
      };
    }

    const po = payload.purchaseOrder;
    const finalTotal = po.finalUnitPrice * po.quantity;
    const approvedLimit = request.financeApprovedAmount ?? request.estimatedTotalCost;

    // Rule: If final ordered total exceeds Finance approved amount, prevent ordering and return for renewed Finance approval
    if (finalTotal > approvedLimit) {
      const returnState: ProcurementStatus = 'Finance Review';
      const exceedDiff = (finalTotal - approvedLimit).toFixed(2);
      const auditLog: ProcurementAuditLog = {
        id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp,
        actor: actor.name,
        role: actor.badge,
        requestNumber: request.requestNumber,
        action: 'Returned to Finance Review (Cost Exceeded)',
        previousState,
        newState: returnState,
        notes: `PO amount (${po.currency} ${finalTotal.toLocaleString()}) exceeds Finance-approved limit (${request.currency} ${approvedLimit.toLocaleString()}) by +${request.currency} ${exceedDiff}. Returned for renewed approval.`
      };

      return {
        success: false,
        error: `Order amount (${po.currency} ${finalTotal.toLocaleString()}) exceeds Finance-approved limit of ${request.currency} ${approvedLimit.toLocaleString()}. Request has been returned to Finance Review for authorization.`,
        updatedRequest: {
          ...request,
          status: returnState,
          estimatedTotalCost: finalTotal,
          estimatedUnitPrice: po.finalUnitPrice,
          updatedAt: timestamp,
          auditLogs: [auditLog, ...request.auditLogs]
        },
        newAuditLog: auditLog
      };
    }

    const newState: ProcurementStatus = 'Ordered';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Purchase Order Issued',
      previousState,
      newState,
      notes: `PO ${po.poNumber} placed with ${po.vendor} for ${po.quantity}x units at ${po.currency} ${po.finalUnitPrice.toLocaleString()} each (Total: ${po.currency} ${finalTotal.toLocaleString()}).`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        purchaseOrder: {
          ...po,
          finalTotalCost: finalTotal
        },
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 9. Action: MARK_SHIPPED
  if (action === 'MARK_SHIPPED') {
    if (actor.id !== 'purchasing' && actor.id !== 'purchasing_buyer') {
      return {
        success: false,
        error: 'Only Purchasing Buyers can mark orders shipped.'
      };
    }
    if (request.status !== 'Ordered') {
      return {
        success: false,
        error: `Cannot mark shipped from status '${request.status}'. Order must be in 'Ordered' state.`
      };
    }

    const newState: ProcurementStatus = 'Shipped';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Order Dispatched / In Transit',
      previousState,
      newState,
      notes: payload?.notes || `Vendor shipment in transit. Tracking ref: ${request.purchaseOrder?.trackingReference || 'Carrier Acknowledged'}`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 10. Action: RECORD_RECEIPT
  if (action === 'RECORD_RECEIPT') {
    // Role enforcement
    if (actor.id !== 'purchasing' && actor.id !== 'purchasing_buyer' && actor.id !== 'asset_manager') {
      return {
        success: false,
        error: 'Unauthorized role for recording equipment deliveries. Only Purchasing Buyers or IT Asset Managers can record deliveries.'
      };
    }

    // Receipts without a purchase order must be rejected
    if (!request.purchaseOrder) {
      return {
        success: false,
        error: 'Cannot record delivery receipt without an active purchase order.'
      };
    }

    if (
      request.status !== 'Ordered' && 
      request.status !== 'Shipped' && 
      request.status !== 'Partially Received' && 
      request.status !== 'Received'
    ) {
      return {
        success: false,
        error: `Cannot record receipt from status '${request.status}'. Order must be in Ordered, Shipped, or Partially Received state.`
      };
    }

    if (!payload?.receipt) {
      return {
        success: false,
        error: 'Receipt details required.'
      };
    }

    const receipt = payload.receipt;
    // Reject zero or negative receipt quantities
    if (!receipt.quantityReceived || receipt.quantityReceived <= 0) {
      return {
        success: false,
        error: 'Receipt quantity must be at least 1 unit.'
      };
    }

    const currentReceived = request.totalReceivedQuantity || 0;
    const orderedQuantity = request.purchaseOrder.quantity;

    // Reject receipts after the full order has already arrived
    if (currentReceived >= orderedQuantity) {
      return {
        success: false,
        error: 'The full ordered quantity has already been received.'
      };
    }

    const remainingExpected = orderedQuantity - currentReceived;
    // Reject receipt quantities exceeding the remaining ordered quantity
    if (receipt.quantityReceived > remainingExpected) {
      return {
        success: false,
        error: `Receipt quantity (${receipt.quantityReceived}) exceeds remaining ordered quantity (${remainingExpected}).`
      };
    }

    const newTotalReceived = currentReceived + receipt.quantityReceived;
    const isFullArrival = newTotalReceived === orderedQuantity;

    // Use Partially Received consistently for incomplete deliveries. Only move to Asset Registration when the exact full ordered quantity has been received.
    const newState: ProcurementStatus = isFullArrival ? 'Asset Registration' : 'Partially Received';

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: isFullArrival ? 'Full Delivery Received' : 'Partial Delivery Received',
      previousState,
      newState,
      notes: `Received ${receipt.quantityReceived} unit(s) (Total received: ${newTotalReceived}/${orderedQuantity}). Slip Ref: ${receipt.deliveryReference}. Receiver: ${receipt.receiver}.`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        receipts: [...request.receipts, receipt],
        totalReceivedQuantity: newTotalReceived,
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 11. Action: REGISTER_AND_ASSIGN_ASSETS
  if (action === 'REGISTER_AND_ASSIGN_ASSETS') {
    if (actor.id !== 'asset_manager' && actor.id !== 'it_head') {
      return {
        success: false,
        error: 'Only IT Asset Managers can register and assign assets.'
      };
    }

    // Only allow registration from Asset Registration
    if (request.status !== 'Asset Registration') {
      return {
        success: false,
        error: `Cannot register assets from status '${request.status}'. Registration is only permitted in 'Asset Registration'.`
      };
    }

    const totalOrdered = request.purchaseOrder?.quantity ?? request.quantity;
    if ((request.totalReceivedQuantity || 0) < totalOrdered) {
      return {
        success: false,
        error: 'Cannot register assets until the complete ordered quantity has been received.'
      };
    }

    const newAssets = payload?.newAssets || [];
    const registeredTags = payload?.registeredAssetTags || newAssets.map(a => a.assetTag);

    if (newAssets.length === 0 && registeredTags.length === 0) {
      return {
        success: false,
        error: 'At least one registered asset is required.'
      };
    }

    // Check duplicates within the current batch
    const batchSerials = new Set<string>();
    const batchTags = new Set<string>();
    const batchBarcodes = new Set<string>();

    for (const a of newAssets) {
      const s = a.serialNumber?.trim().toUpperCase();
      const t = a.assetTag?.trim().toUpperCase();
      const b = a.barcode?.trim();

      if (s) {
        if (batchSerials.has(s)) {
          return { success: false, error: `Duplicate serial number '${a.serialNumber}' within registration batch.` };
        }
        batchSerials.add(s);
      }
      if (t) {
        if (batchTags.has(t)) {
          return { success: false, error: `Duplicate asset tag '${a.assetTag}' within registration batch.` };
        }
        batchTags.add(t);
      }
      if (b) {
        if (batchBarcodes.has(b)) {
          return { success: false, error: `Duplicate barcode '${a.barcode}' within registration batch.` };
        }
        batchBarcodes.add(b);
      }
    }

    // Check duplicates against existing inventory
    if (payload?.availableAssets) {
      for (const a of newAssets) {
        const s = a.serialNumber?.trim().toUpperCase();
        const t = a.assetTag?.trim().toUpperCase();
        const b = a.barcode?.trim();

        if (s && payload.availableAssets.some(ex => ex.id !== a.id && ex.serialNumber?.trim().toUpperCase() === s)) {
          return { success: false, error: `Serial number '${a.serialNumber}' already exists in inventory.` };
        }
        if (t && payload.availableAssets.some(ex => ex.id !== a.id && ex.assetTag?.trim().toUpperCase() === t)) {
          return { success: false, error: `Asset tag '${a.assetTag}' already exists in inventory.` };
        }
        if (b && payload.availableAssets.some(ex => ex.id !== a.id && ex.barcode?.trim() === b)) {
          return { success: false, error: `Barcode '${a.barcode}' already exists in inventory.` };
        }
      }
    }

    // Calculate unique total registered tags
    const updatedRegisteredTags = Array.from(new Set([...request.registeredAssetTags, ...registeredTags]));
    
    // Determine which assets are assigned
    const assignedTagsFromBatch = newAssets.filter(a => a.assignedTo !== null && a.status === 'In Use').map(a => a.assetTag);
    const updatedFulfilledTags = Array.from(new Set([...request.fulfilledAssetTags, ...assignedTagsFromBatch]));

    const allRegistered = updatedRegisteredTags.length >= totalOrdered;
    const allAssigned = updatedFulfilledTags.length >= totalOrdered;

    // Only move to 'Assigned/Fulfilled' if complete quantity received, registered, AND assigned
    const newState: ProcurementStatus = (allRegistered && allAssigned) ? 'Assigned/Fulfilled' : 'Asset Registration';

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: (allRegistered && allAssigned) ? 'Equipment Registered & Assigned' : 'Equipment Registered to Depot',
      previousState,
      newState,
      notes: (allRegistered && allAssigned)
        ? `Registered and assigned all ${totalOrdered} units (${updatedFulfilledTags.join(', ')}) to ${request.requester.name}.`
        : `Registered ${registeredTags.length} unit(s). ${updatedFulfilledTags.length}/${totalOrdered} assigned to requester.`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        registeredAssetTags: updatedRegisteredTags,
        fulfilledAssetTags: updatedFulfilledTags,
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog,
      createdAssets: newAssets
    };
  }

  // 12. Action: CLOSE
  if (action === 'CLOSE') {
    const isRequester = actor.email.toLowerCase() === request.requester.email.toLowerCase() ||
                        actor.name.toLowerCase() === request.requester.name.toLowerCase() ||
                        actor.id === 'requester';
    if (!isRequester && actor.id !== 'it_head' && actor.id !== 'asset_manager') {
      return {
        success: false,
        error: 'Only the Requester, IT Head, or IT Asset Manager can close procurement requests.'
      };
    }
    if (request.status !== 'Assigned/Fulfilled') {
      return {
        success: false,
        error: `Cannot close request from status '${request.status}'. Request must be 'Assigned/Fulfilled' before closure.`
      };
    }

    const newState: ProcurementStatus = 'Closed';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Procurement Request Closed',
      previousState,
      newState,
      notes: payload?.notes || 'Procurement cycle completed and reconciled.'
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 13. Action: CANCEL
  if (action === 'CANCEL') {
    const isRequester = actor.email.toLowerCase() === request.requester.email.toLowerCase() ||
                        actor.name.toLowerCase() === request.requester.name.toLowerCase() ||
                        actor.id === 'requester';
    if (!isRequester && actor.id !== 'it_head' && actor.id !== 'asset_manager') {
      return {
        success: false,
        error: 'Only the requester or IT management can cancel this request.'
      };
    }
    if (
      request.status !== 'Draft' && 
      request.status !== 'Submitted' && 
      request.status !== 'IT Head Review' && 
      request.status !== 'Changes Requested'
    ) {
      return {
        success: false,
        error: `Cannot cancel request from status '${request.status}'. Active financial commitments or POs cannot be cancelled unilaterally.`
      };
    }

    const newState: ProcurementStatus = 'Cancelled';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Request Cancelled',
      previousState,
      newState,
      notes: payload?.notes || payload?.reason || 'Cancelled by user.'
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  return {
    success: false,
    error: `Unrecognized action '${action}'.`
  };
}

/**
 * Convenience helper for checking approval permissions
 */
export function canUserApproveRequest(request: ProcurementRequest, actor: SimulatedUserRole): { canApprove: boolean; reason?: string } {
  const result = canActorApprove(request, actor);
  return {
    canApprove: result.allowed,
    reason: result.reason
  };
}

/**
 * Checks whether a request can be edited in its current state
 */
export function isRequestEditable(request: ProcurementRequest): boolean {
  return request.status === 'Draft' || request.status === 'Changes Requested';
}

/**
 * Telemetry metrics calculation for dashboard & overview views
 */
export function calculateProcurementMetrics(
  requests: ProcurementRequest[],
  currentUser?: SimulatedUserRole
) {
  const today = new Date().toISOString().slice(0, 10);
  const totalOpenRequests = requests.filter(r => !isTerminalStatus(r.status) && r.status !== 'Closed').length;
  const myOpenRequests = currentUser 
    ? requests.filter(r => (r.requester.email.toLowerCase() === currentUser.email.toLowerCase() || r.requester.name.toLowerCase() === currentUser.name.toLowerCase()) && !isTerminalStatus(r.status) && r.status !== 'Closed').length
    : 0;
  const awaitingMyApproval = currentUser
    ? requests.filter(r => {
        if (currentUser.id === 'it_head' && r.status === 'IT Head Review') {
          return r.requester.email.toLowerCase() !== currentUser.email.toLowerCase();
        }
        if (currentUser.id === 'finance' && r.status === 'Finance Review') {
          return r.requester.email.toLowerCase() !== currentUser.email.toLowerCase();
        }
        return false;
      }).length
    : 0;
  const purchasingQueueCount = requests.filter(r => r.status === 'Purchasing Queue').length;
  const orderedOrInTransitCount = requests.filter(r => r.status === 'Ordered' || r.status === 'Shipped').length;
  const overdueDeliveriesCount = requests.filter(r => 
    (r.status === 'Ordered' || r.status === 'Shipped') &&
    Boolean(r.purchaseOrder?.expectedDeliveryDate && r.purchaseOrder.expectedDeliveryDate < today)
  ).length;
  const changesRequestedCount = requests.filter(r => r.status === 'Changes Requested').length;

  return {
    totalOpenRequests,
    myOpenRequests,
    awaitingMyApproval,
    purchasingQueueCount,
    orderedOrInTransitCount,
    overdueDeliveriesCount,
    changesRequestedCount
  };
}

/**
 * Filter functions for the 4 procurement views
 */
export function filterProcurementRequests(
  requests: ProcurementRequest[],
  view: 'my_requests' | 'awaiting_approval' | 'purchasing_queue' | 'all_requests',
  currentUser: SimulatedUserRole
): ProcurementRequest[] {
  switch (view) {
    case 'my_requests':
      return requests.filter(r => 
        r.requester.email.toLowerCase() === currentUser.email.toLowerCase() ||
        r.requester.name.toLowerCase() === currentUser.name.toLowerCase()
      );

    case 'awaiting_approval':
      return requests.filter(r => {
        if (currentUser.id === 'it_head' && r.status === 'IT Head Review') {
          // Exclude self requests
          return r.requester.email.toLowerCase() !== currentUser.email.toLowerCase();
        }
        if (currentUser.id === 'finance' && r.status === 'Finance Review') {
          return r.requester.email.toLowerCase() !== currentUser.email.toLowerCase();
        }
        return false;
      });

    case 'purchasing_queue':
      return requests.filter(r => 
        r.status === 'Purchasing Queue' || 
        r.status === 'Ordered' || 
        r.status === 'Shipped' || 
        r.status === 'Partially Received' ||
        r.status === 'Received' || 
        r.status === 'Asset Registration'
      );

    case 'all_requests':
    default:
      return requests;
  }
}
