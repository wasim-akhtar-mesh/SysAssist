import { describe, it, expect } from 'vitest';
import { 
  getDashboardMetrics, 
  getCategoryStockAssessments, 
  PERIPHERAL_CATEGORIES 
} from '../utils/inventorySelectors';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from '../data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from '../data/mockJira';
import { Asset, ChangeLogEntry } from '../types';

describe('inventorySelectors and Dashboard Metrics', () => {
  it('strictly excludes Laptops from PERIPHERAL_CATEGORIES', () => {
    expect((PERIPHERAL_CATEGORIES as readonly string[])).not.toContain('Laptop');
    expect(PERIPHERAL_CATEGORIES).toEqual([
      'Display',
      'Dock',
      'Keyboard',
      'Mouse',
      'Audio/Headset',
      'Other'
    ]);
  });

  it('calculates dashboard metrics accurately from current asset state', () => {
    const metrics = getDashboardMetrics(
      INITIAL_ASSETS,
      INITIAL_JIRA_TICKETS,
      INVENTORY_THRESHOLDS,
      INITIAL_CHANGE_LOGS
    );

    // Verify laptop metrics
    const actualLaptops = INITIAL_ASSETS.filter(a => a.category === 'Laptop');
    expect(metrics.laptops.total).toBe(actualLaptops.length);
    expect(metrics.laptops.available).toBe(actualLaptops.filter(a => a.status === 'In Stock').length);
    expect(metrics.laptops.assigned).toBe(actualLaptops.filter(a => a.assignedTo !== null).length);
    expect(metrics.laptops.maintenance).toBe(actualLaptops.filter(a => a.status === 'Maintenance').length);

    // Total laptops = available + assigned + maintenance (or decommissioned if any)
    expect(metrics.laptops.available + metrics.laptops.assigned + metrics.laptops.maintenance).toBe(metrics.laptops.total);

    // Verify peripheral metrics
    const actualPeripherals = INITIAL_ASSETS.filter(a => (PERIPHERAL_CATEGORIES as readonly string[]).includes(a.category));
    expect(metrics.peripherals.total).toBe(actualPeripherals.length);
    expect(metrics.peripherals.total + metrics.laptops.total).toBe(INITIAL_ASSETS.length);

    // Verify each peripheral category breakdown
    PERIPHERAL_CATEGORIES.forEach(cat => {
      const catAssets = INITIAL_ASSETS.filter(a => a.category === cat);
      expect(metrics.peripherals.byCategory[cat].total).toBe(catAssets.length);
      expect(metrics.peripherals.byCategory[cat].inStock).toBe(catAssets.filter(a => a.status === 'In Stock').length);
      expect(metrics.peripherals.byCategory[cat].inUse).toBe(catAssets.filter(a => a.status === 'In Use').length);
    });

    // Verify open Jira count
    const openTickets = INITIAL_JIRA_TICKETS.filter(t => t.status !== 'Fulfilled');
    expect(metrics.openJiraCount).toBe(openTickets.length);

    // Verify recent 5 audit events
    expect(metrics.recentAuditEvents.length).toBeLessThanOrEqual(5);
  });

  it('dynamically updates metrics when an asset status is mutated without page reload', () => {
    // Take a cloned copy
    const assets: Asset[] = JSON.parse(JSON.stringify(INITIAL_ASSETS));
    const initialMetrics = getDashboardMetrics(assets, INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS, []);

    // Change one In-Stock laptop to In-Use
    const laptopInStock = assets.find(a => a.category === 'Laptop' && a.status === 'In Stock');
    expect(laptopInStock).toBeDefined();

    if (laptopInStock) {
      laptopInStock.status = 'In Use';
      laptopInStock.assignedTo = {
        name: 'Test Engineer',
        email: 'test@company.internal',
        department: 'DevOps',
        assignedDate: '2026-04-01',
        role: 'Hardware Custodian'
      };
    }

    const updatedMetrics = getDashboardMetrics(assets, INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS, []);

    expect(updatedMetrics.laptops.available).toBe(initialMetrics.laptops.available - 1);
    expect(updatedMetrics.laptops.assigned).toBe(initialMetrics.laptops.assigned + 1);
    expect(updatedMetrics.laptops.total).toBe(initialMetrics.laptops.total);
  });

  it('calculates low stock buffer quotas using INVENTORY_THRESHOLDS consistently', () => {
    const assessments = getCategoryStockAssessments(INITIAL_ASSETS, INVENTORY_THRESHOLDS);
    expect(assessments.length).toBe(INVENTORY_THRESHOLDS.length);

    assessments.forEach(item => {
      const matchingThreshold = INVENTORY_THRESHOLDS.find(t => t.category === item.category);
      expect(matchingThreshold).toBeDefined();
      expect(item.minQuantity).toBe(matchingThreshold!.minQuantity);
      expect(item.isLowStock).toBe(item.inStock < item.minQuantity);
    });
  });
});
