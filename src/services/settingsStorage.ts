import { DemoSettings } from '../types/catalog';
import { getKeyvalFromDB, setKeyvalToDB, removeKeyvalFromDB } from './dbStorage';

const SETTINGS_STORAGE_KEY = 'demo_moda_settings_v1';
const SAVED_MODEL_STORAGE_KEY = 'demo_moda_saved_model_v1';

let cachedSavedModel: { dataUri: string; fileSizeBytes: number } | null = null;

export function getDefaultSettings(): DemoSettings {
  return {
    falKey: import.meta.env.VITE_FAL_KEY || '',
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    storeName: 'ALBA MARTÍN',
    storePhone: '34600000000',
    simulationMode: false,
    geminiModel: 'gemini-3.6-flash',
  };
}

export function loadSettings(): DemoSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return getDefaultSettings();
    const parsed = JSON.parse(raw);
    return {
      falKey: parsed.falKey || import.meta.env.VITE_FAL_KEY || '',
      geminiKey: parsed.geminiKey || import.meta.env.VITE_GEMINI_API_KEY || '',
      storeName: parsed.storeName || 'ALBA MARTÍN',
      storePhone: parsed.storePhone || '34600000000',
      simulationMode: Boolean(parsed.simulationMode),
      geminiModel: parsed.geminiModel || 'gemini-3.6-flash',
    };
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
    return getDefaultSettings();
  }
}

export function saveSettings(settings: DemoSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }
}

/**
 * Carga asíncrona de la modelo guardada desde IndexedDB con fallback a localStorage.
 */
export async function loadSavedModelAsync(): Promise<{ dataUri: string; fileSizeBytes: number } | null> {
  if (cachedSavedModel) return cachedSavedModel;

  try {
    const fromDB = await getKeyvalFromDB<{ dataUri: string; fileSizeBytes: number }>(SAVED_MODEL_STORAGE_KEY);
    if (fromDB) {
      cachedSavedModel = fromDB;
      return fromDB;
    }

    const fromLocal = loadSavedModel();
    if (fromLocal) {
      cachedSavedModel = fromLocal;
      await setKeyvalToDB(SAVED_MODEL_STORAGE_KEY, fromLocal);
      return fromLocal;
    }
  } catch (err) {
    console.warn('Fallback cargando modelo habitual:', err);
  }

  return null;
}

/**
 * Acceso síncrono a la modelo habitual guardada.
 */
export function loadSavedModel(): { dataUri: string; fileSizeBytes: number } | null {
  if (cachedSavedModel) return cachedSavedModel;

  try {
    const raw = localStorage.getItem(SAVED_MODEL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    cachedSavedModel = parsed;
    return parsed;
  } catch (e) {
    console.error('Error loading saved model', e);
    return null;
  }
}

/**
 * Guarda la foto de la modelo habitual en IndexedDB (sin saturar los 5MB de localStorage).
 */
export function saveModelToStorage(dataUri: string, fileSizeBytes: number): void {
  const modelData = { dataUri, fileSizeBytes, savedAt: new Date().toISOString() };
  cachedSavedModel = modelData;

  // Guardar en IndexedDB
  setKeyvalToDB(SAVED_MODEL_STORAGE_KEY, modelData).catch((err) => {
    console.warn('Error al guardar modelo en IndexedDB:', err);
  });

  // Intentar también en localStorage si cabe
  try {
    localStorage.setItem(SAVED_MODEL_STORAGE_KEY, JSON.stringify(modelData));
  } catch {
    // Si localStorage está lleno, IndexedDB ya tiene la foto guardada sin problemas
  }
}

/**
 * Elimina la modelo habitual de IndexedDB y localStorage.
 */
export function removeSavedModel(): void {
  cachedSavedModel = null;
  removeKeyvalFromDB(SAVED_MODEL_STORAGE_KEY).catch(() => {});
  try {
    localStorage.removeItem(SAVED_MODEL_STORAGE_KEY);
  } catch (e) {
    console.error('Error removing saved model', e);
  }
}
