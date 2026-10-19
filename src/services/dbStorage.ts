import { CatalogProduct } from '../types/catalog';

const DB_NAME = 'alba_martin_moda_db_v1';
const DB_VERSION = 1;
const STORE_CATALOG = 'catalog_products';
const STORE_KEYVAL = 'keyval_store';

/**
 * Abre o inicializa la base de datos IndexedDB local del navegador.
 * IndexedDB ofrece gigabytes de espacio persistente, superando el límite de 5MB de localStorage.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no está disponible en este navegador'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CATALOG)) {
        const store = db.createObjectStore(STORE_CATALOG, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_KEYVAL)) {
        db.createObjectStore(STORE_KEYVAL);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene todos los productos del catálogo guardados en IndexedDB.
 */
export async function getAllProductsFromDB(): Promise<CatalogProduct[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readonly');
      const store = tx.objectStore(STORE_CATALOG);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = (request.result as CatalogProduct[]) || [];
        // Ordenar del más reciente al más antiguo
        results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        resolve(results);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB no disponible, usando fallback:', err);
    return [];
  }
}

/**
 * Guarda o actualiza un producto en IndexedDB.
 */
export async function saveProductToDB(product: CatalogProduct): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      store.put(product);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error al guardar producto en IndexedDB:', err);
    throw err;
  }
}

/**
 * Elimina un producto por su id de IndexedDB.
 */
export async function deleteProductFromDB(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error al eliminar producto de IndexedDB:', err);
  }
}

/**
 * Vacía la colección completa de productos de IndexedDB.
 */
export async function clearAllProductsFromDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error al vaciar IndexedDB:', err);
  }
}

/**
 * Obtiene un valor arbitrario por clave (por ejemplo, foto de la modelo guardada).
 */
export async function getKeyvalFromDB<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_KEYVAL, 'readonly');
      const store = tx.objectStore(STORE_KEYVAL);
      const request = store.get(key);
      request.onsuccess = () => resolve((request.result as T) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/**
 * Guarda un valor arbitrario por clave en IndexedDB.
 */
export async function setKeyvalToDB(key: string, val: unknown): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_KEYVAL, 'readwrite');
      const store = tx.objectStore(STORE_KEYVAL);
      store.put(val, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error al guardar clave en IndexedDB:', err);
  }
}

/**
 * Elimina un valor arbitrario de IndexedDB.
 */
export async function removeKeyvalFromDB(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_KEYVAL, 'readwrite');
      const store = tx.objectStore(STORE_KEYVAL);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('Error al eliminar clave de IndexedDB:', err);
  }
}
