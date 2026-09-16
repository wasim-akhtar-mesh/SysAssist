import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JiraTicketingDrawer } from '../components/JiraTicketingDrawer';
import { JiraTicket, Asset, ChangeLogEntry } from '../types';

describe('Jira Service Management Equipment-Aware Fulfillment', () => {
  const mockCurrentUser = 'Wasim Akhtar (IT Lead)';

  const sampleLaptopStock: Asset = {
    id: 'asset-laptop-1',
    assetTag: 'AST-1001',
    serialNumber: 'SN-LAP-1001',
    barcode: 'BAR-1001',
    name: 'MacBook Pro 16"',
    manufacturer: 'Apple',
    model: 'MacBook Pro 16, M3 Pro',
    category: 'Laptop',
    status: 'In Stock',
    assignedTo: null,
    location: 'Depot Shelf A-1',
    purchaseDate: '2026-01-15',
    purchasePrice: 2499,
    supplier: 'Apple Direct',
    warrantyExpiry: '2029-01-15',
    specs: {
      processor: 'Apple M3 Pro',
      ram: '36GB',
      storage: '1TB'
    },
    changeLogs: []
  };

  const sampleDisplayStock: Asset = {
    id: 'asset-display-1',
    assetTag: 'AST-2001',
    serialNumber: 'SN-DISP-2001',
    barcode: 'BAR-2001',
    name: 'Apple Studio Display 27"',
    manufacturer: 'Apple',
    model: 'Studio Display',
    category: 'Display',
    status: 'In Stock',
    assignedTo: null,
    location: 'Depot Shelf B-2',
    purchaseDate: '2026-02-01',
    purchasePrice: 1599,
    supplier: 'Apple Direct',
    warrantyExpiry: '2029-02-01',
    specs: {
      screenSize: '27" 5K',
      connectionPorts: 'Thunderbolt 3'
    },
    changeLogs: []
  };

  const openLaptopTicket: JiraTicket = {
    id: 'jira-1',
    key: 'SYS-101',
    summary: 'Developer Laptop Provisioning',
    description: 'New hire dev machine needed',
    status: 'Open',
    priority: 'High',
    createdDate: '2026-04-10',
    requester: {
      name: 'Sarah Connor',
      email: 'sarah.c@company.internal',
      department: 'Infrastructure'
    },
    requestedHardware: 'MacBook Pro 16" (M3 Pro, 36GB, 1TB)',
    requestedCategory: 'Laptop'
  };

  const fulfilledTicket: JiraTicket = {
    id: 'jira-2',
    key: 'SYS-102',
    summary: 'Designer Display Request',
    description: 'Studio display for graphic design',
    status: 'Fulfilled',
    priority: 'Medium',
    createdDate: '2026-04-09',
    fulfilledAssetTag: 'AST-2001',
    requester: {
      name: 'Miles Dyson',
      email: 'miles.d@company.internal',
      department: 'Design'
    },
    requestedHardware: 'Apple Studio Display 27"',
    requestedCategory: 'Display'
  };

  const closedTicket: JiraTicket = {
    id: 'jira-3',
    key: 'SYS-103',
    summary: 'Old Dock Request',
    description: 'Cancelled order',
    status: 'Closed',
    priority: 'Low',
    createdDate: '2026-04-08',
    requester: {
      name: 'John Connor',
      email: 'john.c@company.internal',
      department: 'Operations'
    },
    requestedHardware: 'CalDigit TS4 Dock',
    requestedCategory: 'Dock'
  };

  it('allows compatible hardware fulfillment without needing an override', () => {
    const handleFulfill = vi.fn();
    const handleCreate = vi.fn();

    render(
      <JiraTicketingDrawer
        tickets={[openLaptopTicket]}
        assets={[sampleLaptopStock, sampleDisplayStock]}
        onFulfillTicket={handleFulfill}
        onCreateTicket={handleCreate}
        currentUser={mockCurrentUser}
      />
    );

    // Click fulfill button on the open ticket
    const fulfillButton = screen.getByRole('button', { name: /Fulfill Hardware/i });
    fireEvent.click(fulfillButton);

    // Modal opens. Select compatible laptop
    const select = screen.getByLabelText(/Select depot asset for fulfillment/i);
    fireEvent.change(select, { target: { value: sampleLaptopStock.id } });

    // Category Matched notice is displayed
    expect(screen.getByText(/Category Matched: Laptop/i)).toBeTruthy();

    // Confirm button is enabled
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Fulfill Ticket/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(confirmBtn);
    expect(handleFulfill).toHaveBeenCalledTimes(1);
    expect(handleFulfill).toHaveBeenCalledWith('SYS-101', sampleLaptopStock.id, expect.any(Object));
  });

  it('blocks incompatible fulfillment until operator explicitly confirms compatibility override', () => {
    const handleFulfill = vi.fn();
    const handleCreate = vi.fn();

    render(
      <JiraTicketingDrawer
        tickets={[openLaptopTicket]}
        assets={[sampleLaptopStock, sampleDisplayStock]}
        onFulfillTicket={handleFulfill}
        onCreateTicket={handleCreate}
        currentUser={mockCurrentUser}
      />
    );

    const fulfillButton = screen.getByRole('button', { name: /Fulfill Hardware/i });
    fireEvent.click(fulfillButton);

    // Select incompatible display for a laptop ticket
    const select = screen.getByLabelText(/Select depot asset for fulfillment/i);
    fireEvent.change(select, { target: { value: sampleDisplayStock.id } });

    // Category mismatch warning is displayed
    expect(screen.getByText(/Hardware Category Mismatch/i)).toBeTruthy();

    // Confirm button MUST be disabled
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Fulfill Ticket/i });
    expect(confirmBtn.hasAttribute('disabled')).toBe(true);

    // Check override confirmation checkbox
    const overrideCheckbox = screen.getByLabelText(/Confirm equipment compatibility override/i);
    fireEvent.click(overrideCheckbox);

    // Confirm button is now enabled
    expect(confirmBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(confirmBtn);
    expect(handleFulfill).toHaveBeenCalledTimes(1);
    const [ticketKey, assetId, log] = handleFulfill.mock.calls[0];
    expect(ticketKey).toBe('SYS-101');
    expect(assetId).toBe(sampleDisplayStock.id);
    expect(log.reason).toContain('COMPATIBILITY OVERRIDE');
  });

  it('prevents fulfillment of Fulfilled or Closed tickets', () => {
    const handleFulfill = vi.fn();
    const handleCreate = vi.fn();

    const { rerender } = render(
      <JiraTicketingDrawer
        tickets={[fulfilledTicket]}
        assets={[sampleLaptopStock]}
        onFulfillTicket={handleFulfill}
        onCreateTicket={handleCreate}
        currentUser={mockCurrentUser}
      />
    );

    // Fulfilled ticket does not show "Fulfill Hardware" button
    expect(screen.queryByRole('button', { name: /Fulfill Hardware/i })).toBeNull();
    expect(screen.getByText(/Fulfillment Completed/i)).toBeTruthy();

    // Re-render with closed ticket
    rerender(
      <JiraTicketingDrawer
        tickets={[closedTicket]}
        assets={[sampleLaptopStock]}
        onFulfillTicket={handleFulfill}
        onCreateTicket={handleCreate}
        currentUser={mockCurrentUser}
      />
    );

    expect(screen.queryByRole('button', { name: /Fulfill Hardware/i })).toBeNull();
    expect(screen.getByText(/marked Closed/i)).toBeTruthy();
  });

  it('handles unavailable depot hardware gracefully when stock is empty', () => {
    const handleFulfill = vi.fn();
    const handleCreate = vi.fn();

    render(
      <JiraTicketingDrawer
        tickets={[openLaptopTicket]}
        assets={[]} // zero stock assets
        onFulfillTicket={handleFulfill}
        onCreateTicket={handleCreate}
        currentUser={mockCurrentUser}
      />
    );

    const fulfillButton = screen.getByRole('button', { name: /Fulfill Hardware/i });
    fireEvent.click(fulfillButton);

    expect(screen.getByText(/Depot Hardware Unavailable/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Confirm & Fulfill Ticket/i })).toBeNull();
  });
});
