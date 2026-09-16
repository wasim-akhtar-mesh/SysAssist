import { describe, it, expect } from 'vitest';
import { getCategorySpecs, getCategorySpecsSummary } from '../utils/categorySpecs';
import { Asset, HardwareSpecs } from '../types';

describe('Category-Aware Hardware Specifications', () => {
  it('renders Laptop specs with processor, RAM, and storage tier', () => {
    const specs: HardwareSpecs = {
      processor: 'Apple M3 Pro (12-core CPU, 18-core GPU)',
      ram: '36GB Unified Memory',
      storage: '1TB NVMe PCIe Gen4 SSD',
      display: '16.2" Liquid Retina XDR (3456x2234)',
      graphics: '18-Core Integrated Neural/Metal GPU'
    };

    const result = getCategorySpecs('Laptop', specs);
    expect(result.some(s => s.label === 'Processor' && s.value.includes('M3 Pro'))).toBe(true);
    expect(result.some(s => s.label === 'RAM' && s.value.includes('36GB'))).toBe(true);
    expect(result.some(s => s.label === 'Storage' && s.value.includes('1TB'))).toBe(true);

    const summary = getCategorySpecsSummary({
      category: 'Laptop',
      specs
    } as Asset);
    expect(summary).toContain('Apple M3 Pro');
    expect(summary).toContain('36GB');
  });

  it('renders Display specs without misleading CPU or RAM labels', () => {
    const specs: HardwareSpecs = {
      screenSize: '27"',
      resolution: '5K Retina (5120x2880)',
      connectionPorts: '1x Thunderbolt 3, 3x USB-C (10Gbps)',
      refreshRate: '60Hz True Tone P3 Wide Color'
    };

    const result = getCategorySpecs('Display', specs);
    const labels = result.map(s => s.label);
    expect(labels).not.toContain('Processor');
    expect(labels).not.toContain('RAM');
    expect(labels).not.toContain('Storage');

    expect(result.some(s => s.label === 'Size & Resolution' && s.value.includes('5K Retina'))).toBe(true);
    expect(result.some(s => s.label === 'Connection' && s.value.includes('Thunderbolt 3'))).toBe(true);
    expect(result.some(s => s.label === 'Refresh Rate' && s.value.includes('60Hz'))).toBe(true);

    const summary = getCategorySpecsSummary({
      category: 'Display',
      specs
    } as Asset);
    expect(summary).toContain('5K Retina');
  });

  it('renders Dock specs with ports, standard, and power delivery', () => {
    const specs: HardwareSpecs = {
      ports: '3x TB4, 5x USB-A, 3x USB-C, 2.5GbE, DisplayPort 1.4, UHS-II SD',
      connectionStandard: 'Thunderbolt 4 / USB4 (40Gbps)',
      powerDelivery: '98W Host Fast Charging'
    };

    const result = getCategorySpecs('Dock', specs);
    const labels = result.map(s => s.label);
    expect(labels).not.toContain('Processor');
    expect(labels).not.toContain('RAM');

    expect(result.some(s => s.label === 'Connection Standard' && s.value.includes('Thunderbolt 4'))).toBe(true);
    expect(result.some(s => s.label === 'Power Delivery' && s.value.includes('98W'))).toBe(true);
    expect(result.some(s => s.label === 'I/O Ports' && s.value.includes('3x TB4'))).toBe(true);
  });

  it('renders Keyboard specs with layout, switch type, and connectivity', () => {
    const specs: HardwareSpecs = {
      keyboardLayout: 'ANSI US 75% Compact',
      switchType: 'Gateron Oil King Linear (Factory Lubed)',
      connectivity: 'Tri-Mode: 2.4GHz Wireless, Bluetooth 5.1, USB-C'
    };

    const result = getCategorySpecs('Keyboard', specs);
    expect(result.some(s => s.label === 'Layout' && s.value.includes('ANSI US'))).toBe(true);
    expect(result.some(s => s.label === 'Switches & Connectivity' && s.value.includes('Gateron'))).toBe(true);
  });

  it('renders Mouse specs with sensor DPI and connectivity', () => {
    const specs: HardwareSpecs = {
      sensorType: 'Darkfield Optical',
      dpi: '8,000 DPI',
      connectivity: 'Logi Bolt Wireless & Bluetooth Low Energy (3 Channels)'
    };

    const result = getCategorySpecs('Mouse', specs);
    expect(result.some(s => s.label === 'Sensor & DPI' && s.value.includes('8,000 DPI'))).toBe(true);
    expect(result.some(s => s.label === 'Connectivity' && s.value.includes('Logi Bolt'))).toBe(true);
  });

  it('renders Audio/Headset specs with audio and battery details', () => {
    const specs: HardwareSpecs = {
      audioFeatures: 'Acoustic Fence Noise-Canceling Dual-Mic, Active Noise Canceling',
      batteryLife: 'Up to 25 hours continuous talk-time',
      connectivity: 'BT700 USB-C Bluetooth Adapter & Native BT 5.2'
    };

    const result = getCategorySpecs('Audio/Headset', specs);
    expect(result.some(s => s.label === 'Audio & Battery' && s.value.includes('Acoustic Fence'))).toBe(true);
    expect(result.some(s => s.label === 'Connectivity' && s.value.includes('BT700'))).toBe(true);
  });

  it('gracefully falls back when structured specs are missing or empty', () => {
    const emptySpecs: HardwareSpecs = {
      processor: '',
      ram: '',
      storage: '',
      display: '',
      graphics: ''
    };

    const fallbackLaptop = getCategorySpecs('Laptop', emptySpecs);
    expect(fallbackLaptop.length).toBeGreaterThan(0);
    expect(fallbackLaptop[0].value).toBe('Enterprise Laptop Configuration');

    const fallbackDisplay = getCategorySpecs('Display', emptySpecs);
    expect(fallbackDisplay.length).toBeGreaterThan(0);
    expect(fallbackDisplay[0].value).toBe('4K Ultra-HD Enterprise Display');

    const summary = getCategorySpecsSummary({
      category: 'Dock',
      specs: emptySpecs
    } as Asset);
    expect(summary).toBe('Thunderbolt Docking Station');
  });
});
