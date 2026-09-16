import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from '../components/DashboardView';
import { INITIAL_ASSETS, INITIAL_CHANGE_LOGS } from '../data/mockAssets';
import { INITIAL_JIRA_TICKETS, INVENTORY_THRESHOLDS } from '../data/mockJira';

describe('DashboardView Accessibility & Navigation', () => {
  it('uses semantic button elements with accessible labels for laptop metrics', () => {
    const handleLaptops = vi.fn();
    const handlePeripherals = vi.fn();
    const handleStock = vi.fn();
    const handleJira = vi.fn();
    const handleAudit = vi.fn();
    const handleSelectTag = vi.fn();
    const handleScan = vi.fn();
    const handleAdd = vi.fn();

    render(
      <DashboardView
        assets={INITIAL_ASSETS}
        jiraTickets={INITIAL_JIRA_TICKETS}
        changeLogs={INITIAL_CHANGE_LOGS}
        thresholds={INVENTORY_THRESHOLDS}
        onNavigateToLaptops={handleLaptops}
        onNavigateToPeripherals={handlePeripherals}
        onNavigateToStock={handleStock}
        onNavigateToJira={handleJira}
        onNavigateToAudit={handleAudit}
        onSelectAssetByTag={handleSelectTag}
        onOpenScanner={handleScan}
        onOpenAddAsset={handleAdd}
      />
    );

    // Available Laptops button
    const availableLaptopsBtn = screen.getByRole('button', { name: /available in-stock laptops/i });
    expect(availableLaptopsBtn.tagName.toLowerCase()).toBe('button');
    fireEvent.click(availableLaptopsBtn);
    expect(handleLaptops).toHaveBeenCalledWith('In Stock');

    // Assigned Laptops button
    const assignedLaptopsBtn = screen.getByRole('button', { name: /assigned deployed laptops/i });
    expect(assignedLaptopsBtn.tagName.toLowerCase()).toBe('button');
    fireEvent.click(assignedLaptopsBtn);
    expect(handleLaptops).toHaveBeenCalledWith('In Use');

    // Total Laptops button
    const totalLaptopsBtn = screen.getByRole('button', { name: /view all \d+ laptops/i });
    expect(totalLaptopsBtn.tagName.toLowerCase()).toBe('button');
    fireEvent.click(totalLaptopsBtn);
    expect(handleLaptops).toHaveBeenCalledWith('ALL');
  });

  it('uses semantic button elements for peripheral categories', () => {
    const handlePeripherals = vi.fn();

    render(
      <DashboardView
        assets={INITIAL_ASSETS}
        jiraTickets={INITIAL_JIRA_TICKETS}
        changeLogs={INITIAL_CHANGE_LOGS}
        thresholds={INVENTORY_THRESHOLDS}
        onNavigateToLaptops={vi.fn()}
        onNavigateToPeripherals={handlePeripherals}
        onNavigateToStock={vi.fn()}
        onNavigateToJira={vi.fn()}
        onNavigateToAudit={vi.fn()}
        onSelectAssetByTag={vi.fn()}
        onOpenScanner={vi.fn()}
        onOpenAddAsset={vi.fn()}
      />
    );

    // Filter to Display
    const displayCard = screen.getByRole('button', { name: /filter peripherals to display/i });
    expect(displayCard.tagName.toLowerCase()).toBe('button');
    fireEvent.click(displayCard);
    expect(handlePeripherals).toHaveBeenCalledWith('Display');

    // Filter to Dock
    const dockCard = screen.getByRole('button', { name: /filter peripherals to dock/i });
    expect(dockCard.tagName.toLowerCase()).toBe('button');
    fireEvent.click(dockCard);
    expect(handlePeripherals).toHaveBeenCalledWith('Dock');
  });

  it('navigates to Jira and Buffer Quota panels with accessible buttons', () => {
    const handleStock = vi.fn();
    const handleJira = vi.fn();

    render(
      <DashboardView
        assets={INITIAL_ASSETS}
        jiraTickets={INITIAL_JIRA_TICKETS}
        changeLogs={INITIAL_CHANGE_LOGS}
        thresholds={INVENTORY_THRESHOLDS}
        onNavigateToLaptops={vi.fn()}
        onNavigateToPeripherals={vi.fn()}
        onNavigateToStock={handleStock}
        onNavigateToJira={handleJira}
        onNavigateToAudit={vi.fn()}
        onSelectAssetByTag={vi.fn()}
        onOpenScanner={vi.fn()}
        onOpenAddAsset={vi.fn()}
      />
    );

    const jiraBtn = screen.getByRole('button', { name: /open jira requests/i });
    expect(jiraBtn.tagName.toLowerCase()).toBe('button');
    fireEvent.click(jiraBtn);
    expect(handleJira).toHaveBeenCalledTimes(1);

    const stockBtn = screen.getByRole('button', { name: /view buffer quota status/i });
    expect(stockBtn.tagName.toLowerCase()).toBe('button');
    fireEvent.click(stockBtn);
    expect(handleStock).toHaveBeenCalledTimes(1);
  });

  it('supports Enter and Space key activation for recent audit event rows', () => {
    const handleSelectTag = vi.fn();

    render(
      <DashboardView
        assets={INITIAL_ASSETS}
        jiraTickets={INITIAL_JIRA_TICKETS}
        changeLogs={INITIAL_CHANGE_LOGS}
        thresholds={INVENTORY_THRESHOLDS}
        onNavigateToLaptops={vi.fn()}
        onNavigateToPeripherals={vi.fn()}
        onNavigateToStock={vi.fn()}
        onNavigateToJira={vi.fn()}
        onNavigateToAudit={vi.fn()}
        onSelectAssetByTag={handleSelectTag}
        onOpenScanner={vi.fn()}
        onOpenAddAsset={vi.fn()}
      />
    );

    const auditRows = screen.getAllByRole('button', { name: /audit event:/i });
    expect(auditRows.length).toBeGreaterThan(0);

    // Enter key
    fireEvent.keyDown(auditRows[0], { key: 'Enter', code: 'Enter' });
    expect(handleSelectTag).toHaveBeenCalledTimes(1);

    // Space key
    fireEvent.keyDown(auditRows[0], { key: ' ', code: 'Space' });
    expect(handleSelectTag).toHaveBeenCalledTimes(2);
  });
});
