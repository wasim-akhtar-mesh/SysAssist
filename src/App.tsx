import React, { useState, useEffect } from 'react';
import { 
  Asset, 
  ChangeLogEntry, 
  JiraTicket, 
  InventoryThreshold 
} from './types';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from './data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from './data/mockJira';
import { NavigationRail, ActiveTab } from './components/NavigationRail';
import { UtilityBar } from './components/UtilityBar';
import { AssetListView } from './components/AssetListView';
import { AutomatedInventoryTracker } from './components/AutomatedInventoryTracker';
import { JiraTicketingDrawer } from './components/JiraTicketingDrawer';
import { AuditTrailView } from './components/AuditTrailView';
import { AssetDetailModal } from './components/AssetDetailModal';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { AddAssetModal } from './components/AddAssetModal';
import { soundFx } from './services/audioService';

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
      a.changeLogs.forEach(l => {
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

  // UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('inventory');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [scannerInitialBarcode, setScannerInitialBarcode] = useState<string>('');
  
  // Responsive navigation state
  const [isRailCollapsed, setIsRailCollapsed] = useState<boolean>(false);
  const [isMobileRailOpen, setIsMobileRailOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundFx.soundEnabled = next;
    setSoundEnabled(next);
    if (next) {
      soundFx.playMechanicalClick();
    }
  };

  // Count metrics
  const openJiraCount = jiraTickets.filter(t => t.status !== 'Fulfilled').length;
  const lowStockCount = assets.filter(a => a.status === 'In Stock' && (a.category === 'Dock' || a.category === 'Display')).length <= 2 ? 1 : 0;

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
    if (!targetTicket) return;

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
          changeLogs: [log, ...a.changeLogs]
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
    const nextKey = `SYS-${1085 + jiraTickets.length}`;
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
      requestedEquipment: `${item.quantityToOrder}x ${item.modelName}`
    };

    setJiraTickets(prev => [newTicket, ...prev]);
    setActiveTab('jira');
    soundFx.playReassignSuccess();
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
        openJiraCount={openJiraCount}
        lowStockCount={lowStockCount}
        totalAssetsCount={assets.length}
        currentUser={CURRENT_USER}
        isCollapsed={isRailCollapsed}
        onToggleCollapse={() => setIsRailCollapsed(!isRailCollapsed)}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
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

        {/* Scrollable Main Workspace Content (Uses all remaining space; max-w-[2200px] only on ultrawide) */}
        <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 py-3.5 sm:py-5 w-full max-w-[2200px]">
          
          {/* TAB 1: INVENTORY BAY */}
          {activeTab === 'inventory' && (
            <AssetListView
              assets={assets}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNewAssetClick={() => {
                setScannerInitialBarcode('');
                setIsAddAssetOpen(true);
              }}
            />
          )}

          {/* TAB 2: STOCK RESERVES */}
          {activeTab === 'stock_tracker' && (
            <AutomatedInventoryTracker
              assets={assets}
              thresholds={INVENTORY_THRESHOLDS}
              onDraftProcurementTicket={handleDraftProcurementTicket}
              onOpenAssetDetail={(asset) => setSelectedAsset(asset)}
            />
          )}

          {/* TAB 3: JIRA CLOUD DESK */}
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

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit_trail' && (
            <AuditTrailView
              changeLogs={allChangeLogs}
              onSelectAssetByTag={handleSelectAssetByTag}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: Asset Inspector Drawer (Right-side drawer on desktop, sheet on mobile) */}
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

      {/* MODAL 2: Barcode & Serial Scanner (Centered focused dialog) */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
        onNewAssetScan={handleNewAssetFromScan}
      />

      {/* MODAL 3: Hardware Intake Dialog (Centered focused dialog) */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAddAsset={handleAddAsset}
        initialBarcode={scannerInitialBarcode}
        currentUser={CURRENT_USER}
      />

    </div>
  );
}
