import { CatalogProduct } from '../types/catalog';

const CATALOG_STORAGE_KEY = 'demo_moda_catalog_v1';

export function loadCatalog(): CatalogProduct[] {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al cargar catálogo de localStorage', err);
    return [];
  }
}

export function saveCatalog(catalog: CatalogProduct[]): void {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog));
  } catch (err) {
    console.error('Error al guardar catálogo en localStorage', err);
  }
}

export function addProductToCatalog(product: CatalogProduct): CatalogProduct[] {
  const current = loadCatalog();
  // Insert at the beginning so latest appears first
  const updated = [product, ...current.filter((p) => p.id !== product.id)];
  saveCatalog(updated);
  return updated;
}

export function deleteProductFromCatalog(id: string): CatalogProduct[] {
  const current = loadCatalog();
  const updated = current.filter((p) => p.id !== id);
  saveCatalog(updated);
  return updated;
}

export function clearCatalog(): void {
  try {
    localStorage.removeItem(CATALOG_STORAGE_KEY);
  } catch (err) {
    console.error('Error al vaciar catálogo', err);
  }
}
