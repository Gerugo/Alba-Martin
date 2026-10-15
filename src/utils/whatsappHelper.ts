/**
 * Determines whether a garment name in Spanish is feminine or masculine,
 * inspecting the main garment keywords in the title.
 */
export function getGarmentArticle(title: string): string {
  if (!title) return 'la prenda';
  const lowerTitle = title.toLowerCase().trim();
  const words = lowerTitle.split(/\s+/);

  const feminineKeywords = [
    'americana',
    'blusa',
    'camisa',
    'falda',
    'chaqueta',
    'cazadora',
    'parka',
    'sudadera',
    'camiseta',
    'rebeca',
    'gabardina',
    'túnica',
    'tunica',
    'bermuda',
    'bata',
    'capa',
    'prenda',
    'bomber',
    'sobrecamisa',
    'torera',
  ];

  const masculineKeywords = [
    'vestido',
    'pantalón',
    'pantalon',
    'top',
    'blazer',
    'jersey',
    'mono',
    'peto',
    'short',
    'shorts',
    'abrigo',
    'chaleco',
    'traje',
    'kimono',
    'cárdigan',
    'cardigan',
    'body',
    'conjunto',
    'vaquero',
    'vaqueros',
    'polo',
  ];

  // Inspect the first 3 words for garment noun identification
  for (let i = 0; i < Math.min(words.length, 3); i++) {
    const cleanWord = words[i].replace(/[^a-záéíóúñ]/g, '');
    if (feminineKeywords.includes(cleanWord)) return 'la nueva';
    if (masculineKeywords.includes(cleanWord)) return 'el nuevo';
  }

  // Fallback to Spanish noun ending convention
  const firstNoun = words[0].replace(/[^a-záéíóúñ]/g, '');
  if (firstNoun.endsWith('a') && !['pijama', 'día'].includes(firstNoun)) {
    return 'la nueva';
  }

  return 'el nuevo';
}

/**
 * Generates a warm, professional, high-converting WhatsApp reservation message
 * with correct grammatical agreement ("la nueva Americana", "el nuevo Vestido"),
 * WhatsApp bold formatting, and friendly boutique emojis.
 */
export function buildWhatsAppMessage(
  storeName: string,
  title: string,
  price: number,
  size: string
): string {
  const safeStore = storeName.trim() || 'Boutique';
  const article = getGarmentArticle(title);
  const formattedPrice = price.toFixed(2);
  const safeSize = size.trim() || 'M';

  return `¡Hola ${safeStore}! Acabo de ver en vuestro catálogo ${article} *${title}* (${formattedPrice}€) y me gustaría reservar la talla *${safeSize}*. ¿La tenéis disponible?`;
}
