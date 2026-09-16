import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddAssetModal } from '../components/AddAssetModal';
import { Asset } from '../types';

describe('AddAssetModal Intake Lifecycle', () => {
  const mockCurrentUser = 'Wasim Akhtar (IT Lead)';
  const mockExistingAssets: Asset[] = [];

  it('performs normal intake without initialBarcode and resets upon cancel', () => {
    const handleClose = vi.fn();
    const handleAddAsset = vi.fn();

    const { rerender } = render(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    // Initial barcode is generated automatically
    const barcodeInput = screen.getByLabelText(/Barcode \(Code 128\)/i) as HTMLInputElement;
    expect(barcodeInput.value).toMatch(/^\d{10,12}$/);

    // Fill in required fields
    const nameInput = screen.getByLabelText(/Equipment Name/i);
    fireEvent.change(nameInput, { target: { value: 'Dell Latitude 7440' } });

    const serialInput = screen.getByLabelText(/Serial Number & GSX Validation/i);
    fireEvent.change(serialInput, { target: { value: 'SN-TEST-1234' } });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);
    expect(handleClose).toHaveBeenCalledTimes(1);

    // Reopen modal and verify fields were reset
    rerender(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    const nameInputAfterReopen = screen.getByLabelText(/Equipment Name/i) as HTMLInputElement;
    expect(nameInputAfterReopen.value).toBe('');
  });

  it('applies initialBarcode once upon open and allows manual editing without reverting', () => {
    const handleClose = vi.fn();
    const handleAddAsset = vi.fn();

    const { rerender } = render(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        initialBarcode="SCANNED-BAR-888"
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    const barcodeInput = screen.getByLabelText(/Barcode \(Code 128\)/i) as HTMLInputElement;
    expect(barcodeInput.value).toBe('SCANNED-BAR-888');

    // Manually edit the barcode
    fireEvent.change(barcodeInput, { target: { value: 'SCANNED-BAR-888-EDITED' } });
    expect(barcodeInput.value).toBe('SCANNED-BAR-888-EDITED');

    // Trigger re-render of parent with the same props (e.g. state change elsewhere)
    rerender(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        initialBarcode="SCANNED-BAR-888"
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    // Must NOT revert back to SCANNED-BAR-888
    const barcodeInputAfterRerender = screen.getByLabelText(/Barcode \(Code 128\)/i) as HTMLInputElement;
    expect(barcodeInputAfterRerender.value).toBe('SCANNED-BAR-888-EDITED');
  });

  it('switches specification inputs dynamically based on selected Category', () => {
    const handleClose = vi.fn();
    const handleAddAsset = vi.fn();

    render(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    // Default category is Laptop: CPU field exists
    expect(screen.getByLabelText(/CPU \/ Processor/i)).toBeTruthy();

    // Switch category to Display
    const categorySelect = screen.getByLabelText(/Category/i);
    fireEvent.change(categorySelect, { target: { value: 'Display' } });

    // CPU input is gone; Size & Resolution is present
    expect(screen.queryByLabelText(/CPU \/ Processor/i)).toBeNull();
    expect(screen.getByLabelText(/Size & Resolution/i)).toBeTruthy();
    expect(screen.getByLabelText(/Connection Ports/i)).toBeTruthy();

    // Switch category to Dock
    fireEvent.change(categorySelect, { target: { value: 'Dock' } });
    expect(screen.getByLabelText(/Connection Standard/i)).toBeTruthy();
    expect(screen.getByLabelText(/I\/O Ports/i)).toBeTruthy();

    // Switch category to Keyboard
    fireEvent.change(categorySelect, { target: { value: 'Keyboard' } });
    expect(screen.getByLabelText(/Keyboard Layout/i)).toBeTruthy();
    expect(screen.getByLabelText(/Switch Type/i)).toBeTruthy();
  });

  it('submits form with valid data and calls onAddAsset', () => {
    const handleClose = vi.fn();
    const handleAddAsset = vi.fn();

    render(
      <AddAssetModal
        isOpen={true}
        onClose={handleClose}
        onAddAsset={handleAddAsset}
        currentUser={mockCurrentUser}
        existingAssets={mockExistingAssets}
      />
    );

    fireEvent.change(screen.getByLabelText(/Equipment Name/i), {
      target: { value: 'ThinkPad X1 Carbon Gen 11' }
    });
    fireEvent.change(screen.getByLabelText(/Manufacturer/i), {
      target: { value: 'Lenovo' }
    });
    fireEvent.change(screen.getByLabelText(/Model Code/i), {
      target: { value: 'X1 Carbon Gen 11' }
    });
    fireEvent.change(screen.getByLabelText(/Serial Number & GSX Validation/i), {
      target: { value: 'PF-4982K3' }
    });

    const form = screen.getByRole('dialog').querySelector('form')!;
    fireEvent.submit(form);

    expect(handleAddAsset).toHaveBeenCalledTimes(1);
    const [addedAsset, log] = handleAddAsset.mock.calls[0];
    expect(addedAsset.name).toBe('ThinkPad X1 Carbon Gen 11');
    expect(addedAsset.serialNumber).toBe('PF-4982K3');
    expect(addedAsset.assetTag).toMatch(/^AST-\d+$/);
    expect(log.action).toBe('CREATED');
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
