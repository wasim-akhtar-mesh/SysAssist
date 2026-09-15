import React, { useState } from 'react';
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
  RotateCcw
} from 'lucide-react';
import { ChangeLogEntry } from '../types';
import { SkeuoButton, SegmentedDisplay, StatusBadge } from './SkeuoComponents';
import { soundFx } from '../services/audioService';

interface AuditTrailViewProps {
  changeLogs: ChangeLogEntry[];
  onSelectAssetByTag?: (assetTag: string) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  changeLogs,
  onSelectAssetByTag
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedProperty, setSelectedProperty] = useState<string>('ALL');

  const filteredLogs = changeLogs.filter(log => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      log.assetTag.toLowerCase().includes(q) ||
      log.assetName.toLowerCase().includes(q) ||
      log.performedBy.toLowerCase().includes(q) ||
      log.property.toLowerCase().includes(q) ||
      log.oldValue.toLowerCase().includes(q) ||
      log.newValue.toLowerCase().includes(q) ||
      (log.reason && log.reason.toLowerCase().includes(q)) ||
      (log.jiraTicketKey && log.jiraTicketKey.toLowerCase().includes(q))
    );

    const matchesAction = selectedAction === 'ALL' || log.action === selectedAction;
    const matchesProperty = selectedProperty === 'ALL' || log.property.toLowerCase().includes(selectedProperty.toLowerCase());

    return matchesSearch && matchesAction && matchesProperty;
  });

  const handleExportCSV = () => {
    soundFx.playMechanicalClick();
    const headers = ['Timestamp', 'Asset Tag', 'Asset Name', 'Performed By', 'Action', 'Property', 'Old Value', 'New Value', 'Reason', 'Jira Key'];
    const rows = filteredLogs.map(log => [
      `"${log.timestamp}"`,
      `"${log.assetTag}"`,
      `"${log.assetName.replace(/"/g, '""')}"`,
      `"${log.performedBy}"`,
      `"${log.action}"`,
      `"${log.property}"`,
      `"${log.oldValue.replace(/"/g, '""')}"`,
      `"${log.newValue.replace(/"/g, '""')}"`,
      `"${(log.reason || '').replace(/"/g, '""')}"`,
      `"${log.jiraTicketKey || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SysAssist_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const reassignmentCount = changeLogs.filter(l => l.action === 'REASSIGN').length;

  return (
    <div className="space-y-3.5">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={changeLogs.length} label="Audit Events Logged" color="neutral" />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay value={reassignmentCount} label="Custodian Reassignments" color="emerald" />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={new Set(changeLogs.map(l => l.assetTag)).size} 
            label="Audited Hardware Units" 
            color="amber" 
          />
        </div>
        <div className="ti-surface p-3 rounded-lg border border-[#D8D6CF]">
          <SegmentedDisplay 
            value={changeLogs.filter(l => l.jiraTicketKey).length} 
            label="Jira Linked Events" 
            color="blue" 
          />
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
              placeholder="Search audit trail (e.g. John, Sina, AST-8821, SYS-1082)..."
              className="w-full h-8.5 pl-8.5 pr-3 ti-well rounded text-xs text-[#181A1B] placeholder-[#8A8C8E] border border-[#C5C3BC] focus:outline-2 focus:outline-[#2C6E9B]"
            />
            <Search className="w-3.5 h-3.5 text-[#7A7D80] absolute left-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="h-8.5 px-2.5 rounded ti-btn text-xs text-[#181A1B] border border-[#CFCDBF] focus:outline-2 focus:outline-[#2C6E9B] cursor-pointer"
          >
            <option value="ALL">All Actions</option>
            <option value="REASSIGN">REASSIGN</option>
            <option value="CHECK_IN">CHECK_IN</option>
            <option value="WARRANTY_SYNC">WARRANTY_SYNC</option>
            <option value="INTAKE">INTAKE</option>
          </select>

          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={handleExportCSV}
            icon={<FileSpreadsheet className="w-3.5 h-3.5 text-[#0F682C]" />}
          >
            Export CSV
          </SkeuoButton>
        </div>
      </div>

      {/* Dense Full-Width Audit Table */}
      <div className="ti-surface rounded-lg border border-[#D8D6CF] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#D8D6CF] bg-[#EAE8E2] text-[#686B6D] font-medium text-[11px]">
                <th className="py-2.5 px-3 whitespace-nowrap">Timestamp</th>
                <th className="py-2.5 px-3">Asset Tag</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Property Modified</th>
                <th className="py-2.5 px-3">Previous State</th>
                <th className="py-2.5 px-3">New State</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Justification</th>
                <th className="py-2.5 px-3 text-right">Jira Ref</th>
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
                      <button
                        onClick={() => onSelectAssetByTag?.(log.assetTag)}
                        className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-[#E5E3DD] text-[#181A1B] border border-[#C5C3BC] hover:border-[#C66A2B] cursor-pointer"
                        title="Click to view asset"
                      >
                        {log.assetTag}
                      </button>
                    </td>
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.action === 'REASSIGN' 
                          ? 'bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3]'
                          : log.action === 'WARRANTY_SYNC'
                          ? 'bg-[#EBF7EE] text-[#0F682C] border border-[#B7E5C3]'
                          : 'bg-[#FAF9F5] text-[#505457] border border-[#D8D6CF]'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 px-3 font-medium text-[#181A1B] whitespace-nowrap">
                      {log.property}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#A81F1A] max-w-[150px] truncate" title={log.oldValue}>
                      {log.oldValue}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-[#0F682C] font-semibold max-w-[150px] truncate" title={log.newValue}>
                      {log.newValue}
                    </td>
                    <td className="py-2 px-3 text-[#505457] whitespace-nowrap">
                      {log.performedBy}
                    </td>
                    <td className="py-2 px-3 text-[#686B6D] text-[11px] max-w-[180px] truncate" title={log.reason || ''}>
                      {log.reason || '—'}
                    </td>
                    <td className="py-2 px-3 text-right whitespace-nowrap">
                      {log.jiraTicketKey ? (
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#EEF4FB] text-[#1956A6] border border-[#BCD4F3]">
                          {log.jiraTicketKey}
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
