import { AppleCoverage, HardwareSpecs } from '../types';

export interface AppleLookupResult {
  success: boolean;
  modelName: string;
  specs: HardwareSpecs;
  coverage: AppleCoverage;
  source: 'Apple GSX / CheckCoverage API';
}

// Database of known Apple serial profiles and specs for realistic retrieval
const APPLE_SERIAL_DB: Record<string, {
  modelName: string;
  specs: HardwareSpecs;
  purchaseDate: string;
  warrantyStatus: 'Active AppleCare+' | 'Limited Warranty' | 'Expired' | 'Out of Warranty';
  coverageEndDate: string;
  agreementNumber: string;
  appleCareEligible: boolean;
  hardwareCoverage: 'Covered' | 'Expired' | 'Pending Review';
  techSupportCoverage: 'Active' | 'Expired';
}> = {
  'C02G4190MD6R': {
    modelName: 'MacBook Pro (16-inch, Nov 2023, M3 Max)',
    specs: {
      processor: 'Apple M3 Max (16-core CPU, 40-core GPU, 16-core Neural Engine)',
      ram: '64 GB Unified Memory (300 GB/s bandwidth)',
      storage: '2 TB NVMe Solid State Drive (Apple APFS)',
      display: '16.2-inch Liquid Retina XDR (3456x2234 at 254 ppi, ProMotion 120Hz, 1600 nits peak)',
      os: 'macOS Sequoia 15.1.1',
      batteryHealth: 98,
      batteryCycles: 42,
      graphics: 'Integrated 40-Core Apple GPU'
    },
    purchaseDate: '2024-01-18',
    warrantyStatus: 'Active AppleCare+',
    coverageEndDate: '2027-01-18',
    agreementNumber: 'AGR-ACPLUS-8492019',
    appleCareEligible: false,
    hardwareCoverage: 'Covered',
    techSupportCoverage: 'Active'
  },
  'FVFDQ07CQ05D': {
    modelName: 'MacBook Pro (14-inch, Nov 2023, M3 Pro)',
    specs: {
      processor: 'Apple M3 Pro (12-core CPU, 18-core GPU, 16-core Neural Engine)',
      ram: '36 GB Unified Memory (150 GB/s bandwidth)',
      storage: '1 TB NVMe Solid State Drive (Apple APFS)',
      display: '14.2-inch Liquid Retina XDR (3024x1964 at 254 ppi, ProMotion 120Hz)',
      os: 'macOS Sonoma 14.7',
      batteryHealth: 94,
      batteryCycles: 118,
      graphics: 'Integrated 18-Core Apple GPU'
    },
    purchaseDate: '2023-12-05',
    warrantyStatus: 'Active AppleCare+',
    coverageEndDate: '2026-12-05',
    agreementNumber: 'AGR-ACPLUS-7740192',
    appleCareEligible: false,
    hardwareCoverage: 'Covered',
    techSupportCoverage: 'Active'
  },
  'C02F908EMD6M': {
    modelName: 'MacBook Air (15-inch, M3, 2024)',
    specs: {
      processor: 'Apple M3 (8-core CPU, 10-core GPU)',
      ram: '16 GB Unified Memory',
      storage: '512 GB NVMe Solid State Drive',
      display: '15.3-inch Liquid Retina display (2880x1864, 500 nits)',
      os: 'macOS Sequoia 15.2',
      batteryHealth: 100,
      batteryCycles: 19,
      graphics: 'Integrated 10-Core Apple GPU'
    },
    purchaseDate: '2024-04-12',
    warrantyStatus: 'Limited Warranty',
    coverageEndDate: '2025-04-12',
    agreementNumber: 'LTD-US-2024-9912',
    appleCareEligible: true,
    hardwareCoverage: 'Covered',
    techSupportCoverage: 'Active'
  },
  'C02E8284MD6P': {
    modelName: 'MacBook Pro (16-inch, 2021, M1 Max)',
    specs: {
      processor: 'Apple M1 Max (10-core CPU, 32-core GPU)',
      ram: '32 GB Unified Memory',
      storage: '1 TB NVMe Solid State Drive',
      display: '16.2-inch Liquid Retina XDR',
      os: 'macOS Ventura 13.6.7',
      batteryHealth: 83,
      batteryCycles: 489,
      graphics: 'Integrated 32-Core Apple GPU'
    },
    purchaseDate: '2022-02-14',
    warrantyStatus: 'Expired',
    coverageEndDate: '2025-02-14',
    agreementNumber: 'AGR-EXPIRED-55019',
    appleCareEligible: false,
    hardwareCoverage: 'Expired',
    techSupportCoverage: 'Expired'
  }
};

export class AppleApiService {
  /**
   * Simulates calling the official Apple Coverage / GSX API for warranty and hardware specifications
   */
  static async fetchCoverageBySerial(serialNumber: string): Promise<AppleLookupResult> {
    // Artificial network roundtrip for realistic feedback
    await new Promise(resolve => setTimeout(resolve, 850));

    const cleanSerial = serialNumber.trim().toUpperCase();
    const existing = APPLE_SERIAL_DB[cleanSerial];

    if (existing) {
      return {
        success: true,
        modelName: existing.modelName,
        specs: existing.specs,
        coverage: {
          isAppleDevice: true,
          modelName: existing.modelName,
          serialNumber: cleanSerial,
          purchaseDate: existing.purchaseDate,
          warrantyStatus: existing.warrantyStatus,
          coverageEndDate: existing.coverageEndDate,
          agreementNumber: existing.agreementNumber,
          appleCareEligible: existing.appleCareEligible,
          hardwareCoverage: existing.hardwareCoverage,
          techSupportCoverage: existing.techSupportCoverage,
          lastSyncTimestamp: new Date().toISOString()
        },
        source: 'Apple GSX / CheckCoverage API'
      };
    }

    // Dynamic generation for any Apple serial number (standard format: alphanumeric 10-12 chars)
    const isLikelyApple = /^[A-Z0-9]{10,12}$/i.test(cleanSerial);
    const mockPurchaseDate = '2024-02-10';
    const mockEndDate = '2027-02-10';

    return {
      success: true,
      modelName: isLikelyApple ? 'MacBook Pro (Apple Silicon Enterprise Fleet)' : 'Apple Hardware Device',
      specs: {
        processor: 'Apple M3 Pro (12-core CPU, 18-core GPU)',
        ram: '36 GB Unified Memory (150 GB/s)',
        storage: '1 TB NVMe Ultra-Fast SSD',
        display: '14.2-inch Liquid Retina XDR (120Hz ProMotion)',
        os: 'macOS Sequoia 15.1',
        batteryHealth: 97,
        batteryCycles: 38,
        graphics: '18-core GPU'
      },
      coverage: {
        isAppleDevice: true,
        modelName: 'MacBook Pro 14" (Fleet Spec)',
        serialNumber: cleanSerial,
        purchaseDate: mockPurchaseDate,
        warrantyStatus: 'Active AppleCare+',
        coverageEndDate: mockEndDate,
        agreementNumber: `AGR-ENT-${cleanSerial.slice(0, 6)}`,
        appleCareEligible: false,
        hardwareCoverage: 'Covered',
        techSupportCoverage: 'Active',
        lastSyncTimestamp: new Date().toISOString()
      },
      source: 'Apple GSX / CheckCoverage API'
    };
  }
}
