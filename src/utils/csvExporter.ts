import { CatalogProduct } from '../types/catalog';

/**
 * Escapes a cell value for CSV formatting.
 * Encloses the value in quotes if it contains quotes, commas, semicolons, or newlines.
 */
function escapeCsvCell(cell: string | number | undefined, delimiter = ','): string {
  if (cell === undefined || cell === null) return '';
  const str = String(cell);
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (needsQuotes) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Triggers a download of CSV content with UTF-8 BOM (\uFEFF)
 * ensuring Microsoft Excel, macOS Numbers, Shopify, and PrestaShop correctly
 * render accents (á, é, í, ó, ú, ñ) and the euro symbol (€).
 */
function downloadCsvFile(content: string, filename: string): void {
  // UTF-8 BOM
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports products as an official Shopify import compatible CSV.
 * Creates one row per size variant.
 * Official Headers:
 * Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Qty,Variant Price,Image Src,Status
 */
export function exportShopifyCSV(products: CatalogProduct[], filename?: string): void {
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Product Category',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant SKU',
    'Variant Inventory Qty',
    'Variant Price',
    'Image Src',
    'Status',
  ];

  const rows: string[] = [];
  rows.push(headers.join(','));

  products.forEach((product) => {
    const safeSizes = product.sizes && product.sizes.length > 0 ? product.sizes : ['Única'];

    safeSizes.forEach((size, index) => {
      const isFirstVariant = index === 0;

      const rowValues = [
        escapeCsvCell(product.handle),
        isFirstVariant ? escapeCsvCell(product.title) : '',
        isFirstVariant ? escapeCsvCell(product.descriptionHtml) : '',
        escapeCsvCell(product.vendor),
        escapeCsvCell(product.productCategory),
        escapeCsvCell('Ropa'),
        isFirstVariant ? escapeCsvCell(product.tags.join(', ')) : '',
        'TRUE',
        'Talla',
        escapeCsvCell(size),
        escapeCsvCell(`${product.skuPrefix}-${size}`),
        '10',
        product.price.toFixed(2),
        isFirstVariant ? escapeCsvCell(product.resultImageUrl) : '',
        'active',
      ];

      rows.push(rowValues.join(','));
    });
  });

  const csvContent = rows.join('\r\n');
  const safeFilename = filename || `shopify-catalogo-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(csvContent, safeFilename);
}

/**
 * Exports products as an official PrestaShop import compatible CSV (semicolon separated).
 * Official Headers:
 * ID;Activo (0/1);Nombre;Categorías;Precio impuestos incluidos;Referencia №;Resumen;Descripción;Etiquetas;URLs de las imágenes (x,y,z...)
 */
export function exportPrestaShopCSV(products: CatalogProduct[], filename?: string): void {
  const headers = [
    'ID',
    'Activo (0/1)',
    'Nombre',
    'Categorías',
    'Precio impuestos incluidos',
    'Referencia №',
    'Resumen',
    'Descripción',
    'Etiquetas',
    'URLs de las imágenes (x,y,z...)',
  ];

  const delimiter = ';';
  const rows: string[] = [];
  rows.push(headers.join(delimiter));

  products.forEach((product, idx) => {
    // Clean text summary from HTML for Resumen
    const textSummary = product.descriptionHtml
      ? product.descriptionHtml.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
      : product.title;

    const rowValues = [
      String(idx + 1),
      '1', // Activo
      escapeCsvCell(product.title, delimiter),
      escapeCsvCell(`Inicio, ${product.productCategory}`, delimiter),
      product.price.toFixed(2),
      escapeCsvCell(product.skuPrefix, delimiter),
      escapeCsvCell(textSummary, delimiter),
      escapeCsvCell(product.descriptionHtml, delimiter),
      escapeCsvCell(product.tags.join(', '), delimiter),
      escapeCsvCell(product.resultImageUrl, delimiter),
    ];

    rows.push(rowValues.join(delimiter));
  });

  const csvContent = rows.join('\r\n');
  const safeFilename = filename || `prestashop-catalogo-${new Date().toISOString().slice(0, 10)}.csv`;
  downloadCsvFile(csvContent, safeFilename);
}
