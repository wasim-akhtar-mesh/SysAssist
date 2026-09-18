import React, { useState, useEffect, useMemo } from 'react';
import { 
  Asset, 
  AssetCategory,
  AssetStatus,
  ChangeLogEntry, 
  JiraTicket,
  ProcurementRequest,
  ProcurementViewType,
  SimulatedUserRole
} from './types';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from './data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from './data/mockJira';
import { INITIAL_PROCUREMENT_REQUESTS } from './data/mockProcurement';
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
import { ProcurementView } from './components/ProcurementView';
import { TransitionResult } from './services/procurementService';
import { 
  getCategoryStockAssessments, 
  PERIPHERAL_CATEGORIES 
} from './utils/inventorySelectors';
import { generateUniqueJiraKey, generateUniqueProcurementNumber } from './utils/idGenerator';
import { 
  runSystemAssistStorageMigration, 
  STORAGE_KEYS, 
  getMigratedStorageItem, 
  setMigratedStorageItem 
} from './utils/storageMigration';

export const DEFAULT_ROLES: SimulatedUserRole[] = [
  {
    id: 'it_head',
    name: 'Wasim Akhtar',
    email: 'wasim.akhtar@meshconnect.internal',
    department: 'Hardware Operations',
    badge: 'IT Lead',
    description: 'IT Operations Head & Fleet Custodian',
    exportScope: 'Operational Requests, Stock Replenishment, and System Summaries'
  },
  {
    id: 'requester',
    name: 'Elena Rostova',
    email: 'elena.rostova@meshconnect.internal',
    department: 'Engineering Infrastructure',
    badge: 'Requester',
    description: 'Staff Engineer & Hardware Requester',
    exportScope: 'Personal Procurement Requests only'
  },
  {
    id: 'finance',
    name: 'Marcus Vance',
    email: 'marcus.vance@meshconnect.internal',
    department: 'Finance & Budget',
    badge: 'Finance Controller',
    description: 'Financial Controller & Budget Authority',
    exportScope: 'Procurement Requests, Spend Analysis, and Asset Valuation'
  },
  {
    id: 'purchasing_buyer',
    name: 'Diana Sterling',
    email: 'diana.sterling@meshconnect.internal',
    department: 'Procurement & Vendor Ops',
    badge: 'Purchasing Buyer',
    description: 'Procurement Specialist & Vendor PO Issuer',
    exportScope: 'Purchasing Queue, Purchase Orders, Vendors, and Deliveries'
  },
  {
    id: 'asset_manager',
    name: 'Kenji Sato',
    email: 'kenji.sato@meshconnect.internal',
    department: 'Depot Operations',
    badge: 'IT Asset Manager',
    description: 'Logistics Custodian & Asset Registrar',
    exportScope: 'Complete Fleet Inventory, Receiving, Registrations, and Audit Trail'
  }
];

export default function App() {
  // Execute safe one-time storage key migration on startup
  useEffect(() => {
    runSystemAssistStorageMigration();
  }, []);

  // Active Simulated User Role
  const [activeRole, setActiveRole] = useState<SimulatedUserRole>(() => {
    return getMigratedStorageItem<SimulatedUserRole>(STORAGE_KEYS.ACTIVE_ROLE, DEFAULT_ROLES[0]);
  });

  const currentUserDisplay = `${activeRole.name} (${activeRole.badge})`;

  // Load persistent state with migration fallback
  const [assets, setAssets] = useState<Asset[]>(() => {
    return getMigratedStorageItem<Asset[]>(STORAGE_KEYS.ASSETS, INITIAL_ASSETS);
  });

  const [jiraTickets, setJiraTickets] = useState<JiraTicket[]>(() => {
    return getMigratedStorageItem<JiraTicket[]>(STORAGE_KEYS.JIRA, INITIAL_JIRA_TICKETS);
  });

  const [procurementRequests, setProcurementRequests] = useState<ProcurementRequest[]>(() => {
    return getMigratedStorageItem<ProcurementRequest[]>(STORAGE_KEYS.PROCUREMENT, INITIAL_PROCUREMENT_REQUESTS);
  });

  // Global change log entries aggregated and sorted
  const [allChangeLogs, setAllChangeLogs] = useState<ChangeLogEntry[]>(() => {
    const saved = getMigratedStorageItem<ChangeLogEntry[] | null>(STORAGE_KEYS.LOGS, null);
    if (saved && Array.isArray(saved)) {
      return saved;
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

  // Sync to localStorage with dual-key persistence
  useEffect(() => {
    setMigratedStorageItem(STORAGE_KEYS.ASSETS, assets);
  }, [assets]);

  useEffect(() => {
    setMigratedStorageItem(STORAGE_KEYS.JIRA, jiraTickets);
  }, [jiraTickets]);

  useEffect(() => {
    setMigratedStorageItem(STORAGE_KEYS.LOGS, allChangeLogs);
  }, [allChangeLogs]);

  useEffect(() => {
    setMigratedStorageItem(STORAGE_KEYS.PROCUREMENT, procurementRequests);
  }, [procurementRequests]);

  useEffect(() => {
    setMigratedStorageItem(STORAGE_KEYS.ACTIVE_ROLE, activeRole);
  }, [activeRole]);

  // UI Navigation state - Initialize on dashboard
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [laptopStatusFilter, setLaptopStatusFilter] = useState<AssetStatus | 'ALL'>('ALL');
  const [peripheralCategoryFilter, setPeripheralCategoryFilter] = useState<AssetCategory | 'ALL'>('ALL');
  const [procurementInitialView, setProcurementInitialView] = useState<ProcurementViewType>('all_requests');
  const [procurementInitialStatusFilter, setProcurementInitialStatusFilter] = useState<string>('ALL');
  const [procurementSelectedRequestId, setProcurementSelectedRequestId] = useState<string | null>(null);

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

  // Active role pending procurement approvals count
  const procurementPendingCount = useMemo(() => {
    const roleEmail = activeRole.email.toLowerCase();
    return procurementRequests.filter(r => {
      if (activeRole.id === 'it_head' && r.status === 'IT Head Review') {
        return r.requester.email.toLowerCase() !== roleEmail;
      }
      if (activeRole.id === 'finance' && r.status === 'Finance Review') {
        return r.requester.email.toLowerCase() !== roleEmail;
      }
      return false;
    }).length;
  }, [procurementRequests, activeRole]);

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
          assignedTo: targetTicket.requester.name,
          assignedEmail: targetTicket.requester.email,
          assignedDepartment: targetTicket.requester.department,
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

  // Connect Stock & Procurement "Draft PO" action to create a real System Assist procurement request
  const handleDraftProcurementTicket = (item: { category: string; modelName: string; quantityToOrder: number }) => {
    const nextPRNumber = generateUniqueProcurementNumber(procurementRequests);
    const now = new Date().toISOString();
    const unitPrice = item.category === 'Laptop' ? 2499 : item.category === 'Display' ? 1299 : item.category === 'Dock' ? 349 : 149;
    const vendor = item.category === 'Laptop' ? 'Apple Enterprise Direct' : item.category === 'Display' ? 'Dell Enterprise Direct' : 'CalDigit Enterprise';

    const newPR: ProcurementRequest = {
      id: `pr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      requestNumber: nextPRNumber,
      status: 'IT Head Review',
      requester: {
        name: activeRole.name,
        email: activeRole.email,
        department: activeRole.department
      },
      department: activeRole.department,
      manager: 'Hardware Operations Lead',
      costCentre: 'CC-OPS-5501',
      category: item.category as AssetCategory,
      preferredModel: item.modelName,
      quantity: item.quantityToOrder,
      businessJustification: `Automated inventory replenishment triggered by System Assist buffer quota threshold for ${item.category} (${item.modelName}).`,
      requestType: 'New Equipment',
      requiredByDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      urgency: 'Urgent',
      estimatedUnitPrice: unitPrice,
      currency: 'USD',
      estimatedTotalCost: unitPrice * item.quantityToOrder,
      preferredVendor: vendor,
      createdAt: now,
      updatedAt: now,
      approvals: [],
      receipts: [],
      totalReceivedQuantity: 0,
      registeredAssetTags: [],
      fulfilledAssetTags: [],
      auditLogs: [
        {
          id: `audit-${Date.now()}`,
          timestamp: now,
          actor: activeRole.name,
          role: activeRole.badge,
          requestNumber: nextPRNumber,
          action: 'Automated Stock Request Drafted',
          previousState: 'Draft',
          newState: 'IT Head Review',
          notes: `Automated replenishment for ${item.quantityToOrder}x ${item.modelName} created from Stock & Procurement quota analysis.`
        }
      ]
    };

    setProcurementRequests(prev => [newPR, ...prev]);
    setProcurementInitialView('all_requests');
    setProcurementInitialStatusFilter('ALL');
    setActiveTab('procurement');
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

  const handleNavigateToProcurement = (view?: ProcurementViewType, statusFilter?: string, requestId?: string) => {
    setProcurementInitialView(view || 'all_requests');
    setProcurementInitialStatusFilter(statusFilter || 'ALL');
    setProcurementSelectedRequestId(requestId || null);
    setActiveTab('procurement');
  };

  const handleSelectProcurementRequest = (requestNumber: string) => {
    const found = procurementRequests.find(r => r.requestNumber === requestNumber);
    if (found) {
      setProcurementInitialView('all_requests');
      setProcurementInitialStatusFilter('ALL');
      setProcurementSelectedRequestId(found.id);
      setActiveTab('procurement');
    }
  };

  // Central Workflow Transition Engine Result Handler
  const handleApplyWorkflowResult = (result: TransitionResult) => {
    if (!result.success && !result.updatedRequest) {
      return;
    }

    if (result.updatedRequest) {
      setProcurementRequests(prev => prev.map(r => r.id === result.updatedRequest!.id ? result.updatedRequest! : r));
    }

    const assetsToUpdate: Asset[] = [];
    if (result.affectedAssets && result.affectedAssets.length > 0) {
      assetsToUpdate.push(...result.affectedAssets);
    } else if (result.affectedAsset) {
      assetsToUpdate.push(result.affectedAsset);
    }

    if (assetsToUpdate.length > 0) {
      setAssets(prev => {
        const map = new Map(assetsToUpdate.map(a => [a.id, a]));
        return prev.map(a => map.get(a.id) || a);
      });
    }

    if (result.createdAssets && result.createdAssets.length > 0) {
      setAssets(prev => [...result.createdAssets!, ...prev]);
    }

    const newLogs: ChangeLogEntry[] = [];
    if (result.assetLogs && result.assetLogs.length > 0) {
      newLogs.push(...result.assetLogs);
    } else if (result.assetLog) {
      newLogs.push(result.assetLog);
    }

    if (newLogs.length > 0) {
      setAllChangeLogs(prev => [...newLogs, ...prev]);
    }
  };

  // Procurement state transitions
  const handleSaveProcurementDraft = (request: ProcurementRequest) => {
    setProcurementRequests(prev => {
      const exists = prev.some(r => r.id === request.id);
      if (exists) {
        return prev.map(r => r.id === request.id ? request : r);
      }
      return [request, ...prev];
    });
  };

  const handleSubmitProcurementRequest = (request: ProcurementRequest) => {
    setProcurementRequests(prev => {
      const exists = prev.some(r => r.id === request.id);
      if (exists) {
        return prev.map(r => r.id === request.id ? request : r);
      }
      return [request, ...prev];
    });
  };

  const handleUpdateProcurementRequest = (request: ProcurementRequest, updatedAsset?: Asset) => {
    setProcurementRequests(prev => prev.map(r => r.id === request.id ? request : r));
    if (updatedAsset) {
      setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    }
  };

  const handleRegisterFleetAssets = (request: ProcurementRequest, createdAssets: Asset[]) => {
    setProcurementRequests(prev => prev.map(r => r.id === request.id ? request : r));
    setAssets(prev => [...createdAssets, ...prev]);

    // Create audit log entries for enrolled assets
    const now = new Date().toISOString();
    const newLogs: ChangeLogEntry[] = createdAssets.map((asset, i) => ({
      id: `log-reg-${Date.now()}-${i}`,
      assetId: asset.id,
      assetTag: asset.assetTag,
      assetName: asset.name,
      timestamp: now,
      performedBy: activeRole.name,
      action: 'CREATED',
      property: 'status',
      oldValue: 'None',
      newValue: asset.status,
      reason: `Registered from procurement request ${request.requestNumber} (PO: ${request.purchaseOrder?.poNumber || 'N/A'}).`,
      procurementRequestNumber: request.requestNumber
    }));

    setAllChangeLogs(prev => [...newLogs, ...prev]);
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
        procurementPendingCount={procurementPendingCount}
        totalAssetsCount={assets.length}
        currentUser={currentUserDisplay}
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
          procurementPendingCount={procurementPendingCount}
          currentUser={currentUserDisplay}
          activeRole={activeRole}
          onSelectRole={(role) => setActiveRole(role)}
          availableRoles={DEFAULT_ROLES}
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
              procurementRequests={procurementRequests}
              currentUserRole={activeRole}
              onNavigateToLaptops={handleNavigateToLaptops}
              onNavigateToPeripherals={handleNavigateToPeripherals}
              onNavigateToStock={() => setActiveTab('stock_tracker')}
              onNavigateToJira={() => setActiveTab('jira')}
              onNavigateToAudit={() => setActiveTab('audit_trail')}
              onNavigateToProcurement={handleNavigateToProcurement}
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
              currentUserRole={activeRole}
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
              currentUserRole={activeRole}
              initialCategoryFilter={peripheralCategoryFilter}
              onSelectAsset={(asset) => setSelectedAsset(asset)}
              onOpenScanner={() => setIsScannerOpen(true)}
              onNewAssetClick={() => {
                setScannerInitialBarcode('');
                setIsAddAssetOpen(true);
              }}
            />
          )}

          {/* TAB 4: PROCUREMENT CONSOLE */}
          {activeTab === 'procurement' && (
            <ProcurementView
              requests={procurementRequests}
              assets={assets}
              currentUserRole={activeRole}
              initialView={procurementInitialView}
              initialStatusFilter={procurementInitialStatusFilter}
              initialSelectedRequestId={procurementSelectedRequestId}
              onSaveDraft={handleSaveProcurementDraft}
              onSubmitRequest={handleSubmitProcurementRequest}
              onUpdateRequest={handleUpdateProcurementRequest}
              onRegisterFleetAssets={handleRegisterFleetAssets}
              onApplyWorkflowResult={handleApplyWorkflowResult}
            />
          )}

          {/* TAB 5: STOCK & PROCUREMENT */}
          {activeTab === 'stock_tracker' && (
            <AutomatedInventoryTracker
              assets={assets}
              thresholds={INVENTORY_THRESHOLDS}
              currentUserRole={activeRole}
              procurementRequests={procurementRequests}
              onDraftProcurementTicket={handleDraftProcurementTicket}
              onOpenAssetDetail={(asset) => setSelectedAsset(asset)}
            />
          )}

          {/* TAB 6: JIRA REQUESTS */}
          {activeTab === 'jira' && (
            <JiraTicketingDrawer
              tickets={jiraTickets}
              assets={assets}
              currentUserRole={activeRole}
              onCreateTicket={handleCreateJiraTicket}
              onFulfillTicket={handleFulfillJiraTicket}
              currentUser={currentUserDisplay}
              onSelectAssetByTag={handleSelectAssetByTag}
            />
          )}

          {/* TAB 7: AUDIT TRAIL */}
          {activeTab === 'audit_trail' && (
            <AuditTrailView
              changeLogs={allChangeLogs}
              procurementRequests={procurementRequests}
              currentUserRole={activeRole}
              onSelectAssetByTag={handleSelectAssetByTag}
              onSelectProcurementRequest={handleSelectProcurementRequest}
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
          currentUser={currentUserDisplay}
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
        currentUser={currentUserDisplay}
        existingAssets={assets}
      />

    </div>
  );
}

