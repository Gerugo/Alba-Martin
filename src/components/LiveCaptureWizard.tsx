import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Camera,
  Upload,
  User,
  ShoppingBag,
  Sparkles,
  Check,
  RefreshCw,
  Layers,
  Euro,
  BookmarkCheck,
  Trash2,
  AlertCircle,
  Sun,
  X,
  Store,
  Building2,
  Sliders,
  Crown
} from 'lucide-react';
import {
  ProductCategory,
  BackgroundType,
  CompressedImageResult,
  TryOnEngine,
  SceneStyle,
  ModelMode,
  VirtualModelProfile
} from '../types/catalog';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import { loadSavedModel, saveModelToStorage, removeSavedModel } from '../services/settingsStorage';
import { TryOnStage } from '../services/aiService';

export interface ProcessPayload {
  modelImage?: CompressedImageResult | null;
  garmentImage: CompressedImageResult;
  secondaryGarmentImage?: CompressedImageResult | null;
  isOutfit: boolean;
  category: ProductCategory;
  price: number;
  sizes: string[];
  engine: TryOnEngine;
  sceneStyle: SceneStyle;
  backgroundType: BackgroundType;
  customBackgroundImage?: CompressedImageResult | null;
  modelMode: ModelMode;
  editorialRepose: boolean;
  virtualModel: VirtualModelProfile;
}

interface LiveCaptureWizardProps {
  onProcess: (payload: ProcessPayload) => void;
  isProcessing: boolean;
  processingStage?: TryOnStage;
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Única'];

const CATEGORY_OPTIONS: { id: ProductCategory; label: string }[] = [
  { id: 'auto', label: 'Detección automática' },
  { id: 'tops', label: 'Parte superior / Chaqueta' },
  { id: 'bottoms', label: 'Pantalón / Falda' },
  { id: 'one-pieces', label: 'Vestido / Cuerpo entero' },
];

const ENGINE_OPTIONS: { id: TryOnEngine; label: string; badge: string; desc: string }[] = [
  {
    id: 'nano-banana-pro',
    label: 'Nano Banana Pro 2K (Calidad Editorial Estudio - Recomendado)',
    badge: '2K Editorial',
    desc: 'Máxima resolución y nitidez en estampados, rostro natural y caída hiperrealista.',
  },
  {
    id: 'flux-2-max',
    label: 'FLUX.2 Max HD (Fotografía Realista)',
    badge: 'HD Realista',
    desc: 'Textura fotográfica fotorrealista con iluminación comercial.',
  },
  {
    id: 'fashn-v16',
    label: 'FASHN v1.6 Quality (Solo cambio de prenda)',
    badge: 'Clásico',
    desc: 'Mapeo directo de prenda sobre la postura exacta de la modelo.',
  },
];

const SCENE_STYLE_OPTIONS: { id: SceneStyle; label: string; desc: string; icon: typeof Store }[] = [
  {
    id: 'boutique',
    label: 'Boutique Luminosa',
    desc: 'Interior moderno, luz natural suave y fondo cálido desenfocado.',
    icon: Store,
  },
  {
    id: 'studio',
    label: 'Estudio Editorial Zara',
    desc: 'Ciclorama marfil neutro y luz suave de estudio comercial.',
    icon: Building2,
  },
  {
    id: 'street',
    label: 'Calle Blanca Andaluza',
    desc: 'Exterior soleado, luz dorada mediterránea y encanto urbano.',
    icon: Sun,
  },
  {
    id: 'original',
    label: 'Fondo Original Optimizado',
    desc: 'Conserva el entorno original de la modelo con luz perfeccionada.',
    icon: Sparkles,
  },
];

const VIRTUAL_MODELS: {
  id: VirtualModelProfile;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
}[] = [
  {
    id: 'mediterranean',
    name: 'Sofía',
    tagline: 'Editorial Mediterránea',
    desc: 'Mujer española de 30 años, melena castaña ondulada, piel bronceada luminosa y porte elegante estilo Massimo Dutti.',
    badge: 'Massimo Dutti Chic',
  },
  {
    id: 'nordic-studio',
    name: 'Chloe',
    tagline: 'Minimal Studio Zara',
    desc: 'Modelo internacional de alta costura, 26 años, recogido desenfadado y facciones marcadas de pasarela editorial.',
    badge: 'Zara Studio',
  },
  {
    id: 'andalusian-chic',
    name: 'Lucía',
    tagline: 'Invitada & Boutique',
    desc: 'Mujer andaluza de 34 años, pelo oscuro brillante, sonrisa cálida y porte sofisticado de evento.',
    badge: 'Boutique & Invitada',
  },
];

const RUNWAY_MESSAGES = [
  'Analizando caída del tejido y estampado...',
  'Aplicando iluminación fotográfica en resolución 2K...',
  'Redactando copy comercial para Instagram y ficha SEO...',
];

export default function LiveCaptureWizard({
  onProcess,
  isProcessing,
  processingStage = 'idle',
}: LiveCaptureWizardProps) {
  // Model Mode & Profile state
  const [modelMode, setModelMode] = useState<ModelMode>('real');
  const [editorialRepose, setEditorialRepose] = useState<boolean>(true);
  const [virtualModel, setVirtualModel] = useState<VirtualModelProfile>('mediterranean');

  // Real Model state
  const [modelImage, setModelImage] = useState<CompressedImageResult | null>(null);
  const [saveAsDefaultModel, setSaveAsDefaultModel] = useState<boolean>(true);
  const [hasSavedModelOnDisk, setHasSavedModelOnDisk] = useState<boolean>(false);
  const [isCompressingModel, setIsCompressingModel] = useState<boolean>(false);

  // Garment & Outfit state
  const [isOutfit, setIsOutfit] = useState<boolean>(false);
  const [garmentImage, setGarmentImage] = useState<CompressedImageResult | null>(null);
  const [secondaryGarmentImage, setSecondaryGarmentImage] = useState<CompressedImageResult | null>(null);
  const [category, setCategory] = useState<ProductCategory>('auto');
  const [price, setPrice] = useState<number>(29.95);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [isCompressingGarment, setIsCompressingGarment] = useState<boolean>(false);
  const [isCompressingSecondary, setIsCompressingSecondary] = useState<boolean>(false);

  // Engine & Lighting Scene state
  const [engine, setEngine] = useState<TryOnEngine>('nano-banana-pro');
  const [sceneStyle, setSceneStyle] = useState<SceneStyle>('boutique');

  // Error alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic message index for AI Runway
  const [runwayMessageIndex, setRunwayMessageIndex] = useState<number>(0);

  // File input refs
  const modelCameraInputRef = useRef<HTMLInputElement>(null);
  const modelGalleryInputRef = useRef<HTMLInputElement>(null);
  const garmentCameraInputRef = useRef<HTMLInputElement>(null);
  const garmentGalleryInputRef = useRef<HTMLInputElement>(null);
  const secondaryCameraInputRef = useRef<HTMLInputElement>(null);
  const secondaryGalleryInputRef = useRef<HTMLInputElement>(null);

  // Load saved model from storage on mount
  useEffect(() => {
    const saved = loadSavedModel();
    if (saved) {
      setHasSavedModelOnDisk(true);
      setModelImage({
        dataUri: saved.dataUri,
        base64Raw: saved.dataUri.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, ''),
        mimeType: 'image/jpeg',
        fileSizeBytes: saved.fileSizeBytes || 180000,
        originalSizeBytes: saved.fileSizeBytes || 180000,
        width: 1280,
        height: 1920,
      });
    }
  }, []);

  // Cycle runway messages during processing
  useEffect(() => {
    if (!isProcessing) {
      setRunwayMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setRunwayMessageIndex((prev) => (prev + 1) % RUNWAY_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  // Handle Model Photo upload
  const handleModelFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsCompressingModel(true);
      const compressed = await compressImage(file);
      setModelImage(compressed);

      if (saveAsDefaultModel) {
        saveModelToStorage(compressed.dataUri, compressed.fileSizeBytes);
        setHasSavedModelOnDisk(true);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo procesar la foto de la modelo. Prueba con otra imagen.');
    } finally {
      setIsCompressingModel(false);
      e.target.value = '';
    }
  };

  // Handle Garment Photo upload
  const handleGarmentFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsCompressingGarment(true);
      const compressed = await compressImage(file);
      setGarmentImage(compressed);
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo procesar la foto de la prenda. Prueba con otra imagen.');
    } finally {
      setIsCompressingGarment(false);
      e.target.value = '';
    }
  };

  // Handle Secondary Garment Photo upload (for outfit bottom)
  const handleSecondaryGarmentFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsCompressingSecondary(true);
      const compressed = await compressImage(file);
      setSecondaryGarmentImage(compressed);
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo procesar la foto de la parte inferior. Prueba con otra imagen.');
    } finally {
      setIsCompressingSecondary(false);
      e.target.value = '';
    }
  };

  // Toggle size selection
  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      if (sizes.length > 1) {
        setSizes(sizes.filter((s) => s !== size));
      }
    } else {
      setSizes([...sizes, size]);
    }
  };

  // Clear or reuse saved model
  const handleUseSavedModel = () => {
    const saved = loadSavedModel();
    if (saved) {
      setModelImage({
        dataUri: saved.dataUri,
        base64Raw: saved.dataUri.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, ''),
        mimeType: 'image/jpeg',
        fileSizeBytes: saved.fileSizeBytes,
        originalSizeBytes: saved.fileSizeBytes,
        width: 1280,
        height: 1920,
      });
    }
  };

  const handleClearSavedModel = () => {
    removeSavedModel();
    setHasSavedModelOnDisk(false);
    setModelImage(null);
  };

  const handleAction = () => {
    if (modelMode === 'real' && !modelImage) {
      setErrorMessage('Por favor, añade o haz la foto a la modelo (Paso 01) o selecciona el modo Supermodelo Virtual IA.');
      return;
    }
    if (!garmentImage) {
      setErrorMessage(
        isOutfit
          ? 'Por favor, añade la foto de la parte superior (blusa, chaqueta, top).'
          : 'Por favor, añade o haz la foto a la prenda en percha (Paso 02).'
      );
      return;
    }
    if (isOutfit && !secondaryGarmentImage) {
      setErrorMessage('Por favor, añade la foto de la parte inferior del conjunto (pantalón, falda).');
      return;
    }
    setErrorMessage(null);
    onProcess({
      modelImage: modelMode === 'real' ? modelImage : null,
      garmentImage,
      secondaryGarmentImage,
      isOutfit,
      category: isOutfit ? 'one-pieces' : category,
      price: Number(price) || (isOutfit ? 59.95 : 29.95),
      sizes,
      engine,
      sceneStyle,
      backgroundType: 'original',
      customBackgroundImage: null,
      modelMode,
      editorialRepose,
      virtualModel,
    });
  };

  const canSubmit = Boolean(
    (modelMode === 'virtual' || modelImage) &&
    garmentImage &&
    (!isOutfit || secondaryGarmentImage) &&
    !isProcessing
  );

  const selectedVirtualProfile = VIRTUAL_MODELS.find((m) => m.id === virtualModel) || VIRTUAL_MODELS[0];

  return (
    <div className="space-y-6 pb-28">
      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-800 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 font-bold p-1 hover:bg-red-100 rounded-lg"
            aria-label="Cerrar error"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={modelCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleModelFileChange}
      />
      <input
        ref={modelGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleModelFileChange}
      />
      <input
        ref={garmentCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleGarmentFileChange}
      />
      <input
        ref={garmentGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGarmentFileChange}
      />
      <input
        ref={secondaryCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleSecondaryGarmentFileChange}
      />
      <input
        ref={secondaryGalleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleSecondaryGarmentFileChange}
      />

      {/* ======================================================== */}
      {/* SECCIÓN 01 / LA MODELO */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
              01 / LA MODELO
            </span>
            <h2 className="text-xl font-serif text-[#121110] font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-[#7A756D]" />
              La Modelo de Colección
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Persona real de la tienda o supermodelo virtual de alta costura
            </p>
          </div>

          {modelMode === 'virtual' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#121110] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#C5A059]/40">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              {selectedVirtualProfile.name}
            </span>
          ) : modelImage ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#121110] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#C5A059]/40">
              <Check className="w-3.5 h-3.5 text-[#C5A059] stroke-[2.5]" />
              Foto Lista
            </span>
          ) : null}
        </div>

        {/* SELECTOR SUPERIOR DE MODO: PERSONA REAL VS SUPERMODELO VIRTUAL */}
        <div className="bg-[#FAF7F2] p-1 rounded-2xl flex items-center border border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => setModelMode('real')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-1.5 ${
              modelMode === 'real'
                ? 'bg-[#121110] text-[#FAF7F2] shadow-sm'
                : 'text-[#7A756D] hover:text-[#121110]'
            }`}
          >
            <User className={`w-3.5 h-3.5 ${modelMode === 'real' ? 'text-[#C5A059]' : 'text-[#7A756D]'}`} />
            <span>Persona Real de la Tienda (Subir Foto)</span>
          </button>
          <button
            type="button"
            onClick={() => setModelMode('virtual')}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-center flex items-center justify-center gap-1.5 ${
              modelMode === 'virtual'
                ? 'bg-[#121110] text-[#FAF7F2] shadow-sm'
                : 'text-[#7A756D] hover:text-[#121110]'
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${modelMode === 'virtual' ? 'text-[#C5A059]' : 'text-[#7A756D]'}`} />
            <span>Supermodelo Virtual IA (Estilo Botika)</span>
          </button>
        </div>

        {/* ======================================================== */}
        {/* MODO A: PERSONA REAL DE LA TIENDA */}
        {/* ======================================================== */}
        {modelMode === 'real' && (
          <div className="space-y-4">
            {/* INTERRUPTOR: RE-POSADO EDITORIAL AUTOMÁTICO */}
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#C5A059]" />
                  <span className="text-xs font-bold text-[#121110] font-serif tracking-wide">
                    Re-Posado Editorial Automático (Estilo Revista)
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#121110] text-[#C5A059]">
                    Recomendado
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={editorialRepose}
                    onChange={(e) => setEditorialRepose(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121110]"></div>
                </label>
              </div>

              <p className="text-[11px] text-[#7A756D] leading-relaxed">
                {editorialRepose
                  ? 'La IA mantiene el 100% de la cara, identidad y peinado de la mujer de la foto, pero cambia su postura rígida por una pose dinámica de modelo profesional de moda (ligero giro de 3/4, una mano en el bolsillo o tocando sutilmente la solapa, porte estilizado de campaña de Zara/Massimo Dutti, iluminación de revista y retoque comercial).'
                  : 'Mantiene la postura original estática de la fotografía.'}
              </p>
            </div>

            {/* Model Display: Polaroid Frame vs Upload Controls */}
            {modelImage ? (
              <div className="space-y-3">
                {/* Polaroid Vertical Frame */}
                <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E8E2D9] shadow-sm">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-80 bg-stone-100 flex items-center justify-center">
                    <img
                      src={modelImage.dataUri}
                      alt="Modelo de colección"
                      className="w-full h-full object-cover"
                    />

                    {/* Floating 2K Resolution Tag */}
                    <div className="absolute top-2.5 left-2.5 backdrop-blur-md bg-[#121110]/80 border border-[#C5A059]/40 text-[#FAF7F2] px-2.5 py-1 rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                      <span>2K OPTIMIZADO · {formatBytes(modelImage.fileSizeBytes)}</span>
                    </div>

                    {/* Floating Frosted Glass Action Button */}
                    <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => modelCameraInputRef.current?.click()}
                        className="backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#7A756D]" />
                        <span>Cambiar foto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => modelGalleryInputRef.current?.click()}
                        className="backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-medium px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                        title="Elegir de galería"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Save as default model toggle */}
                <div className="pt-1 flex items-center justify-between text-xs text-[#7A756D] border-t border-[#E8E2D9]">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={saveAsDefaultModel}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setSaveAsDefaultModel(checked);
                        if (checked && modelImage) {
                          saveModelToStorage(modelImage.dataUri, modelImage.fileSizeBytes);
                          setHasSavedModelOnDisk(true);
                        }
                      }}
                      className="rounded text-[#121110] focus:ring-[#121110] w-4 h-4 border-[#E8E2D9]"
                    />
                    <span className="text-[11px] font-medium text-[#121110]">
                      Fijar como modelo habitual para agilizar futuras prendas
                    </span>
                  </label>

                  {hasSavedModelOnDisk && (
                    <button
                      type="button"
                      onClick={handleClearSavedModel}
                      title="Eliminar modelo guardada"
                      className="text-stone-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {hasSavedModelOnDisk && (
                  <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck className="w-4 h-4 text-[#C5A059]" />
                      <span className="text-xs font-medium text-[#121110]">
                        Modelo habitual disponible en memoria
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleUseSavedModel}
                      className="text-xs font-semibold text-[#121110] bg-white px-3 py-1.5 rounded-xl border border-[#E8E2D9] shadow-xs hover:border-[#121110]"
                    >
                      Cargar
                    </button>
                  </div>
                )}

                {/* Primary camera capture button */}
                <button
                  type="button"
                  onClick={() => modelCameraInputRef.current?.click()}
                  disabled={isCompressingModel}
                  className="w-full py-4 px-4 rounded-2xl bg-[#121110] text-[#FAF7F2] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all hover:bg-black"
                >
                  {isCompressingModel ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                      Optimizando fotografía en alta resolución...
                    </span>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-[#C5A059]" />
                      <span>Hacer foto a la modelo ahora</span>
                    </>
                  )}
                </button>

                {/* Secondary gallery upload button */}
                <button
                  type="button"
                  onClick={() => modelGalleryInputRef.current?.click()}
                  disabled={isCompressingModel}
                  className="w-full py-3 px-4 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] hover:bg-white text-[#121110] font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                  <span>Elegir fotografía de la galería</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* MODO B: SUPERMODELO VIRTUAL IA (SIN SUBIR FOTO) */}
        {/* ======================================================== */}
        {modelMode === 'virtual' && (
          <div className="space-y-3 animate-in fade-in">
            <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-3.5 text-xs text-[#7A756D] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
              <p className="leading-snug text-[11px]">
                <strong className="text-[#121110]">Sin fotos de personas:</strong> La IA vestirá a la supermodelo virtual seleccionada directamente con tu prenda en percha, creando una campaña editorial de pasarela.
              </p>
            </div>

            <div className="space-y-2.5">
              {VIRTUAL_MODELS.map((model) => {
                const active = virtualModel === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setVirtualModel(model.id)}
                    className={`w-full p-4 rounded-2xl text-left border transition-all flex flex-col gap-1.5 ${
                      active
                        ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/40'
                        : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#121110] border-[#E8E2D9]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm tracking-wide">
                          {model.name}
                        </span>
                        <span className={`text-[11px] font-serif italic ${active ? 'text-[#C5A059]' : 'text-[#7A756D]'}`}>
                          · {model.tagline}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                            active
                              ? 'bg-[#C5A059] text-[#121110]'
                              : 'bg-white text-[#7A756D] border border-[#E8E2D9]'
                          }`}
                        >
                          {model.badge}
                        </span>
                        {active && <Check className="w-4 h-4 text-[#C5A059]" />}
                      </div>
                    </div>
                    <p className={`text-[11px] leading-relaxed ${active ? 'text-stone-300' : 'text-[#7A756D]'}`}>
                      {model.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* SECCIÓN 02 / LA PRENDA & ESCENARIO */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
              02 / LA PRENDA & ESCENARIO
            </span>
            <h2 className="text-xl font-serif text-[#121110] font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#7A756D]" />
              {isOutfit ? 'Prendas del Conjunto (Total Look)' : 'Prenda en Percha & Escenario'}
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              {isOutfit
                ? 'Captura la pieza superior y la inferior para el estilismo coordinado'
                : 'Fotografía en percha con fondo neutro y atmósfera editorial'}
            </p>
          </div>
          {(isOutfit ? (garmentImage && secondaryGarmentImage) : garmentImage) && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#121110] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#C5A059]/40">
              <Check className="w-3.5 h-3.5 text-[#C5A059] stroke-[2.5]" />
              {isOutfit ? 'Conjunto listo' : 'Lista'}
            </span>
          )}
        </div>

        {/* Modalidad: Prenda individual vs Conjunto 2 piezas */}
        <div className="bg-[#FAF7F2] p-1 rounded-2xl flex items-center border border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => {
              setIsOutfit(false);
              setCategory('auto');
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-center ${
              !isOutfit
                ? 'bg-[#121110] text-[#FAF7F2] shadow-sm'
                : 'text-[#7A756D] hover:text-[#121110]'
            }`}
          >
            Prenda individual
          </button>
          <button
            type="button"
            onClick={() => {
              setIsOutfit(true);
              if (price === 29.95) setPrice(59.95);
            }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold tracking-wide transition-all text-center ${
              isOutfit
                ? 'bg-[#121110] text-[#FAF7F2] shadow-sm'
                : 'text-[#7A756D] hover:text-[#121110]'
            }`}
          >
            Conjunto 2 Piezas (Total Look)
          </button>
        </div>

        {/* FOTOGRAFÍAS: MODO CONJUNTO VS PRENDA ÚNICA */}
        {isOutfit ? (
          <div className="space-y-4">
            {/* Pieza 1: Parte Superior */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#121110] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#121110] text-[#FAF7F2] text-[10px] flex items-center justify-center font-mono">1</span>
                  Parte Superior (Blusa, Blazer, Top...)
                </span>
                {garmentImage && (
                  <span className="text-[10px] font-semibold text-[#121110] bg-white px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                    Lista
                  </span>
                )}
              </div>

              {garmentImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-56 bg-white border border-[#E8E2D9] flex items-center justify-center">
                    <img src={garmentImage.dataUri} alt="Parte superior" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 backdrop-blur-md bg-[#121110]/80 text-[#FAF7F2] px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {formatBytes(garmentImage.fileSizeBytes)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => garmentCameraInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#121110] flex items-center justify-center gap-1.5 hover:border-[#121110]"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#7A756D]" />
                      Repetir superior
                    </button>
                    <button
                      type="button"
                      onClick={() => garmentGalleryInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#121110] flex items-center justify-center gap-1.5 hover:border-[#121110]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => garmentCameraInputRef.current?.click()}
                    disabled={isCompressingGarment}
                    className="w-full py-3 px-3 rounded-xl bg-[#121110] text-[#FAF7F2] font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-black"
                  >
                    {isCompressingGarment ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" /> Procesando...
                      </span>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-[#C5A059]" />
                        Hacer foto a la parte superior
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => garmentGalleryInputRef.current?.click()}
                    disabled={isCompressingGarment}
                    className="w-full py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white hover:border-[#121110] text-[#121110] font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                    Elegir superior de la galería
                  </button>
                </div>
              )}
            </div>

            {/* Pieza 2: Parte Inferior */}
            <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#121110] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#121110] text-[#FAF7F2] text-[10px] flex items-center justify-center font-mono">2</span>
                  Parte Inferior (Pantalón, Falda, Short...)
                </span>
                {secondaryGarmentImage && (
                  <span className="text-[10px] font-semibold text-[#121110] bg-white px-2 py-0.5 rounded-full border border-[#C5A059]/40">
                    Lista
                  </span>
                )}
              </div>

              {secondaryGarmentImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-56 bg-white border border-[#E8E2D9] flex items-center justify-center">
                    <img src={secondaryGarmentImage.dataUri} alt="Parte inferior" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 backdrop-blur-md bg-[#121110]/80 text-[#FAF7F2] px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {formatBytes(secondaryGarmentImage.fileSizeBytes)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => secondaryCameraInputRef.current?.click()}
                      className="flex-1 py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#121110] flex items-center justify-center gap-1.5 hover:border-[#121110]"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#7A756D]" />
                      Repetir inferior
                    </button>
                    <button
                      type="button"
                      onClick={() => secondaryGalleryInputRef.current?.click()}
                      className="py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white text-xs font-semibold text-[#121110] flex items-center justify-center gap-1.5 hover:border-[#121110]"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => secondaryCameraInputRef.current?.click()}
                    disabled={isCompressingSecondary}
                    className="w-full py-3 px-3 rounded-xl bg-[#121110] text-[#FAF7F2] font-semibold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-black"
                  >
                    {isCompressingSecondary ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" /> Procesando...
                      </span>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 text-[#C5A059]" />
                        Hacer foto a la parte inferior
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => secondaryGalleryInputRef.current?.click()}
                    disabled={isCompressingSecondary}
                    className="w-full py-2 px-3 rounded-xl border border-[#E8E2D9] bg-white hover:border-[#121110] text-[#121110] font-medium text-xs flex items-center justify-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                    Elegir inferior de la galería
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PRENDA INDIVIDUAL */
          <>
            {garmentImage ? (
              <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E8E2D9] shadow-sm space-y-2">
                <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-80 bg-stone-100 flex items-center justify-center">
                  <img
                    src={garmentImage.dataUri}
                    alt="Prenda en percha"
                    className="w-full h-full object-cover"
                  />

                  {/* Floating 2K Resolution Tag */}
                  <div className="absolute top-2.5 left-2.5 backdrop-blur-md bg-[#121110]/80 border border-[#C5A059]/40 text-[#FAF7F2] px-2.5 py-1 rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                    <span>2K CAPTURA · {formatBytes(garmentImage.fileSizeBytes)}</span>
                  </div>

                  {/* Floating Frosted Glass Action Button */}
                  <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => garmentCameraInputRef.current?.click()}
                      className="backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-medium px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-[#7A756D]" />
                      <span>Cambiar foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => garmentGalleryInputRef.current?.click()}
                      className="backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-medium px-2.5 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                      title="Elegir de galería"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => garmentCameraInputRef.current?.click()}
                  disabled={isCompressingGarment}
                  className="w-full py-4 px-4 rounded-2xl bg-[#121110] text-[#FAF7F2] font-semibold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all hover:bg-black"
                >
                  {isCompressingGarment ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#C5A059]" />
                      Optimizando fotografía de la prenda...
                    </span>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 text-[#C5A059]" />
                      <span>Hacer foto a la prenda en percha</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => garmentGalleryInputRef.current?.click()}
                  disabled={isCompressingGarment}
                  className="w-full py-3 px-4 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] hover:bg-white text-[#121110] font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#7A756D]" />
                  <span>Elegir fotografía de la galería</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* SELECTOR DE MOTOR DE CALIDAD IA */}
        <div className="space-y-2.5 pt-4 border-t border-[#E8E2D9]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#121110] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Motor de Calidad IA
            </label>
            <span className="text-[10px] font-mono text-[#C5A059] bg-[#FAF7F2] border border-[#C5A059]/30 px-2 py-0.5 rounded-full font-semibold">
              {engine === 'nano-banana-pro' ? 'Resolución 2K' : engine === 'flux-2-max' ? 'Resolución HD' : 'Estándar'}
            </span>
          </div>

          <div className="space-y-2">
            {ENGINE_OPTIONS.map((opt) => {
              const active = engine === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEngine(opt.id)}
                  className={`w-full p-3.5 rounded-2xl text-left border transition-all flex flex-col gap-1 ${
                    active
                      ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/30'
                      : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#121110] border-[#E8E2D9]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold font-serif tracking-wide">
                      {opt.label}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                      <span
                        className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                          active
                            ? 'bg-[#C5A059] text-[#121110]'
                            : 'bg-white text-[#7A756D] border border-[#E8E2D9]'
                        }`}
                      >
                        {opt.badge}
                      </span>
                      {active && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                    </div>
                  </div>
                  <p
                    className={`text-[11px] leading-relaxed ${
                      active ? 'text-stone-300' : 'text-[#7A756D]'
                    }`}
                  >
                    {opt.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SELECTOR DE ILUMINACIÓN Y ESCENARIO */}
        <div className="space-y-2.5 pt-4 border-t border-[#E8E2D9]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#121110] uppercase tracking-wider flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#C5A059]" />
              Iluminación y Escenario del Catálogo
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {SCENE_STYLE_OPTIONS.map((scn) => {
              const active = sceneStyle === scn.id;
              const IconComp = scn.icon;
              return (
                <button
                  key={scn.id}
                  type="button"
                  onClick={() => setSceneStyle(scn.id)}
                  className={`p-3.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/30'
                      : 'bg-[#FAF7F2]/60 hover:bg-[#FAF7F2] text-[#121110] border-[#E8E2D9]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <div className="flex items-center gap-2">
                      <IconComp className={`w-4 h-4 ${active ? 'text-[#C5A059]' : 'text-[#7A756D]'}`} />
                      <span className="text-xs font-bold font-serif tracking-wide">
                        {scn.label}
                      </span>
                    </div>
                    {active && <Check className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0 ml-1" />}
                  </div>
                  <p
                    className={`text-[11px] leading-snug ${
                      active ? 'text-stone-300' : 'text-[#7A756D]'
                    }`}
                  >
                    {scn.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* SECCIÓN 03 / DATOS DE COLECCIÓN */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5">
        <div>
          <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
            03 / DATOS DE COLECCIÓN
          </span>
          <h2 className="text-xl font-serif text-[#121110] font-bold">
            Ficha Comercial & Inventario
          </h2>
          <p className="text-xs text-[#7A756D] mt-0.5">
            Precio de venta, tallas disponibles y tipo de prenda
          </p>
        </div>

        {/* Category selector */}
        {!isOutfit && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#7A756D]" />
              Tipo de prenda
            </label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map((opt) => {
                const active = category === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCategory(opt.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-all border text-left ${
                      active
                        ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-xs'
                        : 'bg-[#FAF7F2] text-[#121110] border-[#E8E2D9] hover:border-[#121110]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Price and Sizes */}
        <div className="space-y-4 pt-2">
          {/* Price */}
          <div>
            <label className="text-xs font-semibold text-[#121110] block mb-1">
              {isOutfit ? 'Precio Total Look (€)' : 'Precio de Venta (€)'}
            </label>
            <div className="relative max-w-xs">
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-[#E8E2D9] text-sm font-bold text-[#121110] bg-[#FAF7F2] focus:bg-white focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all"
              />
              <Euro className="w-4 h-4 text-[#7A756D] absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Sizes: Minimalist square buttons */}
          <div>
            <label className="text-xs font-semibold text-[#121110] block mb-2">
              Tallas en tienda ({sizes.join(', ')})
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((sz) => {
                const isSelected = sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`w-11 h-11 rounded-xl text-xs font-semibold flex items-center justify-center transition-all border ${
                      isSelected
                        ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm font-bold'
                        : 'bg-[#FAF7F2] text-[#7A756D] border-[#E8E2D9] hover:border-[#121110] hover:text-[#121110]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* BOTÓN FLOTANTE INFERIOR DE LUJO */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAF7F2]/90 backdrop-blur-xl border-t border-[#E8E2D9] z-20 shadow-[0_-8px_30px_rgba(18,17,16,0.06)]">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleAction}
            disabled={!canSubmit}
            className={`w-full py-4 px-6 rounded-2xl font-serif text-base tracking-wider font-semibold flex items-center justify-center gap-3 transition-all ${
              canSubmit
                ? 'bg-[#121110] text-[#FAF7F2] hover:bg-black shadow-[0_12px_30px_rgba(18,17,16,0.35)] ring-1 ring-[#C5A059]/40 active:scale-[0.99] cursor-pointer'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Sparkles className={`w-5 h-5 ${canSubmit ? 'text-[#C5A059]' : 'text-stone-400'}`} />
            <span>
              {isOutfit ? 'Vestir Conjunto 2 Piezas + Ficha IA' : 'Vestir Modelo + Crear Ficha IA'}
            </span>
          </button>

          {!canSubmit && !isProcessing && (
            <p className="text-center text-[11px] text-[#7A756D] mt-2 font-medium">
              {modelMode === 'real' && !modelImage && !garmentImage
                ? 'Añade la foto de la modelo (Paso 01) y de la prenda (Paso 02)'
                : modelMode === 'real' && !modelImage
                ? 'Falta la foto de la modelo (Paso 01) o elige Supermodelo Virtual'
                : !garmentImage
                ? isOutfit
                  ? 'Falta la foto de la parte superior (Paso 02)'
                  : 'Falta la foto de la prenda en percha (Paso 02)'
                : isOutfit && !secondaryGarmentImage
                ? 'Falta la foto de la parte inferior del conjunto'
                : 'Completa los datos requeridos'}
            </p>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* OVERLAY / PANTALLA DE PASARELA IA A PANTALLA COMPLETA */}
      {/* ======================================================== */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-[#121110]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-[#FAF7F2] animate-in fade-in duration-300">
          <div className="max-w-md w-full flex flex-col items-center space-y-6">
            {/* Editorial Badge */}
            <span className="font-serif text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold px-3 py-1 rounded-full border border-[#C5A059]/40 bg-[#121110]">
              PASARELA IA 2K · ATELIER VIRTUAL
            </span>

            {/* Fusion visual container */}
            <div className="relative flex items-center justify-center gap-4 py-2">
              {/* Model Thumbnail: Real or Virtual */}
              {modelMode === 'real' && modelImage ? (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-black">
                  <img src={modelImage.dataUri} alt="Modelo" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/80 text-white rounded py-0.5 font-mono">
                    MODELO REAL
                  </span>
                </div>
              ) : (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-[#1A1816] flex flex-col items-center justify-center p-3 text-center">
                  <Crown className="w-6 h-6 text-[#C5A059] mb-1.5 animate-pulse" />
                  <span className="font-serif font-bold text-sm text-[#FAF7F2]">
                    {selectedVirtualProfile.name}
                  </span>
                  <span className="text-[9px] text-[#C5A059] font-mono mt-0.5">
                    SUPERMODELO
                  </span>
                </div>
              )}

              {/* Pulsing Sparks / Fusion Center */}
              <div className="w-10 h-10 rounded-full bg-[#121110] border border-[#C5A059] flex items-center justify-center shadow-lg shadow-[#C5A059]/20 animate-pulse">
                <Sparkles className="w-5 h-5 text-[#C5A059]" />
              </div>

              {/* Garment Thumbnail */}
              {garmentImage && (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-black">
                  <img src={garmentImage.dataUri} alt="Prenda" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/80 text-white rounded py-0.5 font-mono">
                    PRENDA
                  </span>
                </div>
              )}
            </div>

            {/* Dynamic Cycling Message */}
            <div className="min-h-[4rem] flex flex-col items-center justify-center">
              <p className="font-serif italic text-lg sm:text-xl text-[#FAF7F2] transition-all duration-500 leading-snug">
                {RUNWAY_MESSAGES[runwayMessageIndex]}
              </p>
              <p className="text-xs text-[#7A756D] mt-1.5 font-mono">
                {processingStage === 'adjusting_garment' && 'Fase 1/3 · Ajustando caída y proporciones de prenda'}
                {processingStage === 'adjusting_garment_top' && 'Fase 1/4 · Ajustando parte superior a la silueta'}
                {processingStage === 'adjusting_garment_bottom' && 'Fase 2/4 · Coordinando parte inferior del conjunto'}
                {processingStage === 'generating_copy' && 'Fase 3/4 · Generando ficha editorial SEO'}
                {processingStage === 'replacing_background' && 'Fase 4/4 · Perfeccionando iluminación fotográfica'}
                {processingStage === 'completed' && 'Fase final · Generación completada con éxito'}
                {processingStage === 'idle' && 'Iniciando motor de alta costura...'}
              </p>
            </div>

            {/* Gold Progress Bar */}
            <div className="w-64 sm:w-72 h-1.5 bg-[#252321] rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r from-[#C5A059] via-[#E5C989] to-[#C5A059] transition-all duration-700 animate-pulse ${
                  processingStage === 'adjusting_garment'
                    ? 'w-1/3'
                    : processingStage === 'adjusting_garment_top'
                    ? 'w-1/4'
                    : processingStage === 'adjusting_garment_bottom'
                    ? 'w-2/4'
                    : processingStage === 'generating_copy'
                    ? 'w-3/4'
                    : processingStage === 'replacing_background'
                    ? 'w-11/12'
                    : 'w-full'
                }`}
              />
            </div>

            <p className="text-[11px] text-[#7A756D] tracking-wide">
              Fotografía comercial en resolución 2K · Sin pérdida de definición
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
