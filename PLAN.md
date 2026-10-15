# PLAN.md - Demo en Vivo: Probador IA con Modelo Real + Generador de Catálogo (Shopify / PrestaShop)

## Contexto y Objetivo del Proyecto
Construir una aplicación web Mobile-First en **React + TypeScript + Vite + Tailwind CSS + Lucide React** diseñada para ejecutarse desde el navegador del móvil en una demostración presencial dentro de una tienda de ropa.

El flujo en vivo consta de 3 pasos en el mismo teléfono:
1. **Capturar con la cámara a la dueña/dependienta en la tienda** (`model_image`).
2. **Capturar con la cámara una prenda colgada en percha en la tienda** (`garment_image`) e indicar precio y tallas.
3. **Procesar en paralelo con IA**:
   - **Virtual Try-On (`fal-ai/fashn/tryon/v1.5`)**: Viste a la dueña/dependienta con la prenda manteniendo intactos su rostro, peinado, postura y el fondo de la tienda.
   - **Generador de Catálogo y Copy (`Gemini 2.5 Flash`)**: Analiza la foto de la prenda y genera automáticamente el Título SEO, Handle/Slug, Descripción HTML comercial, Etiquetas, SKUs por talla y el texto con emojis para Instagram/WhatsApp.
   - **Guardado en Base de Datos Local (`localStorage`)**: Acumula cada prenda generada durante la demo y permite exportarla al instante en un archivo `.CSV` 100% compatible con **Shopify** y otro `.CSV` compatible con **PrestaShop**, además de mostrar un mini-escaparate con botón de **"Reservar talla por WhatsApp"**.

---

## Reglas Técnicas Críticas para el Agente (Gemini 3.8 High)
1. **Compresión de Cámara Obligatoria**: Las fotos tomadas con `<input type="file" accept="image/*" capture="environment">` pesan entre 5MB y 12MB. NUNCA envíes el archivo crudo a las APIs. Crea una utilidad `compressImageToDataUri(file, maxWidth = 864, maxHeight = 1296, quality = 0.85)` usando `<canvas>` que devuelva un `data:image/jpeg;base64,...` ligero (< 250KB) y corrija la orientación vertical.
2. **Configuración de API Keys desde la UI (y `.env`)**: Permite leer `VITE_FAL_KEY` y `VITE_GEMINI_API_KEY` desde `.env`, pero añade un modal de **"Ajustes de Demo"** (icono de engranaje arriba a la derecha) donde se puedan pegar/editar en vivo:
   - `Fal.ai API Key`
   - `Gemini API Key`
   - `Nombre de la Tienda` (ej. "Boutique Rota")
   - `Teléfono de WhatsApp de la Tienda` (ej. "34600000000")
   - `Modo Simulación (Fallback)`: Interruptor por si falla la cobertura 4G dentro del local.
3. **Diseño Visual**: Estética limpia de estudio de moda (tonos crema/blanco roto, botones negro azabache y acentos esmeralda para acciones de éxito/WhatsApp). Botones grandes pensados para pulsar con el pulgar de pie en la tienda.

---

## FASE 1: Inicialización, Estructura de Datos y Compresor de Cámara
**Objetivo:** Crear el proyecto base, las interfaces de catálogo y el compresor de fotos para móvil.

1. Inicializar proyecto Vite con React, TypeScript, Tailwind CSS y `lucide-react`. Instalar `@fal-ai/client`.
2. Crear `src/types/catalog.ts` con la interfaz `CatalogProduct`:
   - `id`: string
   - `createdAt`: string
   - `title`: string
   - `handle`: string
   - `descriptionHtml`: string
   - `vendor`: string
   - `productCategory`: `'tops' | 'bottoms' | 'one-pieces' | 'auto'`
   - `tags`: string[]
   - `price`: number
   - `sizes`: string[] (ej. `['S', 'M', 'L']`)
   - `skuPrefix`: string (ej. `'ROT-001'`)
   - `modelPhotoBase64`: string (foto original de la dueña/dependienta)
   - `garmentPhotoBase64`: string (foto original de la prenda en percha)
   - `resultImageUrl`: string (URL o Base64 devuelto por Fal.ai con la dueña vistiendo la prenda)
   - `instagramCaption`: string (texto persuasivo con emojis y hashtags locales)
3. Crear `src/utils/imageCompressor.ts`:
   - Función `compressImage(file: File): Promise<{ dataUri: string; base64Raw: string; mimeType: string }>`.
   - Redimensionar proporcionalmente hasta máximo `864x1296` px y exportar en `image/jpeg` con calidad `0.85`.
4. **Verificación de Fase 1:** Comprobar que el proyecto compila con `npm run build` sin errores de tipos.

---

## FASE 2: Asistente de Captura en Vivo en 3 Pasos (UI Mobile-First)
**Objetivo:** Construir la pantalla principal con pestañas claras para hacer la foto a la persona y a la prenda en menos de 30 segundos.

1. Crear `src/components/LiveCaptureWizard.tsx` dividido en 3 tarjetas visuales:
   - **PASO 1: Foto de la Modelo (Dueña / Dependienta)**
     - Botón principal grande: `"Hacer foto a la modelo ahora"` (`accept="image/*" capture="environment"`) y botón secundario `"Elegir de la galería"`.
     - Guía visual sobreimpresa: *"Encuadra de rodillas/cintura hacia arriba, mirando al frente, brazos relajados a los lados y ropa base ajustada"*.
     - Opción de **"Guardar como modelo habitual"**: Guarda la foto comprimida en `localStorage` para no tener que repetir la foto de la dueña si probáis una segunda o tercera prenda seguida.
   - **PASO 2: Foto de la Prenda en Percha + Datos Básicos**
     - Botón grande: `"Hacer foto a la prenda en percha"` (`accept="image/*" capture="environment"`).
     - Selector rápido de tipo de prenda mediante chips táctiles:
       - `Automático` (`auto`)
       - `Parte de arriba / Chaqueta` (`tops`)
       - `Pantalón / Falda` (`bottoms`)
       - `Vestido / Cuerpo entero` (`one-pieces`)
     - Inputs rápidos en una sola fila:
       - `Precio (€)` (numérico, por defecto `29.95`).
       - Selector múltiple de `Tallas` con botones táctiles (`XS`, `S`, `M`, `L`, `XL`, `Única` — por defecto `S, M, L` activas).
   - **PASO 3: Botón de Acción Principal**
     - Botón fijo inferior: `"Vestir Modelo + Crear Ficha IA"` con estados de carga detallados (*"1/2 Ajustando prenda al cuerpo de la modelo..."*, *"2/2 Redactando ficha SEO y post para Instagram..."*).
2. **Verificación de Fase 2:** Verificar que al seleccionar imágenes se muestra la previsualización instantánea con el tamaño en KB ya reducido.

---

## FASE 3: Integración Real con Fal.ai (FASHN v1.5) y Gemini API
**Objetivo:** Conectar la generación de imagen Virtual Try-On y la redacción de metadatos de e-commerce.

1. Crear `src/services/aiService.ts`:
   - **Función `runVirtualTryOn(modelDataUri, garmentDataUri, category, falKey)`**:
     - Configurar `fal.config({ credentials: falKey })`.
     - Llamar a `await fal.subscribe("fal-ai/fashn/tryon/v1.5", { input: { model_image: modelDataUri, garment_image: garmentDataUri, category, mode: "balanced", garment_photo_type: "flat-lay", moderation_level: "permissive", output_format: "jpeg" } })`.
     - Extraer y devolver la URL de la imagen generada (`result.data.images[0].url`).
   - **Función `generateProductMetadata(garmentBase64Raw, price, sizes, storeName, geminiKey)`**:
     - Llamar por `fetch` a `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}` enviando la imagen de la prenda en `inlineData` y pidiendo respuesta en `application/json` con:
       - `title`: Nombre comercial atractivo de la prenda en español.
       - `handle`: Slug amigable sin tildes ni espacios.
       - `descriptionHtml`: Descripción persuasiva en HTML (`<p>` y `<ul><li>`) destacando estilo, corte y cómo combinarla.
       - `tags`: Array de 5 etiquetas para tienda online.
       - `instagramCaption`: Post entusiasta para Instagram/Estados de WhatsApp presentando la novedad en `${storeName}`, mencionando tallas (`${sizes.join(', ')}`), precio (`${price}€`) y animando a reservar por mensaje o WhatsApp.
   - **Ejecución en Paralelo**: Usar `Promise.all([runVirtualTryOn(...), generateProductMetadata(...)])` para que todo el proceso tarde solo los ~12 segundos que tarda la imagen.
2. **Verificación de Fase 3:** Asegurar manejo de errores claro en pantalla si falta alguna API Key o falla la red, e incluir el modo simulación por si no hay cobertura en el local.

---

## FASE 4: Pantalla de Resultado "Efecto WOW", Escaparate WhatsApp y Exportador CSV (Shopify / PrestaShop)
**Objetivo:** Mostrar el resultado comparativo y demostrar cómo esa foto ya es un producto listo para vender y exportar.

1. Crear `src/components/ResultShowcase.tsx`:
   - Comparador visual **Antes (Foto en percha) / Después (Dueña vistiendo la prenda)**.
   - Botón `"Descargar Foto HD para Instagram / Estados"`.
   - Caja editable con el **Copy de Instagram** y botón `"Copiar Texto"` con confirmación visual.
   - Vista previa de la **Ficha Técnica generada** (Título SEO, SKUs generados por talla `ROT-001-S`, `ROT-001-M`..., Descripción HTML).
   - Botón verde destacado: `"Probar Reserva real por WhatsApp"`. Al pulsarlo, abre `https://wa.me/${storePhone}?text=...` con el mensaje: *"¡Hola ${storeName}! Acabo de ver en el catálogo el nuevo ${title} (${price}€) y quería reservar la talla M"*.
2. Crear `src/utils/csvExporter.ts` y la pestaña `"Catálogo Guardado (${count})"`:
   - **Botón `"Exportar CSV Shopify"`**: Genera y descarga un archivo `.csv` con las cabeceras oficiales de Shopify (`Handle,Title,Body (HTML),Vendor,Product Category,Type,Tags,Published,Option1 Name,Option1 Value,Variant SKU,Variant Inventory Qty,Variant Price,Image Src,Status`), creando una fila por cada talla seleccionada.
   - **Botón `"Exportar CSV PrestaShop"`**: Genera y descarga un archivo `.csv` separado por `;` con las cabeceras oficiales de importación de PrestaShop (`ID;Activo (0/1);Nombre;Categorías;Precio impuestos incluidos;Referencia №;Resumen;Descripción;Etiquetas;URLs de las imágenes (x,y,z...)`).
3. **Verificación de Fase 4:** Comprobar que los archivos CSV se descargan correctamente con codificación UTF-8 con BOM (`\uFEFF`) para que Excel y PrestaShop respeten todas las tildes y el símbolo `€`.
