import React from 'react';
import { 
  Menu, 
  Scan, 
  Plus, 
  LayoutDashboard,
  Laptop, 
  Monitor,
  Boxes, 
  Layers, 
  History, 
  User, 
  ShieldCheck,
  Server,
  FileCheck2,
  ChevronDown
} from 'lucide-react';
import { LedIndicator, SkeuoButton } from './SkeuoComponents';
import { ActiveTab } from './NavigationRail';
import { SimulatedUserRole } from '../types';

interface UtilityBarProps {
  activeTab: ActiveTab;
  onOpenMobileMenu: () => void;
  onOpenScanner: () => void;
  onOpenAddAsset: () => void;
  totalAssetsCount: number;
  openJiraCount: number;
  lowStockCount: number;
  procurementPendingCount?: number;
  currentUser: string;
  activeRole?: SimulatedUserRole;
  onSelectRole?: (role: SimulatedUserRole) => void;
  availableRoles?: SimulatedUserRole[];
}

export const UtilityBar: React.FC<UtilityBarProps> = ({
  activeTab,
  onOpenMobileMenu,
  onOpenScanner,
  onOpenAddAsset,
  totalAssetsCount,
  openJiraCount,
  lowStockCount,
  procurementPendingCount = 0,
  currentUser,
  activeRole,
  onSelectRole,
  availableRoles = []
}) => {
  const titles: Record<ActiveTab, { title: string; subtitle: string; icon: React.ReactNode }> = {
    dashboard: {
      title: 'Operations Dashboard',
      subtitle: `${totalAssetsCount} total assets in fleet telemetry`,
      icon: <LayoutDashboard className="w-4 h-4 text-[#C66A2B]" />
    },
    laptops: {
      title: 'Laptop Workstations',
      subtitle: 'Mobile computing fleet and deployment tracking',
      icon: <Laptop className="w-4 h-4 text-[#C66A2B]" />
    },
    peripherals: {
      title: 'Peripherals & Accessories',
      subtitle: 'Displays, docks, keyboards, mice, audio & other accessories',
      icon: <Monitor className="w-4 h-4 text-[#2C6E9B]" />
    },
    procurement: {
      title: 'Procurement Operations',
      subtitle: `${procurementPendingCount} requests in guarded purchasing lifecycle`,
      icon: <FileCheck2 className="w-4 h-4 text-[#C66A2B]" />
    },
    stock_tracker: {
      title: 'Stock Reserves',
      subtitle: lowStockCount > 0 ? `${lowStockCount} category threshold alerts` : 'All reserve quotas nominal',
      icon: <Boxes className="w-4 h-4 text-[#C66A2B]" />
    },
    jira: {
      title: 'Jira Requests',
      subtitle: `${openJiraCount} pending provisioning requests`,
      icon: <Layers className="w-4 h-4 text-[#2C6E9B]" />
    },
    audit_trail: {
      title: 'Operational Audit Trail',
      subtitle: 'Immutable device custody and configuration logs',
      icon: <History className="w-4 h-4 text-[#C66A2B]" />
    }
  };

  const current = titles[activeTab] || titles.dashboard;

  return (
    <header className="h-13 ti-surface px-3 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-20 select-none">
      {/* Left: Mobile trigger & Current Section identity */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 rounded-md ti-btn text-[#181A1B] cursor-pointer"
          aria-label="Open navigation drawer"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Section title & count */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="hidden sm:flex items-center justify-center w-7 h-7 rounded-md ti-well border border-[#C5C3BC]">
            {current.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-[#181A1B] tracking-tight truncate">
                {current.title}
              </h1>
              <span className="hidden xl:inline-block text-[11px] text-[#686B6D] font-normal">
                • {current.subtitle}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Integration telemetry, Role Switcher, and action triggers */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Honest Demo Integration Status Group */}
        <div className="hidden lg:flex items-center gap-2.5 px-2.5 py-1 rounded ti-well text-[11px] font-sans">
          <div className="flex items-center gap-1.5" title="Local browser storage active">
            <LedIndicator color="green" size="sm" />
            <span className="text-[#505457]">Store: <strong className="text-[#181A1B] font-medium">Active</strong></span>
          </div>
          <div className="w-[1px] h-2.5 bg-[#B8B6AE]" />
          <div className="flex items-center gap-1.5" title="Jira Service Management Demo Sandbox">
            <LedIndicator color="blue" size="sm" />
            <span className="text-[#505457]">Jira: <strong className="text-[#181A1B] font-medium">Demo Sandbox</strong></span>
          </div>
          <div className="w-[1px] h-2.5 bg-[#B8B6AE]" />
          <div className="flex items-center gap-1.5" title="Simulated Apple GSX Warranty Verification API">
            <LedIndicator color="green" size="sm" />
            <span className="text-[#505457]">Apple GSX: <strong className="text-[#181A1B] font-medium">Demo API</strong></span>
          </div>
        </div>

        {/* Development / Demo Role Switcher */}
        {activeRole && onSelectRole && availableRoles.length > 0 && (
          <div className="flex flex-col justify-center bg-[#E4E2DC] px-2.5 py-1 rounded border border-[#C5C3BC]">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#707375] hidden sm:inline">
                Demo Role:
              </span>
              <select
                aria-label="Demo role selector"
                value={activeRole.id}
                onChange={(e) => {
                  const found = availableRoles.find(r => r.id === e.target.value);
                  if (found) onSelectRole(found);
                }}
                className="text-xs font-semibold text-[#181A1B] bg-transparent border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#C66A2B] rounded pr-1"
              >
                {availableRoles.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.badge}: {r.name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            {activeRole.exportScope && (
              <span 
                className="text-[9px] text-[#2C6E9B] font-mono truncate max-w-[200px] hidden md:block"
                title={`Active Export Scope: ${activeRole.exportScope}`}
              >
                Scope: {activeRole.exportScope}
              </span>
            )}
          </div>
        )}

        {/* Action: Add Hardware */}
        <SkeuoButton
          size="sm"
          variant="standard"
          onClick={onOpenAddAsset}
          icon={<Plus className="w-3.5 h-3.5 text-[#505457]" />}
          className="hidden sm:inline-flex"
        >
          Add Hardware
        </SkeuoButton>

        {/* Action: Barcode Scanner */}
        <SkeuoButton
          size="sm"
          variant="primary"
          onClick={onOpenScanner}
          icon={<Scan className="w-3.5 h-3.5" />}
        >
          <span className="hidden sm:inline">Scan</span> Asset
        </SkeuoButton>

        {/* Operator Quiet Identity */}
        <div className="hidden xl:flex items-center gap-2 pl-2 border-l border-[#D0CECA] text-xs text-[#505457]">
          <div className="w-6 h-6 rounded-full bg-[#E5E3DD] border border-[#C5C3BC] flex items-center justify-center text-[#181A1B]">
            <User className="w-3 h-3" />
          </div>
          <span className="font-medium text-[#181A1B] truncate max-w-[130px]">
            {activeRole ? activeRole.name.split(' ')[0] : currentUser.split(' ')[0]}
          </span>
        </div>
      </div>
    </header>
  );
};
