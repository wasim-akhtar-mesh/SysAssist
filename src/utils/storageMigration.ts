/**
 * System Assist - Local Storage Migration & Persistence Utility
 * 
 * Safely migrates legacy `sysassist_*` keys to `system_assist_*` on first boot,
 * ensuring all existing assets, Jira tickets, change logs, and configurations
 * survive intact with continuous backward compatibility.
 */

export const STORAGE_KEYS = {
  ASSETS: {
    NEW: 'system_assist_assets',
    LEGACY: 'sysassist_assets'
  },
  JIRA: {
    NEW: 'system_assist_jira',
    LEGACY: 'sysassist_jira'
  },
  LOGS: {
    NEW: 'system_assist_logs',
    LEGACY: 'sysassist_logs'
  },
  PROCUREMENT: {
    NEW: 'system_assist_procurement',
    LEGACY: 'sysassist_procurement'
  },
  ACTIVE_ROLE: {
    NEW: 'system_assist_active_role',
    LEGACY: 'sysassist_active_role'
  }
} as const;

/**
 * Reads a key with safe fallback from new to legacy storage keys.
 * If data is found under legacy key, it seamlessly copies it to the new key.
 */
export function getMigratedStorageItem<T>(keyConfig: { NEW: string; LEGACY: string }, defaultValue: T): T {
  try {
    // 1. Check new key first
    const newItem = localStorage.getItem(keyConfig.NEW);
    if (newItem) {
      return JSON.parse(newItem) as T;
    }

    // 2. Check legacy key if new key doesn't exist
    const legacyItem = localStorage.getItem(keyConfig.LEGACY);
    if (legacyItem) {
      const parsed = JSON.parse(legacyItem) as T;
      // Perform one-time migration copy
      localStorage.setItem(keyConfig.NEW, legacyItem);
      return parsed;
    }
  } catch (err) {
    console.warn(`[System Assist] Error reading storage for key ${keyConfig.NEW}:`, err);
  }

  return defaultValue;
}

/**
 * Saves item under the new key, and updates legacy key for backward compatibility.
 */
export function setMigratedStorageItem<T>(keyConfig: { NEW: string; LEGACY: string }, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(keyConfig.NEW, serialized);
    // Keep legacy synchronized so old references/tabs do not break
    localStorage.setItem(keyConfig.LEGACY, serialized);
  } catch (err) {
    console.warn(`[System Assist] Error writing storage for key ${keyConfig.NEW}:`, err);
  }
}

/**
 * Runs a global migration check on application mount.
 */
export function runSystemAssistStorageMigration(): { migratedCount: number; keysMigrated: string[] } {
  const keysMigrated: string[] = [];

  try {
    Object.values(STORAGE_KEYS).forEach(({ NEW, LEGACY }) => {
      const hasNew = localStorage.getItem(NEW);
      const hasLegacy = localStorage.getItem(LEGACY);

      if (!hasNew && hasLegacy) {
        localStorage.setItem(NEW, hasLegacy);
        keysMigrated.push(LEGACY);
      }
    });
  } catch (err) {
    console.warn('[System Assist] Error during storage migration check:', err);
  }

  return {
    migratedCount: keysMigrated.length,
    keysMigrated
  };
}
