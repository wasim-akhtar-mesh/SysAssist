import React, { useState, useEffect } from 'react';
import { 
  Asset, 
  ChangeLogEntry, 
  JiraTicket, 
  InventoryThreshold 
} from './types';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from './data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from './data/mockJira';
import { HeaderBar } from './components/HeaderBar';
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
    // Combine logs from all initial assets and initial logs
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'stock_tracker' | 'jira' | 'audit_trail'>('inventory');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAddAssetOpen, setIsAddAssetOpen] = useState<boolean>(false);
  const [scannerInitialBarcode, setScannerInitialBarcode] = useState<string>('');

  // Count metrics
  const openJiraCount = jiraTickets.filter(t => t.status !== 'Fulfilled').length;
  const lowStockCount = assets.filter(a => a.status === 'In Stock' && a.category === 'Dock').length <= 1 ? 1 : 0;

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

  const handleAddJiraTicket = (ticket: JiraTicket) => {
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
          linkedAssetTag: log.assetTag,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    setAllChangeLogs(prev => [log, ...prev]);
  };

  const handleDraftProcurementTicket = (item: { category: string; modelName: string; quantityToOrder: number }) => {
    const newKey = `SYS-${Math.floor(1090 + Math.random() * 50)}`;
    const ticket: JiraTicket = {
      key: newKey,
      summary: `Automated Procurement PO: Restock ${item.quantityToOrder}x ${item.modelName}`,
      description: `Automated inventory alert triggered by SysAssist buffer threshold. Category ${item.category} has reached critical minimum reserves. Please generate purchase order and dispatch to preferred enterprise supplier.`,
      issueType: 'Hardware Request',
      status: 'Open',
      priority: 'High',
      requester: {
        name: CURRENT_USER,
        email: 'wasim.akhtar@meshconnect.com',
        department: 'IT Infrastructure & Operations'
      },
      requestedEquipment: `${item.quantityToOrder}x ${item.modelName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setJiraTickets(prev => [ticket, ...prev]);
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
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-white">
      
      {/* Header Bar */}
      <HeaderBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        openJiraCount={openJiraCount}
        lowStockCount={lowStockCount}
        totalAssetsCount={assets.length}
        currentUser={CURRENT_USER}
      />

      {/* Main Structural Bay */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
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

        {activeTab === 'stock_tracker' && (
          <AutomatedInventoryTracker
            assets={assets}
            thresholds={INVENTORY_THRESHOLDS}
            onDraftProcurementTicket={handleDraftProcurementTicket}
            onOpenAssetDetail={(asset) => setSelectedAsset(asset)}
          />
        )}

        {activeTab === 'jira' && (
          <JiraTicketingDrawer
            isOpen={true}
            onClose={() => setActiveTab('inventory')}
            tickets={jiraTickets}
            assets={assets}
            onAddTicket={handleAddJiraTicket}
            onFulfillTicket={handleFulfillJiraTicket}
            currentUser={CURRENT_USER}
          />
        )}

        {activeTab === 'audit_trail' && (
          <AuditTrailView
            changeLogs={allChangeLogs}
            onSelectAssetByTag={handleSelectAssetByTag}
          />
        )}
      </main>

      {/* Modal 1: Asset Details & Reassignment Drawer */}
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

      {/* Modal 2: Barcode Scanner */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        assets={assets}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
        onNewAssetScan={handleNewAssetFromScan}
      />

      {/* Modal 3: Provision New Hardware Asset */}
      <AddAssetModal
        isOpen={isAddAssetOpen}
        onClose={() => setIsAddAssetOpen(false)}
        onAddAsset={handleAddAsset}
        initialBarcode={scannerInitialBarcode}
        currentUser={CURRENT_USER}
      />

      {/* Subtle Skeuomorphic Baseboard / Chassis Footer */}
      <footer className="skeuo-metal-header py-3 px-6 border-t border-black text-center text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>SysAssist Telemetry Node: <strong>ONLINE</strong></span>
        </div>
        <div>
          <span>MeshConnect Enterprise Hardware Management System</span>
        </div>
        <div className="text-[11px] text-slate-400">
          <span>Barcode Detector • Apple GSX API • Jira Cloud Sync</span>
        </div>
      </footer>

    </div>
  );
}
