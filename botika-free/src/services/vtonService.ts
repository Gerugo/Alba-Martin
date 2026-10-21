import { Client } from '@gradio/client';
import {
  AIModelProfile,
  GarmentData,
  ScenePreset,
  FreeEngineType,
} from '../types/fashion';
import { PRESET_SCENES } from './modelPresets';
import { dataUriToBlob } from '../utils/imageUtils';

export interface VTONExecutionParams {
  model: AIModelProfile;
  customModelDataUri?: string;
  garment: GarmentData;
  scene: ScenePreset;
  engine: FreeEngineType;
  hfSpaceEndpoint?: string;
  colabTunnelUrl?: string;
  onStepProgress?: (step: string, percent: number) => void;
}

export interface VTONExecutionResult {
  heroUrl: string;
  sideUrl?: string;
  detailUrl?: string;
  durationMs: number;
}

/**
 * Executes Virtual Try-On using 100% Free AI Infrastructures:
 * 1. Hugging Face Gradio Client (Public IDM-VTON or CatVTON Spaces)
 * 2. Self-hosted Google Colab Free GPU T4 Backend
 * 3. Instant local simulation
 */
export async function executeFreeTryOn(
  params: VTONExecutionParams
): Promise<VTONExecutionResult> {
  const startTime = Date.now();
  const {
    model,
    customModelDataUri,
    garment,
    scene,
    engine,
    hfSpaceEndpoint = 'yisol/IDM-VTON',
    colabTunnelUrl,
    onStepProgress,
  } = params;

  const modelImageSource = customModelDataUri || model.fullBodyUrl;
  const sceneConfig = PRESET_SCENES.find((s) => s.id === scene) || PRESET_SCENES[0];

  // --------------------------------------------------------------------------
  // ENGINE 1: SIMULATION MODE (Fast testing without network or GPU)
  // --------------------------------------------------------------------------
  if (engine === 'simulation') {
    onStepProgress?.('1/4 Segmentando prenda y eliminando percha...', 25);
    await new Promise((r) => setTimeout(r, 700));

    onStepProgress?.('2/4 Mapeando silueta y puntos corporales del modelo...', 50);
    await new Promise((r) => setTimeout(r, 800));

    onStepProgress?.('3/4 Difusión neuronal: adaptando tejido y pliegues...', 75);
    await new Promise((r) => setTimeout(r, 900));

    onStepProgress?.('4/4 Renderizando iluminación de estudio y pack editorial...', 95);
    await new Promise((r) => setTimeout(r, 600));

    return {
      heroUrl: modelImageSource,
      sideUrl: model.avatarUrl,
      detailUrl: garment.dataUri,
      durationMs: Date.now() - startTime,
    };
  }

  // --------------------------------------------------------------------------
  // ENGINE 2: GOOGLE COLAB FREE GPU T4 BACKEND (Cloudflare Tunnel)
  // --------------------------------------------------------------------------
  if (engine === 'colab-tunnel') {
    if (!colabTunnelUrl || !colabTunnelUrl.trim().startsWith('http')) {
      throw new Error(
        'Debes ingresar la URL pública de tu Google Colab (ej: https://xyz.trycloudflare.com) en los Ajustes.'
      );
    }

    const cleanBaseUrl = colabTunnelUrl.trim().replace(/\/$/, '');

    onStepProgress?.('Conectando con tu servidor GPU en Google Colab...', 20);

    const payload = {
      model_image: modelImageSource,
      garment_image: garment.dataUri,
      category: garment.category,
      scene_prompt: sceneConfig.promptDescription,
      model_ethnicity: model.ethnicity,
    };

    onStepProgress?.('Procesando difusión en GPU T4 de Google Colab...', 55);

    const response = await fetch(`${cleanBaseUrl}/api/tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Error en servidor Colab (${response.status}): ${errText}`);
    }

    onStepProgress?.('Descargando resultados de alta fidelidad...', 90);
    const data = await response.json();

    return {
      heroUrl: data.hero_url || data.result_url,
      sideUrl: data.side_url,
      detailUrl: data.detail_url,
      durationMs: Date.now() - startTime,
    };
  }

  // --------------------------------------------------------------------------
  // ENGINE 3: HUGGING FACE SPACES (GRADIO CLIENT - 100% FREE CLOUD API)
  // --------------------------------------------------------------------------
  if (engine === 'hf-gradio') {
    onStepProgress?.('1/4 Conectando con Hugging Face Space (IDM-VTON)...', 20);

    try {
      const client = await Client.connect(hfSpaceEndpoint);

      onStepProgress?.('2/4 Transfiriendo imagen de prenda y modelo...', 45);

      // Prepare garment blob
      const garmentBlob = dataUriToBlob(garment.dataUri);

      // Prepare human image blob
      let modelBlob: Blob;
      if (modelImageSource.startsWith('data:')) {
        modelBlob = dataUriToBlob(modelImageSource);
      } else {
        const fetchRes = await fetch(modelImageSource);
        modelBlob = await fetchRes.blob();
      }

      onStepProgress?.('3/4 Inferencia VTON en Hugging Face GPU...', 70);

      // Call predict endpoint on IDM-VTON Space
      // Standard IDM-VTON gradio schema:
      // fn_index: 0 or endpoint /tryon
      const result = await client.predict('/tryon', {
        dict: {
          background: modelBlob,
          layers: [],
          composite: modelBlob,
        },
        garm_img: garmentBlob,
        garment_des: `${garment.category} fashion apparel piece`,
        is_checked: true,
        is_checked_crop: false,
        denoise_steps: 30,
        seed: 42,
      });

      onStepProgress?.('4/4 Decodificando resultado editorial...', 95);

      const resultData = result.data as any[];
      // Gradio result usually returns [output_image_url, ...]
      const outputImageUrl =
        resultData?.[0]?.url ||
        resultData?.[0]?.path ||
        (typeof resultData?.[0] === 'string' ? resultData[0] : null);

      if (!outputImageUrl) {
        throw new Error('Hugging Face Space no retornó una imagen válida');
      }

      return {
        heroUrl: outputImageUrl,
        sideUrl: model.avatarUrl,
        detailUrl: garment.dataUri,
        durationMs: Date.now() - startTime,
      };
    } catch (err: unknown) {
      console.warn('Fallo al invocar Hugging Face Space directamente:', err);
      // If HF Space queue is busy or blocked by CORS, fallback gracefully with explanation
      throw new Error(
        `El espacio público de Hugging Face (${hfSpaceEndpoint}) tardó demasiado o está saturado de peticiones. Tip: Puedes usar tu propio Colab gratuito ilimitado desde la pestaña de Ajustes.`
      );
    }
  }

  throw new Error(`Motor desconocido: ${engine}`);
}
