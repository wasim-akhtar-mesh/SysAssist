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
  assetLog?: ChangeLogEntry;
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

/**
 * Core guarded workflow transition engine.
 * Enforces all state-machine constraints and generates immutable audit records.
 */
export function transitionRequest(
  request: ProcurementRequest,
  action: 
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
    | 'RESUBMIT',
  actor: SimulatedUserRole,
  payload?: {
    reason?: string;
    notes?: string;
    stockAssetId?: string;
    stockAssetTag?: string;
    overrideMismatch?: boolean;
    purchaseOrder?: PurchaseOrderInfo;
    receipt?: DeliveryReceipt;
    registeredAssetTags?: string[];
    availableAssets?: Asset[];
  }
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
    if (!payload?.stockAssetId || !payload?.availableAssets) {
      return {
        success: false,
        error: 'Target asset ID and available inventory must be provided.'
      };
    }

    const targetAsset = payload.availableAssets.find(a => a.id === payload.stockAssetId);
    if (!targetAsset) {
      return {
        success: false,
        error: `Asset ${payload.stockAssetId} not found in inventory.`
      };
    }

    if (targetAsset.status !== 'In Stock') {
      return {
        success: false,
        error: `Asset ${targetAsset.assetTag} is currently '${targetAsset.status}' and cannot be assigned. Only 'In Stock' items can be fulfilled.`
      };
    }

    // Category check
    const categoryMismatch = targetAsset.category !== request.category;
    if (categoryMismatch && !payload.overrideMismatch) {
      return {
        success: false,
        error: `Selected asset category (${targetAsset.category}) does not match requested category (${request.category}). Explicit mismatch override is required.`
      };
    }

    const newState: ProcurementStatus = 'Assigned/Fulfilled';
    const itDecision: ApprovalDecision = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      stage: 'IT Head Review',
      approverName: actor.name,
      approverRole: actor.title,
      decision: 'Approved',
      timestamp,
      reason: `Fulfilled from depot stock: ${targetAsset.assetTag} (${targetAsset.name}). Bypassed Purchasing.`
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
        ? `Fulfilled using alternate asset ${targetAsset.assetTag} (${targetAsset.category} vs requested ${request.category}). Override Reason: ${payload?.reason || 'Approved by IT Lead'}`
        : `Immediate allocation of in-stock ${targetAsset.assetTag} (${targetAsset.model}) to ${request.requester.name}.`
    };

    // Update the physical asset
    const assetLog: ChangeLogEntry = {
      id: generateUniqueLogId([]),
      assetId: targetAsset.id,
      assetTag: targetAsset.assetTag,
      assetName: targetAsset.name,
      timestamp,
      performedBy: actor.name,
      action: categoryMismatch ? 'PROCUREMENT_OVERRIDE' : 'PROCUREMENT_FULFILL',
      property: 'assignedTo',
      oldValue: 'Depot Stock',
      newValue: `${request.requester.name} (${request.requester.department})`,
      reason: `Fulfilled procurement request ${request.requestNumber}`,
      procurementRequestNumber: request.requestNumber
    };

    const updatedAsset: Asset = {
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
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        stockFulfilled: true,
        overrideStockMismatch: categoryMismatch,
        fulfilledAssetTags: [targetAsset.assetTag],
        approvals: [...request.approvals, itDecision],
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog,
      affectedAsset: updatedAsset,
      assetLog
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
    if (request.status !== 'Ordered' && request.status !== 'Shipped' && request.status !== 'Received') {
      return {
        success: false,
        error: `Cannot record receipt from status '${request.status}'.`
      };
    }
    if (!payload?.receipt) {
      return {
        success: false,
        error: 'Receipt details required.'
      };
    }

    const receipt = payload.receipt;
    const currentReceived = request.totalReceivedQuantity || 0;
    const newTotalReceived = currentReceived + receipt.quantityReceived;
    const orderedQuantity = request.purchaseOrder?.quantity ?? request.quantity;

    const isFullyReceived = newTotalReceived >= orderedQuantity;
    // Remains Received (or Asset Registration if fully delivered)
    const newState: ProcurementStatus = isFullyReceived ? 'Asset Registration' : 'Received';

    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: isFullyReceived ? 'Full Delivery Received' : 'Partial Delivery Received',
      previousState,
      newState,
      notes: `Received ${receipt.quantityReceived} units (Total received: ${newTotalReceived}/${orderedQuantity}). Slip Ref: ${receipt.deliveryReference}. Receiver: ${receipt.receiver}.`
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
    if (request.status !== 'Asset Registration' && request.status !== 'Received') {
      return {
        success: false,
        error: `Cannot register and assign assets from status '${request.status}'.`
      };
    }
    if (!payload?.registeredAssetTags || payload.registeredAssetTags.length === 0) {
      return {
        success: false,
        error: 'At least one registered asset tag is required.'
      };
    }

    const newState: ProcurementStatus = 'Assigned/Fulfilled';
    const auditLog: ProcurementAuditLog = {
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor.name,
      role: actor.badge,
      requestNumber: request.requestNumber,
      action: 'Equipment Registered & Assigned',
      previousState,
      newState,
      notes: `Registered ${payload.registeredAssetTags.length} hardware units (${payload.registeredAssetTags.join(', ')}) and assigned custody to ${request.requester.name}.`
    };

    return {
      success: true,
      updatedRequest: {
        ...request,
        status: newState,
        registeredAssetTags: Array.from(new Set([...request.registeredAssetTags, ...payload.registeredAssetTags])),
        fulfilledAssetTags: Array.from(new Set([...request.fulfilledAssetTags, ...payload.registeredAssetTags])),
        updatedAt: timestamp,
        auditLogs: [auditLog, ...request.auditLogs]
      },
      newAuditLog: auditLog
    };
  }

  // 12. Action: CLOSE
  if (action === 'CLOSE') {
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
    if (request.status !== 'Draft' && request.status !== 'Submitted' && request.status !== 'IT Head Review' && request.status !== 'Changes Requested') {
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
      notes: payload?.notes || 'Cancelled by requester.'
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
        r.status === 'Received' || 
        r.status === 'Asset Registration'
      );

    case 'all_requests':
    default:
      return requests;
  }
}
