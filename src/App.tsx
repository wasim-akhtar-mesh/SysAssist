import React, { useState, useEffect, useMemo } from 'react';
import { 
  Asset, 
  AssetCategory,
  AssetStatus,
  ChangeLogEntry, 
  JiraTicket 
} from './types';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from './data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from './data/mockJira';
import { NavigationRail, ActiveTab } from './components/NavigationRail';
import { UtilityBar } from './components/UtilityBar';
import { DashboardView } from './components/DashboardView';
import { AssetListView } from './components/AssetListView';
import { AutomatedInventoryTracker } from './components/AutomatedInventoryTracker';
import { JiraTicketingDrawer } from './components/JiraTicketingDrawer';
import { AuditTrailView } from './components/AuditTrailView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AddAssetModal } from './components/AddAssetModal';
import { 
  getCategoryStockAssessments, 
  PERIPHERAL_CATEGORIES 
} from './utils/inventorySelectors';
import { generateUniqueJiraKey } from './utils/idGenerator';

const CURRENT_USER = 'Wasim Akhtar (IT Lead)';

export default function App() {
  // Load persistent state from localStorage or initial dataset
  const [assets, setAssets] = useState<Asset[]>(() => {
    try {
      const saved = localStorage.getItem('sysassist_assets');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_ASSETS;
  });

  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>(() => {
    try {
      const saved = localStorage.getItem('sysassist_jira');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_JIRA_TICKETS;
  });

  // Global change log entries aggregated and sorted
  const [allChangeLogs, setAllChangeLogs] = useState<ChangeLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('sysassist_logs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    const aggregated = [...INITIAL_CHANGE_LOGS];
    INITIAL_ASSETS.forEach(a => {
      a.changeLogs?.forEach(l => {
        if (!aggregated.some(ex => ex.id === l.id)) {
          aggregated.push(l);
        }
      });
    });
    return aggregated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('sysassist_assets', JSON.stringify(assets));
    } catch {
      // ignore
    }
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('sysassist_jira', JSON.stringify(jiraTickets));
    } catch {
      // ignore
    }
  }, [jiraTickets]);

  useEffect(() => {
    try {
      localStorage.setItem('sysassist_logs', JSON.stringify(allChangeLogs));
    } catch {
      // ignore
    }
  }, [allChangeLogs]);

  // UI Navigation state - Initialize on dashboard
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [laptopStatusFilter, setLaptopStatusFilter] = useState<AssetStatus | 'ALL'>('ALL');
  const [peripheralCategoryFilter, setPeripheralCategoryFilter] = useState<AssetCategory | 'ALL'>('ALL');

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [scannerInitialBarcode, setScannerInitialBarcode] = useState<string>('');
  
  // Responsive navigation state
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(false);
  const [isMobileRailOpen, setIsMobileRailOpen] = useState<boolean>(false);

  // Dynamic calculations updated automatically with zero reload
  const openJiraCount = useMemo(() => {
    return jiraTickets.filter(t => t.status !== 'Fulfilled').length;
  }, [jiraTickets]);

  const lowStockCount = useMemo(() => {
    return getCategoryStockAssessments(assets, INVENTORY_THRESHOLDS).filter(c => c.isLowStock).length;
  }, [assets]);

  const laptopCount = useMemo(() => {
    return assets.filter(a => a.category === 'Laptop').length;
  }, [assets]);

  const peripheralCount = useMemo(() => {
    return assets.filter(a => (PERIPHERAL_CATEGORIES as readonly string[]).includes(a.category)).length;
  }, [assets]);

  // Handlers
  const handleUpdateAsset = (updatedAsset: Asset, newLog: ChangeLogEntry) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    setSelectedAsset(updatedAsset);
    setAllChangeLogs(prev => [newLog, ...prev]);
  };

  const handleAddAsset = (newAsset: Asset, initialLog: ChangeLogEntry) => {
    setAssets(prev => [newAsset, ...prev]);
    setAllChangeLogs(prev => [initialLog, ...prev]);
    setSelectedAsset(newAsset);
  };

  const handleCreateJiraTicket = (ticket: JiraTicket) => {
    setJiraTickets(prev => [ticket, ...prev]);
  };

  const handleFulfillJiraTicket = (ticketKey: string, assetId: string, log: ChangeLogEntry) => {
    const targetTicket = jiraTickets.find(t => t.key === ticketKey);
    if (!targetTicket || targetTicket.status === 'Fulfilled' || targetTicket.status === 'Closed') return;

    // Update target asset
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          status: 'In Use',
          assignedTo: {
            name: targetTicket.requester.name,
            email: targetTicket.requester.email,
            department: targetTicket.requester.department,
            assignedDate: new Date().toISOString().slice(0, 10),
            role: 'Hardware Requester'
          },
          linkedJiraKey: ticketKey,
          changeLogs: [log, ...(a.changeLogs || [])]
        };
      }
      return a;
    }));

    // Update ticket status
    setJiraTickets(prev => prev.map(t => {
      if (t.key === ticketKey) {
        return {
          ...t,
          status: 'Fulfilled',
          fulfilledAssetTag: log.assetTag
        };
      }
      return t;
    }));

    setAllChangeLogs(prev => [log, ...prev]);
  };

  const handleDraftProcurementTicket = (item: { category: string; modelName: string; quantityToOrder: number }) => {
    const nextKey = generateUniqueJiraKey(jiraTickets);
    const now = new Date().toISOString();
    const newTicket: JiraTicket = {
      key: nextKey,
      summary: `Automated PO: Restock ${item.quantityToOrder}x ${item.modelName}`,
      description: `Automated inventory alert triggered by SysAssist buffer quota. Category ${item.category} has reached critical minimum reserves. Please generate purchase order and dispatch to preferred enterprise supplier.`,
      issueType: 'Hardware Request',
      status: 'Open',
      priority: 'High',
      createdAt: now,
      updatedAt: now,
      requester: {
        name: CURRENT_USER,
        email: 'wasim.akhtar@meshconnect.internal',
        department: 'Hardware Operations'
      },
      requestedHardware: `${item.quantityToOrder}x ${item.modelName}`,
      requestedCategory: item.category as AssetCategory
    };

    setJiraTickets(prev => [newTicket, ...prev]);
    setActiveTab('jira');
  };

  const handleSelectAssetByTag = (tag: string) => {
    const found = assets.find(a => a.assetTag.toUpperCase() === tag.toUpperCase());
    if (found) {
      setSelectedAsset(found);
    }
  };

  const handleNewAssetFromScan = (barcode: string) => {
    setScannerInitialBarcode(barcode);
    setIsAddAssetOpen(true);
  };

  // Dashboard navigation shortcuts
  const handleNavigateToLaptops = (statusFilter?: AssetStatus | 'ALL') => {
    setLaptopStatusFilter(statusFilter || 'ALL');
    setActiveTab('laptops');
  };

  const handleNavigateToPeripherals = (categoryFilter?: AssetCategory | 'ALL') => {
    setPeripheralCategoryFilter(categoryFilter || 'ALL');
    setActiveTab('peripherals');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#D8D7D2] text-[#181A1B] font-sans antialiased select-auto selection:bg-[#C66A2B] selection:text-white">
      
      {/* 1. Left Navigation Rail (Desktop Fixed/Collapsible & Mobile Drawer) */}
      <NavigationRail
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenAddAsset={() => {
          setScannerInitialBarcode('');
          setIsAddAssetOpen(true);
        }}
        laptopCount={laptopCount}
        peripheralCount={peripheralCount}
        openJiraCount={openJiraCount}
        lowStockCount={lowStockCount}
        totalAssetsCount={assets.length}
        currentUser={CURRENT_USER}
        isCollapsed={isRailCollapsed}
        onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
        isMobileOpen={isMobileRailOpen}
        onCloseMobile={() => setIsMobileRailOpen(false)}
      />

      {/* 2. Main Workspace Area (Utility Bar + Dynamic Full-Viewport Canvas) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden bg-[#D8D7D2]">
        
        {/* Compact Utility Bar across Top */}
        <UtilityBar
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileRailOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          onOpenAddAsset={() => {
            setScannerInitialBarcode('');
            setIsAddAssetOpen(true);
          }}
          totalAssetsCount={assets.length}
          openJiraCount={openJiraCount}
          lowStockCount={lowStockCount}
          currentUser={CURRENT_USER}
        />

        {/* Scrollable Main Workspace Content */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 w-full max-w-[2200px]">
          
          {/* TAB 1: DASHBOARD (Initial view) */}
          {activeTab === 'dashboard' && (
            <DashboardView
              assets={assets}
              jiraTickets={jiraTickets}
              changeLogs={allChangeLogs}
              thresholds={INVENTORY_THRESHOLDS}
              onNavigateToLaptops={handleNavigateToLaptops}
              onNavigateToPeripherals={handleNavigateToPeripherals}
              onNavigateToStock={() => setActiveTab('stock_tracker')}
              onNavigateToJira={() => setActiveTab('jira')}
              onNavigateToAudit={() => setActiveTab('audit_trail')}
              onSelectAssetByTag={handleSelectAssetByTag}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenAddAsset={() => {
                setScannerInitialBarcode('');
                setIsAddAssetOpen(true);
              }}
            />
          )}

          {/* TAB 2: LAPTOPS */}
          {activeTab === 'laptops' && (
            <AssetListView
              section="laptops"
              assets={assets}
              initialStatusFilter={laptopStatusFilter}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNewAssetClick={() => {
                setScannerInitialBarcode('');
                setIsAddAssetOpen(true);
              }}
            />
          )}

          {/* TAB 3: PERIPHERALS */}
          {activeTab === 'peripherals' && (
            <AssetListView
              section="peripherals"
              assets={assets}
              initialCategoryFilter={peripheralCategoryFilter}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNewAssetClick={() => {
                setScannerInitialBarcode('');
                setIsAddAssetOpen(true);
              }}
            />
          )}

          {/* TAB 4: STOCK & PROCUREMENT */}
          {activeTab === 'stock_tracker' && (
            <AutomatedInventoryTracker
              assets={assets}
              thresholds={INVENTORY_THRESHOLDS}
              onDraftProcurementTicket={handleDraftProcurementTicket}
              onOpenAssetDetail={(asset) => setSelectedAsset(asset)}
            />
          )}

          {/* TAB 5: JIRA REQUESTS */}
          {activeTab === 'jira' && (
            <JiraTicketingDrawer
              tickets={jiraTickets}
              assets={assets}
              onCreateTicket={handleCreateJiraTicket}
              onFulfillTicket={handleFulfillJiraTicket}
              currentUser={CURRENT_USER}
              onSelectAssetByTag={handleSelectAssetByTag}
            />
          )}

          {/* TAB 6: AUDIT TRAIL */}
          {activeTab === 'audit_trail' && (
            <AuditTrailView
              changeLogs={allChangeLogs}
              onSelectAssetByTag={handleSelectAssetByTag}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: Asset Inspector Drawer */}
      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          isOpen={true}
          onClose={() => setSelectedAsset(null)}
          onUpdateAsset={handleUpdateAsset}
          currentUser={CURRENT_USER}
          jiraTickets={jiraTickets}
        />
      )}

      {/* MODAL 2: Barcode & Serial Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
        onNewAssetScan={handleNewAssetFromScan}
      />

      {/* MODAL 3: Hardware Intake Dialog */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => {
          setIsAddAssetOpen(false);
          setScannerInitialBarcode('');
        }}
        onAddAsset={handleAddAsset}
        initialBarcode={scannerInitialBarcode}
        currentUser={CURRENT_USER}
        existingAssets={assets}
      />

    </div>
  );
}
