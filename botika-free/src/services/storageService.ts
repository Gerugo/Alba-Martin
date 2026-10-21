import { GeneratedCatalogItem } from '../types/fashion';
import { BotikaFreeSettings, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_KEY = 'botika_free_settings_v1';
const CATALOG_KEY = 'botika_free_catalog_cache_v1';
const DB_NAME = 'botika_free_db';
const DB_STORE = 'catalog_items';

export function loadStoredSettings(): BotikaFreeSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: BotikaFreeSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSavedCatalogAsync(): Promise<GeneratedCatalogItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as GeneratedCatalogItem[]) || [];
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(items);
      };
      req.onerror = () => resolve(getCatalogSyncCache());
    });
  } catch {
    return getCatalogSyncCache();
  }
}

export function getCatalogSyncCache(): GeneratedCatalogItem[] {
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCatalogItem(item: GeneratedCatalogItem): Promise<GeneratedCatalogItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(item);
  } catch (e) {
    console.warn('Could not save to IndexedDB, fallback to localStorage cache', e);
  }

  const current = getCatalogSyncCache();
  const updated = [item, ...current.filter((x) => x.id !== item.id)];
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(updated.slice(0, 30)));
  } catch (err) {
    console.warn('LocalStorage limit reached for cache', err);
  }

  return updated;
}

export async function deleteCatalogItem(id: string): Promise<GeneratedCatalogItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).delete(id);
  } catch (e) {
    console.warn('Could not delete from IndexedDB', e);
  }

  const current = getCatalogSyncCache();
  const updated = current.filter((x) => x.id !== id);
  localStorage.setItem(CATALOG_KEY, JSON.stringify(updated));
  return updated;
}
