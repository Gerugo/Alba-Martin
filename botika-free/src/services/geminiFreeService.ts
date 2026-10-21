export interface GeminiFashionMetadata {
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  instagramCaption: string;
  whatsappMessage: string;
}

export async function generateFashionMetadataFree(
  garmentBase64Raw: string,
  price: number,
  sizes: string[],
  storeName: string,
  storePhone: string,
  geminiApiKey?: string,
  geminiModel = 'gemini-2.5-flash'
): Promise<GeminiFashionMetadata> {
  // If no Gemini key is provided, generate high-quality editorial fallback instantly
  if (!geminiApiKey || geminiApiKey.trim() === '') {
    const defaultTitle = 'Prenda de Colección Cápsula';
    const slug = 'prenda-coleccion-capsula-' + Date.now().toString().slice(-4);
    return {
      title: defaultTitle,
      handle: slug,
      descriptionHtml: `<p>Pieza de edición limitada confeccionada con tejidos seleccionados de alta caída y confort.</p><ul><li>Corte favorecedor y versátil para el día y la noche</li><li>Acabados pulidos y tacto premium</li><li>Tallas disponibles: ${sizes.join(', ')}</li></ul>`,
      tags: ['Nueva Colección', 'Tendencia', 'Moda Mujer', 'Lookbook', 'Atelier'],
      instagramCaption: `✨ ¡NUEVA LLEGADA A ${storeName.toUpperCase()}! ✨\n\nDescubre esta pieza imprescindible de temporada. Ideal para elevar cualquier estilismo con elegancia sin esfuerzo.\n\n🏷️ PVP: ${price.toFixed(2)}€\n📏 Tallas: ${sizes.join(' · ')}\n\n📲 ¡Reserva la tuya ahora por mensaje directo o WhatsApp antes de que se agoten!`,
      whatsappMessage: `¡Hola! Me gustaría reservar la prenda "${defaultTitle}" (${price.toFixed(2)}€) de ${storeName}. ¿Tenéis disponible la talla...?`,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey.trim()}`;

    const promptText = `
Eres la directora creativa de moda y copywriter senior de la boutique "${storeName}".
Analiza la fotografía de esta prenda adjunta y genera una ficha de producto de alta gama en formato JSON estricto.

Datos:
- Precio: ${price}€
- Tallas: ${sizes.join(', ')}
- Teléfono de reservas: ${storePhone}

Devuelve ÚNICAMENTE un objeto JSON válido con estas claves:
{
  "title": "Nombre comercial elegante, atractivo y descriptivo de la prenda (ej: Blazer Cruzado de Lino Marfil)",
  "handle": "slug-url-limpio-sin-tildes-ni-espacios",
  "descriptionHtml": "Descripción persuasiva en HTML con etiquetas <p> y <ul><li> destacando el tejido, tacto, corte favorecedor y consejos de combinación de estilo.",
  "tags": ["Array con 5 etiquetas relevantes de búsqueda e-commerce"],
  "instagramCaption": "Texto comercial cautivador para Instagram y estados con emojis sutiles, detalles de precio (${price}€), tallas disponibles y llamada a la acción para reservar.",
  "whatsappMessage": "Mensaje predefinido breve y educado para que una clienta pulse y reserve esta prenda exacta indicando su talla"
}
`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: garmentBase64Raw,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      console.warn('Gemini Free Tier API returned non-OK status:', response.status);
      return generateFashionMetadataFree(garmentBase64Raw, price, sizes, storeName, storePhone, '');
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawContent) {
      return generateFashionMetadataFree(garmentBase64Raw, price, sizes, storeName, storePhone, '');
    }

    const parsed = JSON.parse(rawContent) as GeminiFashionMetadata;
    return parsed;
  } catch (error) {
    console.warn('Error al consultar Gemini Free Tier:', error);
    return generateFashionMetadataFree(garmentBase64Raw, price, sizes, storeName, storePhone, '');
  }
}
