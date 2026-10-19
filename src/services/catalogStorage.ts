import { CatalogProduct } from '../types/catalog';
import {
  getAllProductsFromDB,
  saveProductToDB,
  deleteProductFromDB,
  clearAllProductsFromDB,
} from './dbStorage';

const CATALOG_STORAGE_KEY = 'demo_moda_catalog_v1';

// Memoria caché para acceso síncrono ultra-rápido en componentes React
let inMemoryCatalog: CatalogProduct[] | null = null;

/**
 * Optimiza el objeto del producto eliminando campos base64 redundantes que duplican el peso en memoria.
 */
export function sanitizeProductForStorage(product: CatalogProduct): CatalogProduct {
  // En lookItems, base64Raw es idéntico a dataUri sin el prefijo, duplicando el peso innecesariamente.
  const cleanedLookItems = product.lookItems?.map((item) => ({
    ...item,
    base64Raw: '', // Evita almacenar dos veces la misma foto en base64
  }));

  return {
    ...product,
    lookItems: cleanedLookItems,
  };
}

/**
 * Lectura segura de respaldo desde localStorage.
 */
export function loadCatalogFromLocalStorage(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al cargar catálogo de localStorage', err);
    return [];
  }
}

/**
 * Carga asíncrona principal desde IndexedDB.
 * Si IndexedDB está vacío, busca automáticamente prendas antiguas en localStorage y las migra.
 */
export async function loadCatalogAsync(): Promise<CatalogProduct[]> {
  try {
    const dbProducts = await getAllProductsFromDB();
    if (dbProducts && dbProducts.length > 0) {
      inMemoryCatalog = dbProducts;
      return dbProducts;
    }

    // Migración automática de localStorage a IndexedDB si existían datos previos
    const legacy = loadCatalogFromLocalStorage();
    if (legacy && legacy.length > 0) {
      for (const item of legacy) {
        await saveProductToDB(sanitizeProductForStorage(item));
      }
      inMemoryCatalog = legacy;
      return legacy;
    }

    inMemoryCatalog = [];
    return [];
  } catch (err) {
    console.warn('Fallback a localStorage para catálogo:', err);
    const fallback = loadCatalogFromLocalStorage();
    inMemoryCatalog = fallback;
    return fallback;
  }
}

/**
 * Acceso síncrono al catálogo actual (utiliza la memoria caché o respaldo de localStorage).
 */
export function loadCatalog(): CatalogProduct[] {
  if (inMemoryCatalog !== null) {
    return inMemoryCatalog;
  }
  const fallback = loadCatalogFromLocalStorage();
  inMemoryCatalog = fallback;
  return fallback;
}

/**
 * Guarda una nueva prenda o look completo en IndexedDB (sin límite de 5MB).
 * También actualiza la memoria y realiza un respaldo ligero en localStorage.
 */
export async function addProductToCatalog(product: CatalogProduct): Promise<CatalogProduct[]> {
  const sanitized = sanitizeProductForStorage(product);
  const current = inMemoryCatalog !== null ? inMemoryCatalog : loadCatalog();
  const updated = [sanitized, ...current.filter((p) => p.id !== product.id)];
  inMemoryCatalog = updated;

  // 1. Guardar de forma persistente y segura en IndexedDB (capacidad de gigabytes)
  try {
    await saveProductToDB(sanitized);
  } catch (dbErr) {
    console.error('Error al guardar en IndexedDB:', dbErr);
  }

  // 2. Respaldo ligero en localStorage (solo metadatos para evitar QuotaExceededError)
  try {
    const lightBackup = updated.slice(0, 8).map((p) => ({
      ...p,
      modelPhotoBase64: '',
      garmentPhotosBase64: [],
      lookItems: undefined,
    }));
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(lightBackup));
  } catch {
    // Si localStorage está lleno, no pasa nada: IndexedDB tiene toda la información completa intacta.
  }

  return updated;
}

/**
 * Elimina una prenda del catálogo en IndexedDB y memoria.
 */
export async function deleteProductFromCatalog(id: string): Promise<CatalogProduct[]> {
  const current = inMemoryCatalog !== null ? inMemoryCatalog : loadCatalog();
  const updated = current.filter((p) => p.id !== id);
  inMemoryCatalog = updated;

  try {
    await deleteProductFromDB(id);
  } catch (dbErr) {
    console.error('Error al eliminar en IndexedDB:', dbErr);
  }

  try {
    const lightBackup = updated.slice(0, 8).map((p) => ({
      ...p,
      modelPhotoBase64: '',
      garmentPhotosBase64: [],
      lookItems: undefined,
    }));
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(lightBackup));
  } catch {
    // ignorar cuota de localStorage
  }

  return updated;
}

/**
 * Vacía el catálogo tanto de IndexedDB como de localStorage.
 */
export async function clearCatalog(): Promise<void> {
  inMemoryCatalog = [];

  try {
    await clearAllProductsFromDB();
  } catch (err) {
    console.error('Error al vaciar IndexedDB:', err);
  }

  try {
    localStorage.removeItem(CATALOG_STORAGE_KEY);
  } catch {
    // ignorar
  }
}
