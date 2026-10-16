import { fal } from '@fal-ai/client';
import {
  CatalogProduct,
  ProductCategory,
  BackgroundType,
  TryOnEngine,
  SceneStyle,
  ModelMode,
  VirtualModelProfile,
  LookItem
} from '../types/catalog';

export type TryOnStage =
  | 'idle'
  | 'adjusting_garment'
  | 'adjusting_garment_top'
  | 'adjusting_garment_bottom'
  | 'adjusting_look_completo'
  | 'generating_copy'
  | 'replacing_background'
  | 'completed';

export interface TryOnParams {
  modelDataUri?: string;
  garmentDataUri: string;
  garmentBase64Raw: string;
  secondaryGarmentDataUri?: string;
  secondaryGarmentBase64Raw?: string;
  isOutfit?: boolean;
  isLookCompleto?: boolean;
  lookItems?: LookItem[];
  category: ProductCategory;
  engine?: TryOnEngine;
  sceneStyle?: SceneStyle;
  backgroundType?: BackgroundType;
  customBackgroundBase64?: string;
  price: number;
  sizes: string[];
  storeName: string;
  falKey: string;
  geminiKey: string;
  geminiModel?: string;
  simulationMode?: boolean;
  modelMode?: ModelMode;
  editorialRepose?: boolean;
  virtualModel?: VirtualModelProfile;
  onStageChange?: (stage: TryOnStage) => void;
}

export interface GeneratedMetadata {
  title: string;
  handle: string;
  descriptionHtml: string;
  tags: string[];
  instagramCaption: string;
}

export const VIRTUAL_MODEL_DESCRIPTIONS: Record<VirtualModelProfile, string> = {
  mediterranean:
    'Sofia, a gorgeous 30-year-old Spanish fashion model with sun-kissed luminous olive skin, natural shoulder-length wavy brunette hair, warm honey eyes, and Massimo Dutti editorial lookbook elegance',
  'nordic-studio':
    'Chloe, a stunning 26-year-old international high-fashion runway model with an effortless messy updo, sculpted high cheekbones, luminous skin, and minimalist Zara Studio editorial campaign aesthetic',
  'andalusian-chic':
    'Lucia, an enchanting 34-year-old Andalusian woman with glossy dark hair, radiant warm smile, elegant posture, and sophisticated boutique guest elegance',
};

/**
 * Executes Virtual Try-On using top-tier Fal.ai models (Nano Banana Pro 2K, FLUX.2 Max HD, FASHN v1.6)
 * Supports both real shop staff with editorial repose and virtual supermodels (Botika / Zara Studio style).
 */
export async function runVirtualTryOn(
  modelDataUri: string,
  garmentDataUri: string,
  category: ProductCategory = 'auto',
  falKey: string,
  engine: TryOnEngine = 'nano-banana-pro',
  sceneStyle: SceneStyle = 'boutique',
  simulationMode = false,
  modelMode: ModelMode = 'real',
  editorialRepose = true,
  virtualModel: VirtualModelProfile = 'mediterranean'
): Promise<string> {
  if (simulationMode) {
    // Realistic simulation delay (2.5s)
    await new Promise((res) => setTimeout(res, 2500));
    return modelDataUri || garmentDataUri;
  }

  if (!falKey || falKey.trim() === '') {
    throw new Error(
      'Falta la clave Ropa API Key. Puedes añadirla en el menú de Ajustes.'
    );
  }

  try {
    fal.config({ credentials: falKey.trim() });

    const scenePrompts: Record<SceneStyle, string> = {
      boutique:
        'Place her inside a bright, elegant, high-end modern clothing boutique with soft natural daylight and a softly blurred warm interior background.',
      studio:
        'Place her in a professional fashion photography studio with a clean warm off-white editorial backdrop and soft commercial studio lighting.',
      street:
        'Place her outdoors on a bright sunlit charming Mediterranean street with soft natural golden daylight and shallow depth of field.',
      original:
        'Keep the original background environment from the first image, but enhance the lighting so it looks clean, natural, and well-balanced.',
    };

    const scenePrompt = scenePrompts[sceneStyle] || scenePrompts.boutique;
    const isVirtual = modelMode === 'virtual' || !modelDataUri;
    const virtualDesc = VIRTUAL_MODEL_DESCRIPTIONS[virtualModel] || VIRTUAL_MODEL_DESCRIPTIONS.mediterranean;

    // Use Nano Banana Pro by default (and fallback from fashn if virtual model mode)
    const activeEngine = isVirtual && engine === 'fashn-v16' ? 'nano-banana-pro' : engine;

    if (activeEngine === 'nano-banana-pro') {
      let prompt = '';
      let imageUrls: string[] = [];

      if (isVirtual) {
        prompt = `High-fashion commercial lookbook campaign photography (Zara / Massimo Dutti / Botika editorial style). A gorgeous full-body/three-quarter portrait of ${virtualDesc}. She is posing with a confident, dynamic, graceful high-fashion posture (subtle three-quarter turn, relaxed asymmetric shoulders, one hand casually in pocket or lightly touching the garment, elongated flattering camera angle from waist level). She is wearing the exact garment shown in the image with hyper-detailed fabric texture, natural folds, accurate print, and tailored fit (completely removing any hanger or tag). Pair with high-end coordinated trousers or skirt with subtle luxury styling. ${scenePrompt} Professional commercial color grading, soft rim lighting, skin and fabric retouching, Canon EOS R5, 85mm f/1.4 lens, 2K resolution.`;
        imageUrls = [garmentDataUri];
      } else if (editorialRepose) {
        prompt = `High-fashion commercial lookbook campaign photography (Zara / Massimo Dutti / Botika editorial style). Preserve 100% of the exact facial identity, facial structure, eyes, smile, and hair of the woman from the first image, but transform her stiff snapshot posture into a confident, dynamic, flattering professional fashion model pose (subtle three-quarter turn, relaxed asymmetric shoulders, one hand casually in pocket or lightly resting near the garment, elongated flattering camera angle from waist level). She is wearing the exact garment from the second image with hyper-detailed fabric texture, natural folds, accurate print, and tailored fit (completely removing any hanger). Pair with high-end coordinated trousers/skirt and subtle luxury styling. ${scenePrompt} Professional commercial color grading, soft rim lighting, skin and fabric retouching, Canon EOS R5, 85mm f/1.4 lens, 2K resolution.`;
        imageUrls = [modelDataUri, garmentDataUri];
      } else {
        prompt = `Professional high-end fashion e-commerce photography. The exact woman from the first image (preserving 100% of her real facial features, smile, identity, hair, skin tone, and natural body proportions, maintaining her exact original pose) is wearing the exact garment shown in the second image. Reproduce the exact fabric pattern, colors, collar, sleeves, and natural drape of the garment from the second image with hyper-realistic texture, removing any hanger or tag. Pair it with flattering complementary trousers or skirt if only a top/jacket is provided. ${scenePrompt} Shot on 85mm lens, ultra-sharp focus, 2K resolution.`;
        imageUrls = [modelDataUri, garmentDataUri];
      }

      const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
        input: {
          prompt,
          image_urls: imageUrls,
          resolution: '2K',
          aspect_ratio: '3:4',
          output_format: 'jpeg',
          safety_tolerance: '5',
        } as any,
        logs: false,
      });

      const data = result.data as { images?: { url: string }[]; image?: { url: string } };
      const generatedUrl = data?.images?.[0]?.url || data?.image?.url;

      if (!generatedUrl) {
        throw new Error('Fal.ai Nano Banana Pro no devolvió ninguna URL de imagen válida.');
      }

      return generatedUrl;
    }

    if (activeEngine === 'flux-2-max') {
      let prompt = '';
      let imageUrls: string[] = [];

      if (isVirtual) {
        prompt = `High-fashion commercial lookbook campaign photography (Zara / Massimo Dutti / Botika editorial style). A gorgeous portrait of ${virtualDesc} posing with dynamic professional model posture, wearing the exact garment from @image1 with realistic drape, texture, and print without any hanger. ${scenePrompt} Ultra-sharp commercial photography.`;
        imageUrls = [garmentDataUri];
      } else if (editorialRepose) {
        prompt = `High-fashion commercial lookbook campaign photography of the exact woman from @image1 wearing the exact garment from @image2. Preserve 100% of the facial identity, smile, hair, and eyes of @image1, while transforming her posture into a dynamic, confident, professional high-fashion pose with relaxed shoulders and natural hands. Render the exact print, cut, sleeves, and fabric texture of @image2 naturally on her body without any hanger. ${scenePrompt} Ultra-sharp commercial photography.`;
        imageUrls = [modelDataUri, garmentDataUri];
      } else {
        prompt = `Professional fashion photography of the exact woman from @image1 wearing the exact garment from @image2. Preserve 100% of the facial identity, smile, hair, and body proportions of @image1. Render the exact print, cut, sleeves, and fabric texture of @image2 naturally on her body without any hanger. ${scenePrompt} Ultra-sharp commercial photography.`;
        imageUrls = [modelDataUri, garmentDataUri];
      }

      const result = await fal.subscribe('fal-ai/flux-2-max/edit', {
        input: {
          prompt,
          image_urls: imageUrls,
          aspect_ratio: '3:4',
        } as any,
        logs: false,
      });

      const data = result.data as { images?: { url: string }[]; image?: { url: string } };
      const generatedUrl = data?.images?.[0]?.url || data?.image?.url;

      if (!generatedUrl) {
        throw new Error('Fal.ai FLUX.2 Max no devolvió ninguna URL de imagen válida.');
      }

      return generatedUrl;
    }

    // Default: fashn-v16 (solo si hay foto real de modelo)
    const result = await fal.subscribe('fal-ai/fashn/tryon/v1.6', {
      input: {
        model_image: modelDataUri,
        garment_image: garmentDataUri,
        category: category || 'auto',
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
      throw new Error('Fal.ai FASHN v1.6 no devolvió ninguna URL de imagen válida.');
    }

    return generatedUrl;
  } catch (err: unknown) {
    console.error(`Error en Fal.ai Virtual Try-On (${engine}):`, err);
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Fallo en Virtual Try-On (${engine}): ${message}`);
  }
}

export interface LookCompletoTryOnParams {
  modelDataUri?: string;
  items: LookItem[];
  falKey: string;
  engine?: TryOnEngine;
  sceneStyle?: SceneStyle;
  simulationMode?: boolean;
  modelMode?: ModelMode;
  editorialRepose?: boolean;
  virtualModel?: VirtualModelProfile;
}

/**
 * Executes multi-garment & accessories editorial synthesis (Look Completo estilo Botika / Zara Studio).
 * Passes all pieces simultaneously to Fal.ai 2K vision models with harmonious layering prompts.
 */
export async function runLookCompletoTryOn(
  params: LookCompletoTryOnParams
): Promise<string> {
  const {
    modelDataUri = '',
    items,
    falKey,
    engine = 'nano-banana-pro',
    sceneStyle = 'boutique',
    simulationMode = false,
    modelMode = 'real',
    editorialRepose = true,
    virtualModel = 'mediterranean',
  } = params;

  if (simulationMode) {
    await new Promise((res) => setTimeout(res, 2500));
    return modelDataUri || items[0]?.dataUri || '';
  }

  if (!falKey || falKey.trim() === '') {
    throw new Error(
      'Falta la clave Ropa API Key. Puedes añadirla en el menú de Ajustes.'
    );
  }

  if (!items || items.length === 0) {
    throw new Error('No se han proporcionado prendas ni accesorios para el Look Completo.');
  }

  fal.config({ credentials: falKey.trim() });

  const scenePrompts: Record<SceneStyle, string> = {
    boutique:
      'Place her inside a bright, elegant, high-end modern clothing boutique with soft natural daylight and a softly blurred warm interior background.',
    studio:
      'Place her in a professional fashion photography studio with a clean warm off-white editorial backdrop and soft commercial studio lighting.',
    street:
      'Place her outdoors on a bright sunlit charming Mediterranean street with soft natural golden daylight and shallow depth of field.',
    original:
      'Keep the original background environment from the first image, but enhance the lighting so it looks clean, natural, and well-balanced.',
  };

  const scenePrompt = scenePrompts[sceneStyle] || scenePrompts.boutique;
  const isVirtual = modelMode === 'virtual' || !modelDataUri;
  const virtualDesc = VIRTUAL_MODEL_DESCRIPTIONS[virtualModel] || VIRTUAL_MODEL_DESCRIPTIONS.mediterranean;

  const categoryLabels: Record<string, string> = {
    outerwear: 'Outerwear/Blazer/Jacket: Tailored structured cut, worn elegantly open or resting on shoulders',
    top: 'Inner Top/Shirt/Blouse: Clean minimal silhouette layered harmoniously underneath',
    bottom: 'Bottom/Trousers/Skirt: Flattering tailored fit, high-waisted and clean drape',
    accessory: 'Accessory/Bag/Belt: Luxury leather or metal accessory held gracefully in hand or cinching waist',
  };

  const itemsListPrompt = items
    .map((item, idx) => {
      const catLabel = categoryLabels[item.category] || item.label || 'Fashion piece';
      const imgRef = isVirtual ? `Image ${idx + 1}` : `Image ${idx + 2}`;
      return `- Piece ${idx + 1} (${imgRef}): ${catLabel} matching the exact fabric, color, texture, cut, and details of the provided item photo.`;
    })
    .join('\n');

  // Nano Banana Pro is default and primary for multi-reference 2K
  if (engine === 'nano-banana-pro' || engine === 'fashn-v16') {
    let prompt = '';
    let imageUrls: string[] = [];

    if (isVirtual) {
      prompt = `High-fashion commercial lookbook campaign photography (Zara Studio / Botika / Massimo Dutti editorial styling). Full-body editorial campaign portrait of ${virtualDesc}. She is impeccably styled wearing a complete coordinated luxury outfit ("Total Look") composed of all the exact pieces shown in the reference images:\n${itemsListPrompt}\nLayering & Fit: All pieces are worn simultaneously in a harmonious multi-layered fashion styling (outerwear draped or worn open over the top, top neatly paired with the trousers/skirt, accessory held or worn naturally). Faithful reproduction of every garment's texture, pattern, drape, collar, and hem, completely removing any hangers, tags, or flat-lay backgrounds. Pose: Confident, dynamic runway model pose with subtle three-quarter turn and graceful silhouette. ${scenePrompt} Professional studio lighting, soft color grading, 85mm lens, f/2.0, ultra-sharp 2K fashion catalog resolution.`;
      imageUrls = items.map((i) => i.dataUri);
    } else if (editorialRepose) {
      prompt = `High-fashion commercial lookbook campaign photography (Zara Studio / Botika / Massimo Dutti editorial styling). Preserve 100% of the exact facial identity, facial structure, eyes, smile, and hair of the woman from the first image, but transform her posture into a confident, dynamic, flattering professional fashion model pose (subtle three-quarter turn, relaxed asymmetric shoulders, graceful natural stance). She is styled wearing a complete coordinated luxury outfit ("Total Look") composed of all the exact pieces shown in the following reference images:\n${itemsListPrompt}\nLayering & Fit: All pieces are worn simultaneously in a harmonious multi-layered styling (outerwear draped or worn open over the top, top neatly paired with the trousers/skirt, accessory held or worn naturally). Faithful reproduction of every garment's texture, pattern, drape, collar, and hem, completely removing any hangers, tags, or flat-lay backgrounds. ${scenePrompt} Professional commercial color grading, soft rim lighting, skin and fabric retouching, Canon EOS R5, 85mm f/1.4 lens, 2K resolution.`;
      imageUrls = [modelDataUri, ...items.map((i) => i.dataUri)];
    } else {
      prompt = `Professional high-end fashion e-commerce photography. The exact woman from the first image (preserving 100% of her real facial features, smile, identity, hair, skin tone, and natural body proportions, maintaining her exact original pose) is styled wearing a complete coordinated luxury outfit ("Total Look") composed of all the exact pieces shown in the following reference images:\n${itemsListPrompt}\nLayering & Fit: All pieces are worn simultaneously with faithful reproduction of every garment's texture, pattern, drape, collar, and hem, removing any hangers or tags. ${scenePrompt} Shot on 85mm lens, ultra-sharp focus, 2K resolution.`;
      imageUrls = [modelDataUri, ...items.map((i) => i.dataUri)];
    }

    const result = await fal.subscribe('fal-ai/nano-banana-pro/edit', {
      input: {
        prompt,
        image_urls: imageUrls,
        resolution: '2K',
        aspect_ratio: '3:4',
        output_format: 'jpeg',
        safety_tolerance: '5',
      } as any,
      logs: false,
    });

    const data = result.data as { images?: { url: string }[]; image?: { url: string } };
    const generatedUrl = data?.images?.[0]?.url || data?.image?.url;

    if (!generatedUrl) {
      throw new Error('Fal.ai Nano Banana Pro no devolvió ninguna URL de imagen válida para el Look Completo.');
    }

    return generatedUrl;
  }

  // FLUX.2 Max HD
  let prompt = '';
  let imageUrls: string[] = [];

  if (isVirtual) {
    const fluxRefs = items.map((_, idx) => `@image${idx + 1}`).join(', ');
    prompt = `High-fashion commercial lookbook campaign photography (Zara Studio / Botika editorial style). A gorgeous portrait of ${virtualDesc} wearing a complete coordinated luxury outfit composed of all items from ${fluxRefs}. Structured outerwear worn over the top, paired with trousers/skirt and accessories. Realistic texture, print, and drape without any hangers. ${scenePrompt} Ultra-sharp commercial photography.`;
    imageUrls = items.map((i) => i.dataUri);
  } else if (editorialRepose) {
    const fluxRefs = items.map((_, idx) => `@image${idx + 2}`).join(', ');
    prompt = `High-fashion commercial lookbook campaign photography of the woman from @image1 wearing a complete coordinated luxury outfit composed of all items from ${fluxRefs}. Preserve 100% of facial identity, smile, hair, and eyes of @image1 with a dynamic high-fashion pose. Structured outerwear layered over the top, paired with trousers/skirt and accessories without any hangers. ${scenePrompt} Ultra-sharp commercial photography.`;
    imageUrls = [modelDataUri, ...items.map((i) => i.dataUri)];
  } else {
    const fluxRefs = items.map((_, idx) => `@image${idx + 2}`).join(', ');
    prompt = `Professional fashion photography of the woman from @image1 wearing the outfit items from ${fluxRefs}. Preserve 100% of identity, hair, and proportions. Accurate layering, texture, and fit without hangers. ${scenePrompt} Ultra-sharp commercial photography.`;
    imageUrls = [modelDataUri, ...items.map((i) => i.dataUri)];
  }

  const result = await fal.subscribe('fal-ai/flux-2-max/edit', {
    input: {
      prompt,
      image_urls: imageUrls,
      aspect_ratio: '3:4',
    } as any,
    logs: false,
  });

  const data = result.data as { images?: { url: string }[]; image?: { url: string } };
  const generatedUrl = data?.images?.[0]?.url || data?.image?.url;

  if (!generatedUrl) {
    throw new Error('Fal.ai FLUX.2 Max no devolvió ninguna URL de imagen válida para el Look Completo.');
  }

  return generatedUrl;
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
  requestedModel = 'gemini-3.6-flash',
  isOutfit = false,
  secondaryGarmentBase64Raw?: string,
  isLookCompleto = false,
  lookItems?: LookItem[]
): Promise<GeneratedMetadata> {
  const safeStoreName = storeName || 'Boutique Rota';
  const safeSizesStr = sizes.length > 0 ? sizes.join(', ') : 'S, M, L';
  const formattedPrice = price.toFixed(2);

  // Fallback simulator for offline / no coverage
  const getSimulatedMetadata = (): GeneratedMetadata => {
    if (isLookCompleto) {
      const title = 'Look Completo Editorial: Americana, Top, Pantalón y Complementos';
      const handle = 'look-completo-editorial-americana-pantalon';
      return {
        title,
        handle,
        descriptionHtml: `<p>Descubre este <strong>Look Completo de inspiración editorial</strong> de <strong>${safeStoreName}</strong>. Un estilismo coordinado diseñado para lucir impecable en cualquier ocasión, combinando prenda exterior estructurada, top favorecedor, pantalón de corte sastre y complementos perfectamente afinados.</p><ul><li><strong>Estilismo completo:</strong> Americana de corte refinado, top de tejido suave, pantalón de caída estilizada y accesorio a juego.</li><li><strong>Cómo llevarlo:</strong> Luce el total look para un impacto visual sofisticado o combina cada pieza por separado para multiplicar las opciones de tu armario.</li><li><strong>Confección y detalle:</strong> Tejidos premium seleccionados para ofrecer comodidad, caída fluida y un porte distinguido.</li></ul>`,
        tags: ['look completo', 'total look', 'estilismo', 'americana', 'pantalon', 'nueva coleccion', 'moda mujer'],
        instagramCaption: `Look Completo en ${safeStoreName}.\n\nUn estilismo integral de inspiración editorial que combina americana, top, pantalón y accesorios para crear un conjunto sofisticado y versátil.\n\nTallas disponibles: ${safeSizesStr}\nPrecio del look completo: ${formattedPrice}€\n\nReserva el look completo o consulta piezas sueltas enviándonos un mensaje directo o por WhatsApp.\n\n#LookCompleto #TotalLook #Estilismo #${safeStoreName.replace(/\s+/g, '')} #NuevaColeccion #ModaMujer #OOTD`,
      };
    }

    if (isOutfit) {
      const title = 'Conjunto Dos Piezas Americana y Pantalón';
      const handle = 'conjunto-dos-piezas-americana-pantalon';
      return {
        title,
        handle,
        descriptionHtml: `<p>Luce un <strong>Total Look coordinado</strong> de <strong>${safeStoreName}</strong>. Este conjunto de dos piezas combina prenda superior e inferior en armonía perfecta, confeccionado con tejidos ligeros y corte favorecedor para estilizar tu figura.</p><ul><li><strong>Piezas incluidas:</strong> Prenda superior fluida y prenda inferior con caída impecable.</li><li><strong>Versatilidad:</strong> Llévalas juntas para un estilo sofisticado de ocasión o combínalas por separado con prendas básicas para el día a día.</li><li><strong>Cuidado y acabado:</strong> Confección de alta calidad resistente a arrugas y de tacto suave.</li></ul>`,
        tags: ['conjunto', 'total look', 'dos piezas', 'nueva coleccion', 'moda mujer', 'boutique'],
        instagramCaption: `Total Look en ${safeStoreName}.\n\nDescubre este conjunto de 2 piezas diseñado para deslumbrar. Puedes lucirlo como look coordinado para tus eventos o combinar cada prenda por separado para multiplicar las opciones de tu armario.\n\nTallas disponibles: ${safeSizesStr}\nPrecio del conjunto completo: ${formattedPrice}€\n\nReserva tu talla enviándonos un mensaje directo o por WhatsApp.\n\n#TotalLook #Conjunto #${safeStoreName.replace(/\s+/g, '')} #NuevaColeccion #ModaMujer #OOTD`,
      };
    }

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

  const lookItemsSummary = lookItems && lookItems.length > 0
    ? lookItems.map((it, idx) => `Pieza ${idx + 1}: ${it.label} (${it.category})`).join(', ')
    : 'Americana, top, pantalón y accesorios';

  const prompt = isLookCompleto
    ? `Eres un redactor experto en moda y e-commerce de alta conversión para boutiques de ropa en España.
Analiza las fotos adjuntas que componen este LOOK COMPLETO / ESTILISMO EDITORIAL INTEGRAL (${lookItemsSummary}).
Detalles comerciales de la tienda:
- Nombre de la boutique: "${safeStoreName}"
- Precio del look completo: ${formattedPrice}€
- Tallas disponibles para la venta: ${safeSizesStr}

REGLA ESTRICTA DE ESTILO: NUNCA utilices emoticonos ni emojis de ningún tipo en ninguna parte del texto generado (ni en el título, ni en la descripción, ni en el post de Instagram).

Genera un objeto JSON EXACTO con las siguientes claves:
1. "title": Nombre comercial editorial atractivo en español que identifique el look completo y sus piezas clave (ej. "Look Completo: Blazer Sastre, Camiseta Minimal, Pantalón Recto y Bolso").
2. "handle": Slug SEO amigable sin tildes ni espacios (ej. "look-completo-blazer-camiseta-pantalon-bolso").
3. "descriptionHtml": Descripción comercial persuasiva en HTML utilizando párrafos (<p>) y lista de viñetas (<ul><li>) destacando la armonía del conjunto completo, los detalles de cada prenda, consejos de estilismo sobre cómo lucirlo y versatilidad para llevar las prendas juntas o por separado.
4. "tags": Array con 6 etiquetas en minúsculas para buscador de tienda online (ej. ["look completo", "total look", "estilismo", "blazer", "pantalon", "boutique"]).
5. "instagramCaption": Texto profesional y elegante para Instagram y Estados de WhatsApp sin emoticonos, describiendo las prendas que componen el look, mencionando las tallas (${safeSizesStr}), el precio del look completo (${formattedPrice}€), la tienda "${safeStoreName}" y una llamada clara a reservar por WhatsApp o mensaje directo.`
    : isOutfit
    ? `Eres un redactor experto en moda y e-commerce de alta conversión para boutiques de ropa en España.
Analiza las fotos adjuntas de este CONJUNTO / TOTAL LOOK DE 2 PIEZAS (foto 1: parte superior, foto 2: parte inferior).
Detalles comerciales de la tienda:
- Nombre de la boutique: "${safeStoreName}"
- Precio del conjunto completo: ${formattedPrice}€
- Tallas disponibles para la venta: ${safeSizesStr}

REGLA ESTRICTA DE ESTILO: NUNCA utilices emoticonos ni emojis de ningún tipo en ninguna parte del texto generado (ni en el título, ni en la descripción, ni en el post de Instagram).

Genera un objeto JSON EXACTO con las siguientes claves:
1. "title": Nombre comercial atractivo que indique que es un conjunto o dos piezas en español (ej. "Conjunto Dos Piezas Americana Fluida y Pantalón Recto").
2. "handle": Slug SEO amigable sin tildes ni espacios (ej. "conjunto-dos-piezas-americana-pantalon").
3. "descriptionHtml": Descripción comercial persuasiva en HTML utilizando párrafos (<p>) y lista de viñetas (<ul><li>) destacando el conjunto coordinado, la caída de ambas piezas y cómo combinarlas juntas o por separado.
4. "tags": Array con 5 etiquetas en minúsculas para buscador de tienda online (ej. ["conjunto", "total look", "dos piezas", "nueva coleccion", "boutique"]).
5. "instagramCaption": Texto profesional y elegante para Instagram y Estados de WhatsApp sin emoticonos, mencionando las tallas (${safeSizesStr}), el precio (${formattedPrice}€), la tienda "${safeStoreName}" y una llamada clara a reservar por WhatsApp o mensaje directo.`
    : `Eres un redactor experto en moda y e-commerce de alta conversión para boutiques de ropa en España.
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

      const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

      if (isLookCompleto && lookItems && lookItems.length > 0) {
        for (const item of lookItems) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: item.base64Raw,
            },
          });
        }
      } else {
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: garmentBase64Raw,
          },
        });

        if (isOutfit && secondaryGarmentBase64Raw) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: secondaryGarmentBase64Raw,
            },
          });
        }
      }

      parts.push({ text: prompt });

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
                parts,
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
        title:
          parsed.title ||
          (isLookCompleto
            ? 'Look Completo Editorial'
            : isOutfit
            ? 'Conjunto Dos Piezas de Temporada'
            : 'Prenda de Temporada'),
        handle:
          parsed.handle ||
          (isLookCompleto
            ? 'look-completo-'
            : isOutfit
            ? 'conjunto-dos-piezas-'
            : 'prenda-de-temporada-') + Math.floor(Math.random() * 1000),
        descriptionHtml:
          parsed.descriptionHtml ||
          `<p>Diseño exclusivo disponible en <strong>${safeStoreName}</strong>.</p>`,
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
 * Replaces the background of the try-on image using fal-ai/bria/background/replace.
 * Preserves the model and garment with realistic lighting.
 */
export async function replaceImageBackground(
  imageUrl: string,
  backgroundType: BackgroundType,
  customBackgroundUri: string | undefined,
  falKey: string,
  simulationMode = false
): Promise<string> {
  if (backgroundType === 'original' || !backgroundType) {
    return imageUrl;
  }

  if (simulationMode) {
    await new Promise((res) => setTimeout(res, 1800));
    return imageUrl;
  }

  if (!falKey || falKey.trim() === '') {
    return imageUrl;
  }

  try {
    fal.config({ credentials: falKey.trim() });

    const backgroundPrompts: Record<string, string> = {
      beach: 'Sunny tropical beach with golden sand, soft ocean waves, warm summer sunlight, elegant depth of field',
      studio: 'Minimalist luxury fashion photography studio, clean warm off-white seamless wall, diffuse soft lighting',
      urban: 'Chic European city street, elegant boutique stone facade, blurred outdoor cafe terrace, natural daylight',
      garden: 'Lush Mediterranean garden terrace with olive trees and stone wall, soft warm natural afternoon lighting',
    };

    const inputPayload: Record<string, unknown> = {
      image_url: imageUrl,
      fast: true,
      refine_prompt: true,
    };

    if (backgroundType === 'custom' && customBackgroundUri) {
      inputPayload.ref_image_url = customBackgroundUri;
    } else {
      inputPayload.prompt = backgroundPrompts[backgroundType] || backgroundPrompts.studio;
    }

    const result = await fal.subscribe('fal-ai/bria/background/replace', {
      input: inputPayload as any,
      logs: false,
    });

    const data = result.data as { images?: { url: string }[]; image?: { url: string } };
    const finalUrl = data?.image?.url || data?.images?.[0]?.url;

    return finalUrl || imageUrl;
  } catch (err) {
    console.warn('No se pudo reemplazar el fondo, conservando foto original con fondo de la modelo:', err);
    return imageUrl;
  }
}

/**
 * Orchestrates Parallel Processing with Promise.all and optional background replacement
 */
export async function executeLiveTryOnAndCatalog(
  params: TryOnParams
): Promise<CatalogProduct> {
  const {
    modelDataUri = '',
    garmentDataUri,
    garmentBase64Raw,
    secondaryGarmentDataUri,
    secondaryGarmentBase64Raw,
    isOutfit,
    isLookCompleto,
    lookItems = [],
    category,
    engine = 'nano-banana-pro',
    sceneStyle = 'boutique',
    price,
    sizes,
    storeName,
    falKey,
    geminiKey,
    simulationMode = false,
    modelMode = 'real',
    editorialRepose = true,
    virtualModel = 'mediterranean',
    onStageChange,
  } = params;

  // Try-on execution (Look Completo multi-prenda, cascade if 2-piece outfit, or single garment)
  const tryOnPromise = (async () => {
    if (isLookCompleto && lookItems && lookItems.length > 0) {
      onStageChange?.('adjusting_look_completo');
      return runLookCompletoTryOn({
        modelDataUri,
        items: lookItems,
        falKey,
        engine,
        sceneStyle,
        simulationMode,
        modelMode,
        editorialRepose,
        virtualModel,
      });
    } else if (isOutfit && secondaryGarmentDataUri) {
      // Paso 1: Viste la prenda superior
      onStageChange?.('adjusting_garment_top');
      const topResultUrl = await runVirtualTryOn(
        modelDataUri,
        garmentDataUri,
        'tops',
        falKey,
        engine,
        sceneStyle,
        simulationMode,
        modelMode,
        editorialRepose,
        virtualModel
      );

      // Paso 2: Viste la prenda inferior sobre el resultado de la parte de arriba
      onStageChange?.('adjusting_garment_bottom');
      const fullOutfitUrl = await runVirtualTryOn(
        topResultUrl,
        secondaryGarmentDataUri,
        'bottoms',
        falKey,
        engine,
        sceneStyle,
        simulationMode,
        'real',
        false, // conservar postura generada en el paso 1
        virtualModel
      );

      return fullOutfitUrl;
    } else {
      onStageChange?.('adjusting_garment');
      return runVirtualTryOn(
        modelDataUri,
        garmentDataUri,
        category,
        falKey,
        engine,
        sceneStyle,
        simulationMode,
        modelMode,
        editorialRepose,
        virtualModel
      );
    }
  })();

  // Redacción publicitaria en paralelo
  const metadataPromise = (async () => {
    onStageChange?.('generating_copy');
    return generateProductMetadata(
      garmentBase64Raw,
      price,
      sizes,
      storeName,
      category,
      geminiKey,
      simulationMode,
      params.geminiModel,
      isOutfit,
      secondaryGarmentBase64Raw,
      isLookCompleto,
      lookItems
    );
  })();

  const [initialImageUrl, metadata] = await Promise.all([tryOnPromise, metadataPromise]);

  // Optional background replacement stage
  let resultImageUrl = initialImageUrl;
  if (params.backgroundType && params.backgroundType !== 'original') {
    onStageChange?.('replacing_background');
    resultImageUrl = await replaceImageBackground(
      initialImageUrl,
      params.backgroundType,
      params.customBackgroundBase64,
      falKey,
      simulationMode
    );
  }

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
    vendor: storeName || 'ALBA MARTÍN',
    productCategory: isLookCompleto || isOutfit ? 'one-pieces' : category,
    backgroundType: params.backgroundType || 'original',
    isOutfit: Boolean(isOutfit || isLookCompleto),
    isLookCompleto: Boolean(isLookCompleto),
    lookItems: isLookCompleto ? lookItems : undefined,
    modelMode,
    editorialRepose,
    virtualModel,
    tags: metadata.tags,
    price,
    sizes,
    skuPrefix: prefix,
    modelPhotoBase64: modelMode === 'virtual' || !modelDataUri ? (lookItems[0]?.dataUri || garmentDataUri) : modelDataUri,
    garmentPhotoBase64: lookItems[0]?.dataUri || garmentDataUri,
    secondaryGarmentPhotoBase64: lookItems[1]?.dataUri || secondaryGarmentDataUri,
    resultImageUrl,
    instagramCaption: metadata.instagramCaption,
  };

  return product;
}
