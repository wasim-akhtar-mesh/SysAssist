import { Asset, AssetCategory, HardwareSpecs } from '../types';

export interface SpecItem {
  label: string;
  value: string;
  iconType?: 'cpu' | 'ram' | 'storage' | 'display' | 'dock' | 'keyboard' | 'mouse' | 'audio' | 'general';
}

/**
 * Returns a list of category-specific specification attributes with accurate labels.
 * Ensures peripheral values are NEVER labeled as CPU, RAM, or Storage.
 */
export function getCategorySpecs(category: AssetCategory, specs?: Partial<HardwareSpecs>): SpecItem[] {
  if (!specs) {
    return [{ label: 'Specification', value: 'Standard Enterprise Specification', iconType: 'general' }];
  }

  const items: SpecItem[] = [];

  switch (category) {
    case 'Laptop': {
      if (specs.processor) {
        items.push({ label: 'Processor', value: specs.processor, iconType: 'cpu' });
      }
      if (specs.ram) {
        items.push({ label: 'RAM', value: specs.ram, iconType: 'ram' });
      }
      if (specs.storage) {
        items.push({ label: 'Storage', value: specs.storage, iconType: 'storage' });
      }
      if (specs.display) {
        items.push({ label: 'Display Panel', value: specs.display, iconType: 'display' });
      }
      if (specs.graphics) {
        items.push({ label: 'Graphics', value: specs.graphics, iconType: 'general' });
      }
      if (items.length === 0) {
        items.push({ label: 'Computing Spec', value: specs.generalSpecs || 'Enterprise Laptop Configuration', iconType: 'cpu' });
      }
      break;
    }

    case 'Display': {
      const sizeOrRes = [specs.screenSize, specs.resolution].filter(Boolean).join(' • ');
      if (sizeOrRes) {
        items.push({ label: 'Size & Resolution', value: sizeOrRes, iconType: 'display' });
      } else if (specs.display) {
        items.push({ label: 'Display Panel', value: specs.display, iconType: 'display' });
      }
      if (specs.connectionPorts) {
        items.push({ label: 'Connection', value: specs.connectionPorts, iconType: 'dock' });
      }
      if (specs.refreshRate) {
        items.push({ label: 'Refresh Rate', value: specs.refreshRate, iconType: 'display' });
      }
      if (items.length === 0) {
        items.push({ label: 'Display Spec', value: specs.generalSpecs || '4K Ultra-HD Enterprise Display', iconType: 'display' });
      }
      break;
    }

    case 'Dock': {
      if (specs.connectionStandard) {
        items.push({ label: 'Connection Standard', value: specs.connectionStandard, iconType: 'dock' });
      }
      if (specs.ports) {
        items.push({ label: 'I/O Ports', value: specs.ports, iconType: 'dock' });
      }
      if (specs.powerDelivery) {
        items.push({ label: 'Power Delivery', value: specs.powerDelivery, iconType: 'general' });
      }
      if (items.length === 0) {
        items.push({ label: 'Docking Spec', value: specs.generalSpecs || 'Thunderbolt / USB-C Docking Station', iconType: 'dock' });
      }
      break;
    }

    case 'Keyboard': {
      if (specs.keyboardLayout) {
        items.push({ label: 'Layout', value: specs.keyboardLayout, iconType: 'keyboard' });
      }
      if (specs.switchType || specs.connectivity) {
        const switchConn = [specs.switchType, specs.connectivity].filter(Boolean).join(' • ');
        items.push({ label: 'Switches & Connectivity', value: switchConn, iconType: 'keyboard' });
      }
      if (items.length === 0) {
        items.push({ label: 'Keyboard Spec', value: specs.generalSpecs || 'Standard ANSI Layout Keyboard', iconType: 'keyboard' });
      }
      break;
    }

    case 'Mouse': {
      if (specs.connectivity) {
        items.push({ label: 'Connectivity', value: specs.connectivity, iconType: 'mouse' });
      }
      if (specs.sensorType || specs.dpi) {
        const sensorDpi = [specs.sensorType, specs.dpi].filter(Boolean).join(' • ');
        items.push({ label: 'Sensor & DPI', value: sensorDpi, iconType: 'mouse' });
      }
      if (items.length === 0) {
        items.push({ label: 'Pointer Spec', value: specs.generalSpecs || 'Ergonomic Precision Mouse', iconType: 'mouse' });
      }
      break;
    }

    case 'Audio/Headset': {
      if (specs.connectivity) {
        items.push({ label: 'Connectivity', value: specs.connectivity, iconType: 'audio' });
      }
      if (specs.batteryLife || specs.audioFeatures) {
        const audioBat = [specs.audioFeatures, specs.batteryLife].filter(Boolean).join(' • ');
        items.push({ label: 'Audio & Battery', value: audioBat, iconType: 'audio' });
      }
      if (items.length === 0) {
        items.push({ label: 'Acoustic Spec', value: specs.generalSpecs || 'Active Noise-Cancelling Audio Headset', iconType: 'audio' });
      }
      break;
    }

    case 'Other':
    default: {
      if (specs.generalSpecs) {
        items.push({ label: 'Metadata', value: specs.generalSpecs, iconType: 'general' });
      } else {
        const summary = [specs.connectionStandard, specs.ports, specs.connectivity].filter(Boolean).join(' • ');
        items.push({
          label: 'Metadata',
          value: summary || 'Enterprise Auxiliary Hardware',
          iconType: 'general'
        });
      }
      break;
    }
  }

  return items;
}

/**
 * Returns a compact one-liner summary string for tables and cards, honoring category boundaries.
 */
export function getCategorySpecsSummary(asset: Pick<Asset, 'category' | 'specs'>): string {
  const specs = asset.specs || {};

  switch (asset.category) {
    case 'Laptop': {
      const parts = [specs.processor, specs.ram, specs.storage].filter(Boolean);
      return parts.length > 0 ? parts.join(' | ') : 'Enterprise Laptop Configuration';
    }
    case 'Display': {
      const parts = [
        specs.screenSize || specs.resolution ? [specs.screenSize, specs.resolution].filter(Boolean).join(' ') : specs.display,
        specs.refreshRate,
        specs.connectionPorts
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : '4K Ultra-HD Display';
    }
    case 'Dock': {
      const parts = [specs.connectionStandard, specs.ports, specs.powerDelivery].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : 'Thunderbolt Docking Station';
    }
    case 'Keyboard': {
      const parts = [specs.keyboardLayout, specs.switchType, specs.connectivity].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : 'ANSI Layout Keyboard';
    }
    case 'Mouse': {
      const parts = [specs.connectivity, specs.sensorType, specs.dpi].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : 'Precision Wireless Mouse';
    }
    case 'Audio/Headset': {
      const parts = [specs.audioFeatures, specs.connectivity, specs.batteryLife].filter(Boolean);
      return parts.length > 0 ? parts.join(' • ') : 'Noise Cancelling Headset';
    }
    case 'Other':
    default: {
      return specs.generalSpecs || 'Enterprise Hardware Asset';
    }
  }
}
