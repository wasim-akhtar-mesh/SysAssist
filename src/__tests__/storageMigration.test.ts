import { describe, it, expect, beforeEach } from 'vitest';
import { 
  runSystemAssistStorageMigration, 
  STORAGE_KEYS, 
  getMigratedStorageItem, 
  setMigratedStorageItem 
} from '../utils/storageMigration';

describe('System Assist Storage Key Migration & Backward Compatibility', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('migrates legacy sysassist_* keys to system_assist_* on initialization', () => {
    const legacyAssets = [{ id: 'test-1', assetTag: 'AST-TEST-001', model: 'ThinkPad' }];
    const legacyJira = [{ key: 'HW-01', summary: 'Restock dock' }];
    
    localStorage.setItem('sysassist_assets', JSON.stringify(legacyAssets));
    localStorage.setItem('sysassist_jira', JSON.stringify(legacyJira));

    expect(localStorage.getItem('system_assist_assets')).toBeNull();
    expect(localStorage.getItem('system_assist_jira')).toBeNull();

    runSystemAssistStorageMigration();

    // Now verified migrated to new keys
    expect(localStorage.getItem('system_assist_assets')).toBe(JSON.stringify(legacyAssets));
    expect(localStorage.getItem('system_assist_jira')).toBe(JSON.stringify(legacyJira));

    // Legacy keys retained for fallback compatibility
    expect(localStorage.getItem('sysassist_assets')).toBe(JSON.stringify(legacyAssets));
  });

  it('getMigratedStorageItem prioritizes new key but seamlessly falls back to legacy', () => {
    const legacyLogs = [{ id: 'log-1', assetTag: 'AST-999', actionType: 'Status Change' }];
    localStorage.setItem('sysassist_logs', JSON.stringify(legacyLogs));

    const result = getMigratedStorageItem(STORAGE_KEYS.LOGS, []);
    expect(result).toEqual(legacyLogs);
    // Verified that it copied to new key
    expect(localStorage.getItem('system_assist_logs')).toBe(JSON.stringify(legacyLogs));
  });

  it('setMigratedStorageItem writes to new key and keeps legacy key synchronized', () => {
    const newAssets = [{ id: 'test-2', assetTag: 'AST-TEST-002', model: 'MacBook Pro' }];
    setMigratedStorageItem(STORAGE_KEYS.ASSETS, newAssets);

    expect(JSON.parse(localStorage.getItem('system_assist_assets') || '[]')).toEqual(newAssets);
    expect(JSON.parse(localStorage.getItem('sysassist_assets') || '[]')).toEqual(newAssets);
  });
});
