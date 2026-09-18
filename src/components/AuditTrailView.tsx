import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Clock, 
  UserCheck, 
  Tag, 
  FileSpreadsheet, 
  ArrowRight, 
  Filter, 
  User, 
  ShieldCheck, 
  RotateCcw,
  FileCheck2,
  Package,
  Layers
} from 'lucide-react';
import { ChangeLogEntry, ProcurementRequest, SimulatedUserRole, UnifiedAuditLog } from '../types';
import { SkeuoButton, SegmentedDisplay, StatusBadge } from './SkeuoComponents';
import { ExportMenu } from './ExportMenu';
import { exportAuditTrail, canRoleExport } from '../services/exportService';
import { SIMULATED_ROLES } from '../services/procurementService';

export type { UnifiedAuditLog };

interface AuditTrailViewProps {
  changeLogs: ChangeLogEntry[];
  procurementRequests?: ProcurementRequest[];
  currentUserRole?: SimulatedUserRole;
  onSelectAssetByTag?: (assetTag: string) => void;
  onSelectProcurementRequest?: (requestNumber: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  changeLogs,
  procurementRequests = [],
  currentUserRole,
  onSelectAssetByTag,
  onSelectProcurementRequest
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  // Unify Asset change logs and Procurement lifecycle audit logs
  const unifiedLogs: UnifiedAuditLog[] = useMemo(() => {
    const list: UnifiedAuditLog[] = [];

    // 1. Hardware Fleet Asset Logs
    changeLogs.forEach(l => {
      list.push({
        id: l.id,
        timestamp: l.timestamp,
        source: 'Hardware Fleet',
        reference: l.assetTag,
        referenceType: 'AST',
        action: l.action,
        property: l.property,
        oldValue: l.oldValue,
        newValue: l.newValue,
        performedBy: l.performedBy,
        reason: l.reason,
        jiraTicketKey: l.jiraTicketKey,
        poNumber: l.procurementRequestNumber
      });
    });

    // 2. Procurement Requests Lifecycle Events
    procurementRequests.forEach(req => {
      (req.auditLogs || []).forEach(log => {
        list.push({
          id: log.id,
          timestamp: log.timestamp,
          source: 'Procurement',
          reference: log.requestNumber || req.requestNumber,
          referenceType: 'PR',
          action: log.action,
          property: 'Lifecycle Status',
          oldValue: log.previousState,
          newValue: log.newState,
          performedBy: log.actor,
          role: log.role,
          reason: log.notes,
          poNumber: req.purchaseOrder?.poNumber,
          deliveryReference: req.receipts?.length ? req.receipts[req.receipts.length - 1].deliveryReference : undefined
        });
      });
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [changeLogs, procurementRequests]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return unifiedLogs.filter(log => {
      const matchesSearch = !q || (
        log.reference.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.performedBy.toLowerCase().includes(q) ||
        (log.role && log.role.toLowerCase().includes(q)) ||
        log.property.toLowerCase().includes(q) ||
        log.oldValue.toLowerCase().includes(q) ||
        log.newValue.toLowerCase().includes(q) ||
        (log.reason && log.reason.toLowerCase().includes(q)) ||
        (log.poNumber && log.poNumber.toLowerCase().includes(q)) ||
        (log.deliveryReference && log.deliveryReference.toLowerCase().includes(q)) ||
        (log.jiraTicketKey && log.jiraTicketKey.toLowerCase().includes(q))
      );

      const matchesSource = sourceFilter === 'ALL' || log.source === sourceFilter;
      const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;

      return matchesSearch && matchesSource && matchesAction;
    });
  }, [unifiedLogs, searchQuery, sourceFilter, selectedAction]);

  const procurementCount = unifiedLogs.filter(l => l.source === 'Procurement').length;
  const fleetCount = unifiedLogs.filter(l => l.source === 'Hardware Fleet').length;
  const uniqueReferences = new Set(unifiedLogs.map(l => l.reference)).size;

  const getActionBadgeClass = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('approv') || act.includes('fulfil') || act.includes('enroll') || act.includes('registered')) {
      return 'bg-[#EBF7EE] text-[#0F682C] border-[#B7E5C3]';
    }
    if (act.includes('reject') || act.includes('cancel')) {
      return 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]';
    }
    if (act.includes('change') || act.includes('partial') || act.includes('exceeded') || act.includes('returned')) {
      return 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]';
    }
    if (act.includes('po') || act.includes('order') || act.includes('purchas') || act.includes('reassign')) {
      return 'bg-[#EEF4FB] text-[#1956A6] border-[#BCD4F3]';
    }
    if (act.includes('ship') || act.includes('deliver') || act.includes('receipt')) {
      return 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]';
    }
    return 'bg-[#FAF9F5] text-[#505457] border-[#D8D6CF]';
  };

  return (
    <div className="space-y-3.5">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={unifiedLogs.length} label="Total Audit Events Logged" color="neutral" />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={procurementCount} label="Procurement Lifecycle Events" color="blue" />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={fleetCount} label="Hardware Fleet Modifications" color="emerald" />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={uniqueReferences} label="Audited Units & Requests" color="amber" />
        </div>
      </div>

      {/* Filter and Export Toolbar */}
      <div className="p-2.5 rounded-lg ti-surface flex flex-wrap items-center justify-between gap-2.5 border border-[#D8D6CF]">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] sm:min-w-[320px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail (e.g. PR-2026-0001, AST-8821, Sarah, PO-2026, Dell)..."
              className="w-full h-8.5 pl-8.5 pr-3 ti-well rounded text-xs text-[#181A1B] placeholder-[#8A8C8E] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
            />
            <Search className="w-3.5 h-3.5 text-[#7A7D80] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-8.5 px-2.5 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
          >
            <option value="ALL">All Event Sources</option>
            <option value="Procurement">Procurement Only</option>
            <option value="Hardware Fleet">Hardware Fleet Only</option>
          </select>

          <ExportMenu
            buttonSize="sm"
            variant="standard"
            label="Export"
            options={[
              {
                id: 'filtered_audit',
                label: `Filtered Audit Records (${filteredLogs.length})`,
                count: filteredLogs.length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'audit').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'audit').reason : undefined,
                onExport: () => exportAuditTrail(
                  filteredLogs,
                  `Filtered Audit Log (Source: ${sourceFilter}, Action: ${selectedAction}, Query: "${searchQuery || 'none'}")`,
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              },
              {
                id: 'all_audit',
                label: `Complete Audit Trail (${unifiedLogs.length})`,
                count: unifiedLogs.length,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'audit').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'audit').reason : undefined,
                onExport: () => exportAuditTrail(
                  unifiedLogs,
                  'Complete Enterprise Operational Audit Trail',
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              },
              {
                id: 'procurement_audit',
                label: `Procurement Lifecycle Events (${procurementCount})`,
                count: procurementCount,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'audit').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'audit').reason : undefined,
                onExport: () => exportAuditTrail(
                  unifiedLogs.filter(l => l.source === 'Procurement'),
                  'Procurement Lifecycle Audit Records',
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              },
              {
                id: 'fleet_audit',
                label: `Hardware Fleet Events (${fleetCount})`,
                count: fleetCount,
                disabled: currentUserRole ? !canRoleExport(currentUserRole, 'audit').allowed : false,
                disabledReason: currentUserRole ? canRoleExport(currentUserRole, 'audit').reason : undefined,
                onExport: () => exportAuditTrail(
                  unifiedLogs.filter(l => l.source === 'Hardware Fleet'),
                  'Hardware Fleet Modification Records',
                  currentUserRole || SIMULATED_ROLES.it_head
                )
              }
            ]}
          />
        </div>
      </div>

      {/* Dense Full-Width Audit Table */}
      <div className="ti-surface rounded-lg border border-[#D8D6CF] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D8D6CF] bg-[#EAE8E2] text-[#686B6D] font-medium text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                <th className="py-2.5 px-3 whitespace-nowrap">Entity / Ref</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Scope / Property</th>
                <th className="py-2.5 px-3">Previous State</th>
                <th className="py-2.5 px-3">New State</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Justification / Notes</th>
                <th className="py-2.5 px-3 text-right">Context Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE8E2] text-[#181A1B]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#686B6D]">
                    No audit records match the current filter query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAF9F5] transition-colors">
                    <td className="py-2 px-3 font-mono text-[11px] text-[#686B6D] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      {log.referenceType === 'PR' ? (
                        <button
                          onClick={() => onSelectProcurementRequest?.(log.reference)}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE] hover:border-[#7C3AED] hover:bg-[#EDE9FE] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="Click to view procurement request"
                        >
                          <FileCheck2 className="w-3 h-3 text-[#7C3AED]" />
                          {log.reference}
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectAssetByTag?.(log.reference)}
                          className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC] hover:border-[#C66A2B] hover:bg-[#DDD9D0] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                          title="Click to view hardware asset"
                        >
                          <Tag className="w-3 h-3 text-[#C66A2B]" />
                          {log.reference}
                        </button>
                      )}
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-[#181A1B] whitespace-nowrap">
                      {log.property}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#A81F1A] max-w-[140px] truncate" title={log.oldValue}>
                      {log.oldValue || '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#0F682C] font-semibold max-w-[140px] truncate" title={log.newValue}>
                      {log.newValue}
                    </td>
                    <td className="py-2 px-3 text-[#505457] whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-xs text-[#181A1B]">{log.performedBy}</span>
                        {log.role && (
                          <span className="text-[10px] text-[#686B6D]">{log.role}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-[#686B6D] text-[11px] max-w-[220px]" title={log.reason || ''}>
                      <div className="space-y-0.5">
                        <p className="truncate">{log.reason || '—'}</p>
                        <div className="flex flex-wrap gap-1">
                          {log.poNumber && (
                            <span className="font-mono text-[9px] px-1 rounded bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                              PO: {log.poNumber}
                            </span>
                          )}
                          {log.deliveryReference && (
                            <span className="font-mono text-[9px] px-1 rounded bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                              Slip: {log.deliveryReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {log.jiraTicketKey ? (
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3]">
                          {log.jiraTicketKey}
                        </span>
                      ) : log.poNumber ? (
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F5F3FF] text-[#6D28D9] border border-[#DDD6FE]">
                          {log.poNumber}
                        </span>
                      ) : (
                        <span className="text-[#8A8C8E]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
