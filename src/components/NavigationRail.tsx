import React from 'react';
import { 
  LayoutDashboard,
  Laptop, 
  Monitor,
  Boxes, 
  Layers, 
  History, 
  Scan, 
  Plus, 
  User, 
  ChevronLeft, 
  ChevronRight,
  X,
  FileCheck2
} from 'lucide-react';
import { SystemAssistRailLockup } from './BrandLogo';
import { LedIndicator } from './SkeuoComponents';

export type ActiveTab = 'dashboard' | 'laptops' | 'peripherals' | 'stock_tracker' | 'procurement' | 'jira' | 'audit_trail';

interface NavigationRailProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenScanner: () => void;
  onOpenAddAsset: () => void;
  laptopCount: number;
  peripheralCount: number;
  openJiraCount: number;
  lowStockCount: number;
  procurementPendingCount?: number;
  totalAssetsCount: number;
  currentUser: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  onSelectTab,
  onOpenScanner,
  onOpenAddAsset,
  laptopCount,
  peripheralCount,
  openJiraCount,
  lowStockCount,
  procurementPendingCount = 0,
  totalAssetsCount,
  currentUser,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const navItems = [
    {
      id: 'dashboard' as const,
      label: 'Dashboard',
      shortLabel: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />
    },
    {
      id: 'laptops' as const,
      label: 'Laptops',
      shortLabel: 'Laptops',
      count: laptopCount,
      icon: <Laptop className="w-4 h-4 shrink-0" />
    },
    {
      id: 'peripherals' as const,
      label: 'Peripherals',
      shortLabel: 'Peripherals',
      count: peripheralCount,
      icon: <Monitor className="w-4 h-4 shrink-0" />
    },
    {
      id: 'procurement' as const,
      label: 'Procurement',
      shortLabel: 'Procure',
      badge: procurementPendingCount > 0 ? `${procurementPendingCount}` : undefined,
      badgeColor: 'amber' as const,
      icon: <FileCheck2 className="w-4 h-4 shrink-0" />
    },
    {
      id: 'stock_tracker' as const,
      label: 'Stock Reserves',
      shortLabel: 'Stock',
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : undefined,
      badgeColor: 'amber' as const,
      icon: <Boxes className="w-4 h-4 shrink-0" />
    },
    {
      id: 'jira' as const,
      label: 'Jira Requests',
      shortLabel: 'Jira',
      badge: openJiraCount > 0 ? `${openJiraCount}` : undefined,
      badgeColor: 'blue' as const,
      icon: <Layers className="w-4 h-4 shrink-0" />
    },
    {
      id: 'audit_trail' as const,
      label: 'Audit Trail',
      shortLabel: 'Audit',
      icon: <History className="w-4 h-4 shrink-0" />
    }
  ];

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const railWidth = isCollapsed ? 'w-[68px]' : 'w-[236px]';

  const railContent = (
    <div className="h-full flex flex-col justify-between text-[#B3B6B9] font-sans">
      {/* Top Header & Brand Area */}
      <div>
        <div className="h-14 border-b border-[#23272B] flex items-center justify-between px-3">
          <SystemAssistRailLockup collapsed={isCollapsed} />
          
          {/* Collapse Toggle for Desktop */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex items-center justify-center w-6 h-6 rounded text-[#84878A] hover:text-[#FAF9F5] hover:bg-white/[0.06] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
            aria-label={isCollapsed ? 'Expand navigation rail' : 'Collapse navigation rail'}
          >
            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Close button for Mobile Drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden flex items-center justify-center w-7 h-7 rounded text-[#84878A] hover:text-[#FAF9F5] hover:bg-white/[0.08]"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Operational Scope Badge (Expanded only) */}
        {!isCollapsed && (
          <div className="px-3 pt-3 pb-1">
            <div className="px-2.5 py-1.5 rounded bg-[#1C1F23] border border-[#2B3036] flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <LedIndicator color="green" size="sm" />
                <span className="text-[#9A9DA1] font-medium">Telemetry Online</span>
              </div>
              <span className="font-mono text-[10px] text-[#C66A2B] font-semibold tracking-wider">
                {totalAssetsCount} ASSETS
              </span>
            </div>
          </div>
        )}

        {/* Primary Navigation Links */}
        <nav className="p-2 space-y-1" aria-label="Workstation Navigation">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-[#22262B] text-[#FAF9F5] font-semibold border-l-2 border-l-[#C66A2B] shadow-xs'
                    : 'text-[#8F9295] hover:text-[#FAF9F5] hover:bg-[#1A1D21]'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? `${item.label} (${item.count ?? ''})` : undefined}
              >
                <div className={isActive ? 'text-[#C66A2B]' : 'text-[#8F9295]'}>
                  {item.icon}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="truncate">{item.label}</span>
                    {item.count !== undefined && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                        isActive ? 'bg-[#151719] text-[#FAF9F5] border border-[#343A42]' : 'text-[#6C7074]'
                      }`}>
                        {item.count}
                      </span>
                    )}
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        item.badgeColor === 'amber'
                          ? 'bg-[#D97706]/20 text-[#F59E0B] border border-[#D97706]/40'
                          : 'bg-[#2563EB]/20 text-[#60A5FA] border border-[#2563EB]/40'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}

                {/* Collapsed Badge Dot */}
                {isCollapsed && (item.badge || (item.count !== undefined && item.count > 0)) && (
                  <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-[#C66A2B]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Operational Actions */}
        <div className="p-2 pt-3 border-t border-[#23272B] mt-2 space-y-1.5">
          {!isCollapsed && (
            <span className="px-2.5 text-[10px] font-sans uppercase tracking-wider text-[#63676B] font-semibold block mb-1">
              Actions
            </span>
          )}

          {/* Quick Scanner Action */}
          <button
            onClick={() => {
              onOpenScanner();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-semibold text-white bg-[#C66A2B] hover:bg-[#B55E22] active:translate-y-[1px] transition-all cursor-pointer shadow-xs ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Scan asset barcode or serial"
          >
            <Scan className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Scan Asset</span>}
          </button>

          {/* Add Hardware Action */}
          <button
            onClick={() => {
              onOpenAddAsset();
              if (onCloseMobile) onCloseMobile();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium text-[#C8CACD] bg-[#1E2226] hover:bg-[#262B30] hover:text-white border border-[#2E3339] active:translate-y-[1px] transition-all cursor-pointer ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
            title="Intake new equipment"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Add Hardware</span>}
          </button>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-2 border-t border-[#23272B]">
        {/* Operator Info */}
        {!isCollapsed ? (
          <div className="p-2 rounded bg-[#181B1E] border border-[#272B30] flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-full bg-[#272B31] border border-[#3A4048] flex items-center justify-center text-[#E2E0D8] shrink-0">
              <User className="w-3 h-3" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#FAF9F5] truncate leading-tight">
                {currentUser}
              </div>
              <div className="text-[10px] text-[#7A7E82] leading-tight flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span>Station Ready</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-1" title={`Operator: ${currentUser}`}>
            <div className="w-7 h-7 rounded-full bg-[#272B31] border border-[#3A4048] flex items-center justify-center text-[#E2E0D8]">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-2 py-1 text-[10px] font-mono text-[#585B5E] text-center">
            SYSTEM ASSIST • WORKSTATION
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Rail (Fixed / Collapsible) */}
      <aside 
        className={`hidden md:block shrink-0 ti-rail h-screen transition-all duration-150 z-30 select-none ${railWidth}`}
        aria-label="Desktop Workspace Rail"
      >
        {railContent}
      </aside>

      {/* Mobile Drawer (When hamburger toggled on small screens) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-[260px] max-w-[85vw] h-full ti-rail shadow-2xl z-10 animate-slide-in">
            {railContent}
          </div>
        </div>
      )}
    </>
  );
};
