import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Clock, 
  UserCheck, 
  Tag, 
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { ChangeLogEntry } from '../types';
import { SkeuoButton, SegmentedDisplay } from './SkeuoComponents';
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
    <div className="space-y-4">
      {/* Top Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay value={changeLogs.length} label="Audit Events Logged" color="sky" />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay value={reassignmentCount} label="Custodian Reassignments" color="emerald" />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={new Set(changeLogs.map(l => l.assetTag)).size} 
            label="Audited Hardware Units" 
            color="amber" 
          />
        </div>
        <div className="instrument-panel p-3.5 rounded-xl">
          <SegmentedDisplay 
            value={changeLogs.filter(l => l.jiraTicketKey).length} 
            label="Jira Linked Events" 
            color="sky" 
          />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="instrument-panel rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by Custodian, Tag (AST-8821), or Property..."
              className="w-full h-9 pl-9 pr-4 instrument-well rounded-lg text-xs font-sans text-slate-100 placeholder-slate-500 border border-white/[0.06] focus:border-blue-500 focus:outline-none"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Filter */}
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
            aria-label="Filter by audit action"
          >
            <option value="ALL">All Event Types</option>
            <option value="REASSIGN">Reassignments</option>
            <option value="STATUS_CHANGE">Status Changes</option>
            <option value="WARRANTY_SYNC">Warranty Synced</option>
            <option value="CHECK_IN">Check-ins</option>
            <option value="CREATED">Intake / Created</option>
          </select>

          {/* Property Filter */}
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="h-9 px-3 instrument-btn rounded-lg text-xs font-sans text-slate-200 border border-white/[0.08] focus:border-blue-500 focus:outline-none cursor-pointer"
            aria-label="Filter by changed property"
          >
            <option value="ALL">All Properties</option>
            <option value="Assigned To">Assigned To</option>
            <option value="Status">Status</option>
            <option value="Apple Coverage">Apple Coverage / Specs</option>
            <option value="Location">Location</option>
          </select>

          <SkeuoButton
            size="sm"
            variant="standard"
            onClick={handleExportCSV}
            icon={<FileSpreadsheet className="w-3.5 h-3.5" />}
          >
            Export CSV
          </SkeuoButton>
        </div>
      </div>

      {/* Audit Log Timeline Entries */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center instrument-panel rounded-xl text-xs font-sans text-slate-400">
            No audit log entries found matching criteria &ldquo;{searchQuery}&rdquo;.
          </div>
        ) : (
          filteredLogs.map(log => (
            <div
              key={log.id}
              className="instrument-card rounded-xl p-4 flex flex-col gap-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectAssetByTag?.(log.assetTag)}
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#10141b] text-blue-300 border border-blue-600/30 hover:bg-blue-900/40 transition-all cursor-pointer"
                    title="Inspect asset details"
                  >
                    {log.assetTag}
                  </button>
                  <span className="text-xs font-sans font-semibold text-slate-100">
                    {log.assetName}
                  </span>
                  <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-medium">
                    {log.action}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-sans text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Property & Difference Diff Box */}
              <div className="instrument-well p-3 rounded-lg text-xs font-sans">
                <div className="text-[11px] text-slate-400 mb-2 flex items-center gap-1.5">
                  <span>Modified Property:</span>
                  <strong className="text-amber-300 font-semibold bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-600/30">
                    {log.property}
                  </strong>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.04]">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium tracking-wide">Previous Value:</span>
                    <span className="text-rose-300 line-through break-words block font-mono text-xs">
                      {log.oldValue}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-sans font-medium tracking-wide">Updated Value:</span>
                    <span className="text-emerald-400 font-semibold break-words block font-mono text-xs">
                      {log.newValue}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer: Performed by, Reason, Jira Key */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs font-sans text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Operator: <strong className="text-slate-200">{log.performedBy}</strong></span>
                </div>

                {log.reason && (
                  <div className="text-slate-300 italic text-[11px]">
                    &ldquo;{log.reason}&rdquo;
                  </div>
                )}

                {log.jiraTicketKey && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-950/80 border border-blue-700/40 text-blue-300 text-[11px] font-medium font-mono">
                    <Tag className="w-3 h-3" />
                    <span>Jira: {log.jiraTicketKey}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
