import { GeneratedCatalogItem } from '../types/fashion';

export function downloadImage(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function buildWhatsAppReservationUrl(
  phone: string,
  message: string,
  imageUrl?: string
): string {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(
    message + (imageUrl ? `\n\nFoto de referencia: ${imageUrl}` : '')
  );
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Generates official Shopify CSV format
 */
export function exportShopifyCSV(items: GeneratedCatalogItem[], filename = 'shopify-botika-free.csv') {
  const headers = [
    'Handle',
    'Title',
    'Body (HTML)',
    'Vendor',
    'Type',
    'Tags',
    'Published',
    'Option1 Name',
    'Option1 Value',
    'Variant SKU',
    'Variant Price',
    'Image Src',
  ];

  const rows: string[] = [headers.join(',')];

  items.forEach((item) => {
    item.sizes.forEach((size) => {
      const row = [
        `"${item.handle}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.descriptionHtml.replace(/"/g, '""')}"`,
        `"${item.vendor}"`,
        `"${item.category}"`,
        `"${item.tags.join(', ')}"`,
        'TRUE',
        'Size',
        `"${size}"`,
        `"${item.handle.slice(0, 8).toUpperCase()}-${size}"`,
        item.price.toFixed(2),
        `"${item.resultHeroUrl}"`,
      ];
      rows.push(row.join(','));
    });
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  downloadImage(url, filename);
  URL.revokeObjectURL(url);
}
