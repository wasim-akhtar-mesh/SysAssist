import { Asset, AssetCategory, ChangeLogEntry, InventoryThreshold, JiraTicket } from '../types';

export const PERIPHERAL_CATEGORIES: AssetCategory[] = [
  'Display',
  'Dock',
  'Keyboard',
  'Mouse',
  'Audio/Headset',
  'Other'
];

export interface LaptopMetrics {
  total: number;
  available: number;
  assigned: number;
  maintenance: number;
}

export interface PeripheralCategoryMetric {
  category: AssetCategory;
  label: string;
  total: number;
  inStock: number;
  inUse: number;
}

export interface PeripheralMetrics {
  total: number;
  byCategory: Record<AssetCategory, PeripheralCategoryMetric>;
}

export interface LowStockCategoryResult {
  category: AssetCategory;
  modelName: string;
  minQuantity: number;
  criticalThreshold: number;
  total: number;
  inStock: number;
  inUse: number;
  maintenance: number;
  deficit: number;
  isLowStock: boolean;
  isCritical: boolean;
}

export interface DashboardMetrics {
  laptops: LaptopMetrics;
  peripherals: PeripheralMetrics;
  openJiraCount: number;
  lowStockCount: number;
  lowStockCategories: LowStockCategoryResult[];
  recentAuditEvents: ChangeLogEntry[];
}

/**
 * Returns whether an asset belongs to the Laptop category
 */
export function isLaptop(asset: Asset): boolean {
  return asset.category === 'Laptop';
}

/**
 * Returns whether an asset belongs to any Peripheral category
 */
export function isPeripheral(asset: Asset): boolean {
  return asset.category !== 'Laptop';
}

/**
 * Returns whether an asset category is considered a Peripheral
 */
export function isPeripheralCategory(category: AssetCategory): boolean {
  return category !== 'Laptop';
}

/**
 * Calculates laptop metrics:
 * - Total laptops
 * - Available laptops: Laptop + In Stock
 * - Assigned laptops: Laptop + assignedTo !== null (or In Use)
 * - Maintenance: Laptop + Maintenance
 */
export function getLaptopMetrics(assets: Asset[]): LaptopMetrics {
  const laptops = assets.filter(isLaptop);
  const total = laptops.length;
  const available = laptops.filter(a => a.status === 'In Stock').length;
  const assigned = laptops.filter(a => a.assignedTo !== null || a.status === 'In Use').length;
  const maintenance = laptops.filter(a => a.status === 'Maintenance').length;

  return {
    total,
    available,
    assigned,
    maintenance
  };
}

/**
 * Calculates peripheral totals and per-category breakdown
 */
export function getPeripheralMetrics(assets: Asset[]): PeripheralMetrics {
  const peripheralAssets = assets.filter(isPeripheral);
  const total = peripheralAssets.length;

  const labels: Record<AssetCategory, string> = {
    'Laptop': 'Laptops',
    'Display': 'Displays',
    'Dock': 'Docks',
    'Keyboard': 'Keyboards',
    'Mouse': 'Mice',
    'Audio/Headset': 'Audio / Headsets',
    'Other': 'Other Peripherals'
  };

  const byCategory = {} as Record<AssetCategory, PeripheralCategoryMetric>;

  PERIPHERAL_CATEGORIES.forEach(cat => {
    const catAssets = assets.filter(a => a.category === cat);
    byCategory[cat] = {
      category: cat,
      label: labels[cat] || cat,
      total: catAssets.length,
      inStock: catAssets.filter(a => a.status === 'In Stock').length,
      inUse: catAssets.filter(a => a.status === 'In Use').length
    };
  });

  return {
    total,
    byCategory
  };
}

/**
 * Calculates open Jira requests (not Fulfilled or Closed)
 */
export function getOpenJiraTicketsCount(tickets: JiraTicket[]): number {
  return tickets.filter(t => t.status !== 'Fulfilled' && t.status !== 'Closed').length;
}

/**
 * Centralized low-stock calculation based on INVENTORY_THRESHOLDS.
 * Evaluates in-stock items against minimum buffer thresholds.
 */
export function getCategoryStockAssessments(
  assets: Asset[],
  thresholds: InventoryThreshold[]
): LowStockCategoryResult[] {
  return thresholds.map(t => {
    const catAssets = assets.filter(a => a.category === t.category);
    const total = catAssets.length;
    const inStock = catAssets.filter(a => a.status === 'In Stock').length;
    const inUse = catAssets.filter(a => a.status === 'In Use').length;
    const maintenance = catAssets.filter(a => a.status === 'Maintenance').length;
    const deficit = Math.max(0, t.minQuantity - inStock);
    const isLowStock = inStock < t.minQuantity;
    const isCritical = inStock <= t.criticalThreshold;

    return {
      category: t.category,
      modelName: t.modelName,
      minQuantity: t.minQuantity,
      criticalThreshold: t.criticalThreshold,
      total,
      inStock,
      inUse,
      maintenance,
      deficit,
      isLowStock,
      isCritical
    };
  });
}

/**
 * Returns only the low-stock categories
 */
export function getLowStockCategories(
  assets: Asset[],
  thresholds: InventoryThreshold[]
): LowStockCategoryResult[] {
  return getCategoryStockAssessments(assets, thresholds).filter(item => item.isLowStock);
}

/**
 * Shared low-stock count used across Dashboard, NavigationRail badges, and Stock Tracker
 */
export function getLowStockCount(
  assets: Asset[],
  thresholds: InventoryThreshold[]
): number {
  return getLowStockCategories(assets, thresholds).length;
}

/**
 * Retrieves the most recent audit events, sorted by timestamp descending
 */
export function getRecentAuditEvents(
  changeLogs: ChangeLogEntry[],
  limit: number = 5
): ChangeLogEntry[] {
  return [...changeLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Aggregates all dashboard metrics in one call
 */
export function getDashboardMetrics(
  assets: Asset[],
  tickets: JiraTicket[],
  thresholds: InventoryThreshold[],
  changeLogs: ChangeLogEntry[]
): DashboardMetrics {
  const laptops = getLaptopMetrics(assets);
  const peripherals = getPeripheralMetrics(assets);
  const openJiraCount = getOpenJiraTicketsCount(tickets);
  const lowStockCategories = getLowStockCategories(assets, thresholds);
  const lowStockCount = lowStockCategories.length;
  const recentAuditEvents = getRecentAuditEvents(changeLogs, 5);

  return {
    laptops,
    peripherals,
    openJiraCount,
    lowStockCount,
    lowStockCategories,
    recentAuditEvents
  };
}
