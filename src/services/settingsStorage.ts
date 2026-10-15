import { DemoSettings } from '../types/catalog';

const SETTINGS_STORAGE_KEY = 'demo_moda_settings_v1';
const SAVED_MODEL_STORAGE_KEY = 'demo_moda_saved_model_v1';

export function getDefaultSettings(): DemoSettings {
  return {
    falKey: import.meta.env.VITE_FAL_KEY || '',
    geminiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    storeName: 'Boutique Rota',
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
      storeName: parsed.storeName || 'Boutique Rota',
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

export function loadSavedModel(): { dataUri: string; fileSizeBytes: number } | null {
  try {
    const raw = localStorage.getItem(SAVED_MODEL_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading saved model', e);
    return null;
  }
}

export function saveModelToStorage(dataUri: string, fileSizeBytes: number): void {
  try {
    localStorage.setItem(
      SAVED_MODEL_STORAGE_KEY,
      JSON.stringify({ dataUri, fileSizeBytes, savedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.error('Error saving model to localStorage', e);
  }
}

export function removeSavedModel(): void {
  try {
    localStorage.removeItem(SAVED_MODEL_STORAGE_KEY);
  } catch (e) {
    console.error('Error removing saved model', e);
  }
}
