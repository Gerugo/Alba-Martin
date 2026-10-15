import { fal } from '@fal-ai/client';
import { CatalogProduct, ProductCategory } from '../types/catalog';

export interface TryOnParams {
  modelDataUri: string;
  garmentDataUri: string;
  garmentBase64Raw: string;
  category: ProductCategory;
  price: number;
  sizes: string[];
  storeName: string;
  falKey: string;
  geminiKey: string;
  geminiModel?: string;
  simulationMode?: boolean;
  onStageChange?: (stage: 'adjusting_garment' | 'generating_copy') => void;
}

export interface GeneratedMetadata {
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  instagramCaption: string;
}

/**
 * Executes Virtual Try-On using Fal.ai FASHN v1.5
 */
export async function runVirtualTryOn(
  modelDataUri: string,
  garmentDataUri: string,
  category: ProductCategory,
  falKey: string,
  simulationMode = false
): Promise<string> {
  if (simulationMode) {
    // Realistic simulation delay (2.5s)
    await new Promise((res) => setTimeout(res, 2500));
    // Return model image or a clean high quality placeholder
    return modelDataUri;
  }

  if (!falKey || falKey.trim() === '') {
    throw new Error(
      'Falta la clave Fal.ai API Key. Puedes añadirla en Ajustes o activar el Modo Simulación.'
    );
  }

  try {
    fal.config({ credentials: falKey.trim() });

    const result = await fal.subscribe('fal-ai/fashn/tryon/v1.5', {
      input: {
        model_image: modelDataUri,
        garment_image: garmentDataUri,
        category: category === 'auto' ? undefined : category,
        mode: 'quality',
        garment_photo_type: 'auto',
        moderation_level: 'permissive',
        output_format: 'png',
      } as any,
      logs: false,
    });

    const data = result.data as { images?: { url: string }[]; image?: { url: string } };
    const generatedUrl = data?.images?.[0]?.url || data?.image?.url;

    if (!generatedUrl) {
      throw new Error('Fal.ai no devolvió ninguna URL de imagen válida.');
    }

    return generatedUrl;
  } catch (err: unknown) {
    console.error('Error en Fal.ai Virtual Try-On:', err);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Fallo en Fal.ai Try-On: ${message}`);
  }
}

/**
 * Generates SEO commercial product sheet & Instagram copy using Gemini
 */
export async function generateProductMetadata(
  garmentBase64Raw: string,
  price: number,
  sizes: string[],
  storeName: string,
  category: ProductCategory,
  geminiKey: string,
  simulationMode = false,
  requestedModel = 'gemini-3.6-flash'
): Promise<GeneratedMetadata> {
  const safeStoreName = storeName || 'Boutique Rota';
  const safeSizesStr = sizes.length > 0 ? sizes.join(', ') : 'S, M, L';
  const formattedPrice = price.toFixed(2);

  // Fallback simulator for offline / no coverage
  const getSimulatedMetadata = (): GeneratedMetadata => {
    const titlesByCategory: Record<ProductCategory, string> = {
      auto: 'Vestido Camisero Floral con Cinturón',
      tops: 'Blusa Fluida Satinada con Cuello Lazadas',
      bottoms: 'Pantalón Culotte Talle Alto con Pinzas',
      'one-pieces': 'Vestido Midi Plisado de Fiesta',
    };

    const title = titlesByCategory[category] || 'Prenda de Colección Exclusiva';
    const handle = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    return {
      title,
      handle,
      descriptionHtml: `<p>Eleva tu armario con esta pieza estrella de <strong>${safeStoreName}</strong>. Diseñada para estilizar tu figura con una caída impecable, combinando la máxima comodidad con un acabado elegante.</p><ul><li><strong>Tejido:</strong> Suave, ligero y transpirable con tacto premium.</li><li><strong>Corte:</strong> Silueta favorecedora apta para ocasiones especiales o diario.</li><li><strong>Consejo de estilo:</strong> Combínalo con calzado neutro y accesorios dorados para un look sofisticado.</li></ul>`,
      tags: ['nueva colección', 'tendencia', 'moda mujer', 'boutique', 'look elegante'],
      instagramCaption: `Novedad en ${safeStoreName}.\n\nPresentamos este nuevo modelo diseñado para estilizar tu figura con una caída impecable, tejido suave y gran versatilidad para tu armario.\n\nTallas disponibles: ${safeSizesStr}\nPrecio: ${formattedPrice}€\n\nPuedes escribirnos por privado o por WhatsApp para consultar disponibilidad o reservar tu talla.\n\n#Moda #${safeStoreName.replace(/\s+/g, '')} #NuevaColeccion #Tendencias #OOTD #TiendaDeRopa`,
    };
  };

  if (simulationMode) {
    await new Promise((res) => setTimeout(res, 2000));
    return getSimulatedMetadata();
  }

  if (!geminiKey || geminiKey.trim() === '') {
    throw new Error(
      'Falta la clave Gemini API Key. Puedes añadirla en Ajustes o activar el Modo Simulación.'
    );
  }

  const prompt = `Eres un redactor experto en moda y e-commerce de alta conversión para boutiques de ropa en España.
Analiza la foto adjunta de esta prenda de vestir colgada en percha.
Detalles comerciales de la tienda:
- Nombre de la boutique: "${safeStoreName}"
- Precio de venta: ${formattedPrice}€
- Tallas disponibles para la venta: ${safeSizesStr}
- Categoría elegida: ${category}

REGLA ESTRICTA DE ESTILO: NUNCA utilices emoticonos ni emojis de ningún tipo en ninguna parte del texto generado (ni en el título, ni en la descripción, ni en el post de Instagram).

Genera un objeto JSON EXACTO con las siguientes claves:
1. "title": Nombre comercial atractivo, elegante y descriptivo en español (ej. "Blusa Fluida Satinada con Cuello Lazadas").
2. "handle": Slug SEO amigable sin tildes ni espacios (ej. "blusa-fluida-satinada-cuello-lazadas").
3. "descriptionHtml": Descripción comercial persuasiva en HTML utilizando párrafos (<p>) y lista de viñetas (<ul><li>) destacando el corte, calidad de tela y consejos de combinación.
4. "tags": Array con 5 etiquetas en minúsculas para buscador de tienda online (ej. ["blusa", "nueva coleccion", "moda mujer", "fiesta", "elegante"]).
5. "instagramCaption": Texto profesional y elegante para Instagram y Estados de WhatsApp sin emoticonos, mencionando las tallas (${safeSizesStr}), el precio (${formattedPrice}€), la tienda "${safeStoreName}" y una llamada clara a reservar por WhatsApp o mensaje directo.`;

  // Model cascade: try preferred model (e.g. gemini-3.6-flash), then fast alternatives
  const candidateModels = [
    requestedModel || 'gemini-3.6-flash',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  for (const model of candidateModels) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey.trim()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: garmentBase64Raw,
                    },
                  },
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.3,
            },
          }),
        }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Modelo ${model} respondió con error ${response.status}. Probando siguiente...`);
        continue;
      }

      const jsonResp = await response.json();
      const candidateText = jsonResp.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!candidateText) {
        continue;
      }

      const cleaned = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        title: parsed.title || 'Prenda de Temporada',
        handle:
          parsed.handle ||
          'prenda-de-temporada-' + Math.floor(Math.random() * 1000),
        descriptionHtml:
          parsed.descriptionHtml ||
          `<p>Prenda de diseño exclusivo disponible en <strong>${safeStoreName}</strong>.</p>`,
        tags: Array.isArray(parsed.tags) ? parsed.tags : ['moda', 'nueva coleccion'],
        instagramCaption: parsed.instagramCaption || `Novedad en ${safeStoreName} por ${formattedPrice}€.`,
      };
    } catch (modelErr) {
      console.warn(`Error al consultar ${model}:`, modelErr);
    }
  }

  // Graceful fallback if all models fail
  console.warn('Ningún modelo de Gemini respondió a tiempo. Activando ficha de alta calidad de reserva.');
  return getSimulatedMetadata();
}

/**
 * Orchestrates Parallel Processing with Promise.all
 */
export async function executeLiveTryOnAndCatalog(
  params: TryOnParams
): Promise<CatalogProduct> {
  const {
    modelDataUri,
    garmentDataUri,
    garmentBase64Raw,
    category,
    price,
    sizes,
    storeName,
    falKey,
    geminiKey,
    simulationMode = false,
    onStageChange,
  } = params;

  onStageChange?.('adjusting_garment');

  // Trigger both tasks concurrently
  const [resultImageUrl, metadata] = await Promise.all([
    runVirtualTryOn(modelDataUri, garmentDataUri, category, falKey, simulationMode),
    (async () => {
      onStageChange?.('generating_copy');
      return generateProductMetadata(
        garmentBase64Raw,
        price,
        sizes,
        storeName,
        category,
        geminiKey,
        simulationMode,
        params.geminiModel
      );
    })(),
  ]);

  // Generate unique product record
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  const prefix = `ROT-${randomSuffix}`;
  const id = `prod_${Date.now()}_${randomSuffix}`;

  const product: CatalogProduct = {
    id,
    createdAt: new Date().toISOString(),
    title: metadata.title,
    handle: metadata.handle,
    descriptionHtml: metadata.descriptionHtml,
    vendor: storeName || 'Boutique Rota',
    productCategory: category,
    tags: metadata.tags,
    price,
    sizes,
    skuPrefix: prefix,
    modelPhotoBase64: modelDataUri,
    garmentPhotoBase64: garmentDataUri,
    resultImageUrl,
    instagramCaption: metadata.instagramCaption,
  };

  return product;
}
