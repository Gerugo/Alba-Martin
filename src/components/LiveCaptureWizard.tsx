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
  VirtualModelProfile,
  LookItem,
  LookItemCategory
} from '../types/catalog';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import { loadSavedModel, saveModelToStorage, removeSavedModel } from '../services/settingsStorage';
import { TryOnStage } from '../services/aiService';

export interface CurrentLookGarment {
  id: string;
  category: LookItemCategory;
  label: string;
  image: CompressedImageResult;
}

export interface ProcessPayload {
  modelImage?: CompressedImageResult | null;
  garmentImage: CompressedImageResult;
  secondaryGarmentImage?: CompressedImageResult | null;
  garmentPhotos?: CompressedImageResult[];
  isOutfit: boolean;
  isLookCompleto?: boolean;
  lookItems?: LookItem[];
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
    label: 'Calidad Editorial 2K (Recomendado)',
    badge: '2K Editorial',
    desc: 'Máxima resolución y nitidez en estampados, rostro natural y caída hiperrealista.',
  },
  {
    id: 'flux-2-max',
    label: 'Fotografía Realista HD',
    badge: 'HD Realista',
    desc: 'Textura fotográfica con iluminación comercial.',
  },
  {
    id: 'fashn-v16',
    label: 'Ajuste Directo de Prenda',
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

  // Garment & Look state (Permite añadir múltiples elementos al look actual)
  const [lookGarments, setLookGarments] = useState<CurrentLookGarment[]>([]);
  const pendingGarmentConfigRef = useRef<{ category: LookItemCategory; label: string }>({
    category: 'outerwear',
    label: 'Prenda Principal',
  });

  const [category, setCategory] = useState<ProductCategory>('auto');
  const [price, setPrice] = useState<number>(29.95);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [isCompressingGarment, setIsCompressingGarment] = useState<boolean>(false);

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

  const triggerAddGarmentCamera = (category: LookItemCategory, label: string) => {
    pendingGarmentConfigRef.current = { category, label };
    garmentCameraInputRef.current?.click();
  };

  const triggerAddGarmentGallery = (category: LookItemCategory, label: string) => {
    pendingGarmentConfigRef.current = { category, label };
    garmentGalleryInputRef.current?.click();
  };

  // Handle Garment Photo upload and addition to look
  const handleGarmentFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsCompressingGarment(true);
      const compressed = await compressImage(file);
      const newItem: CurrentLookGarment = {
        id: `garment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        category: pendingGarmentConfigRef.current.category,
        label: pendingGarmentConfigRef.current.label,
        image: compressed,
      };

      setLookGarments((prev) => {
        const next = [...prev, newItem];
        if (next.length === 1 && (price === 29.95 || price === 59.95 || price === 89.95)) {
          setPrice(29.95);
        } else if (next.length === 2 && price === 29.95) {
          setPrice(59.95);
        } else if (next.length >= 3 && (price === 29.95 || price === 59.95)) {
          setPrice(89.95);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo procesar la foto de la prenda. Prueba con otra imagen.');
    } finally {
      setIsCompressingGarment(false);
      e.target.value = '';
    }
  };

  const handleRemoveLookGarment = (id: string) => {
    setLookGarments((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length === 1 && price === 59.95) {
        setPrice(29.95);
      } else if (next.length === 2 && price === 89.95) {
        setPrice(59.95);
      }
      return next;
    });
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

    if (lookGarments.length === 0) {
      setErrorMessage('Por favor, añade al menos una prenda al look actual para continuar (Paso 02).');
      return;
    }

    setErrorMessage(null);

    const primaryGarment = lookGarments[0].image;
    const secondaryGarment = lookGarments[1]?.image || null;
    const activeLookItems: LookItem[] = lookGarments.map((g) => ({
      id: g.id,
      category: g.category,
      label: g.label,
      dataUri: g.image.dataUri,
      base64Raw: g.image.base64Raw,
      fileSizeBytes: g.image.fileSizeBytes,
    }));

    onProcess({
      modelImage: modelMode === 'real' ? modelImage : null,
      garmentImage: primaryGarment,
      secondaryGarmentImage: secondaryGarment,
      garmentPhotos: lookGarments.map((g) => g.image),
      isOutfit: lookGarments.length >= 2,
      isLookCompleto: lookGarments.length >= 3,
      lookItems: activeLookItems,
      category: lookGarments.length > 1 ? 'one-pieces' : category,
      price: Number(price) || (lookGarments.length >= 3 ? 89.95 : lookGarments.length === 2 ? 59.95 : 29.95),
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

  const isGarmentReady = lookGarments.length > 0;
  const canSubmit = Boolean(
    (modelMode === 'virtual' || modelImage) &&
    isGarmentReady &&
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
                  ? 'Pose dinámica de modelo profesional con porte estilizado, giro de 3/4 e iluminación editorial.'
                  : 'Conserva la postura original de la fotografía.'}
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
                <strong className="text-[#121110]">Sin fotos de personas:</strong> Viste a la supermodelo virtual seleccionada directamente con tu prenda en percha, creando una campaña editorial de pasarela.
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
              02 / LAS PRENDAS DEL LOOK & ESCENARIO
            </span>
            <h2 className="text-xl font-serif text-[#121110] font-bold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#7A756D]" />
              Prendas del Look Actual
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Añade una o varias prendas y accesorios para componer el estilismo (estilo editorial Botika / Zara Studio)
            </p>
          </div>
          {lookGarments.length > 0 && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#121110] bg-[#FAF7F2] px-3 py-1 rounded-full border border-[#C5A059]/40">
              <Check className="w-3.5 h-3.5 text-[#C5A059] stroke-[2.5]" />
              {lookGarments.length === 1
                ? '1 prenda lista'
                : lookGarments.length === 2
                ? 'Conjunto (2 piezas)'
                : `${lookGarments.length} piezas listas`}
            </span>
          )}
        </div>

        {/* Miniaturas horizontales de todas las prendas que componen el look actual */}
        {lookGarments.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-serif uppercase tracking-[0.15em] text-[#121110] font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                Piezas del Look ({lookGarments.length})
              </span>
              <span className="text-[10px] font-mono text-[#7A756D]">
                Toca la cruz para quitar cualquier prenda
              </span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 pt-1 -mx-1 px-1 scrollbar-thin">
              {lookGarments.map((item, index) => (
                <div
                  key={item.id}
                  className="relative flex-shrink-0 w-28 sm:w-32 bg-white rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-xs hover:border-[#C5A059] transition-all group"
                >
                  <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                    <img
                      src={item.image.dataUri}
                      alt={item.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#121110]/85 text-[#FAF7F2] text-[10px] flex items-center justify-center font-mono font-bold shadow-sm">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLookGarment(item.id)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-[#FAF7F2] flex items-center justify-center shadow-md transition-colors"
                      title="Eliminar del look"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-2 left-2 text-[8px] font-mono font-medium backdrop-blur-md bg-black/70 text-[#FAF7F2] px-1.5 py-0.5 rounded border border-white/20">
                      {formatBytes(item.image.fileSizeBytes)}
                    </span>
                  </div>

                  <div className="p-2 bg-[#FAF7F2] border-t border-[#E8E2D9]">
                    <p className="text-[11px] font-bold text-[#121110] truncate" title={item.label}>
                      {item.label}
                    </p>
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#7A756D] block">
                      {item.category === 'outerwear'
                        ? 'Prenda Exterior'
                        : item.category === 'top'
                        ? 'Parte Superior'
                        : item.category === 'bottom'
                        ? 'Parte Inferior'
                        : 'Accesorio'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border border-dashed border-[#E8E2D9] bg-[#FAF7F2]/60 text-center space-y-1">
            <p className="text-xs font-semibold text-[#121110]">El look actual no tiene prendas añadidas</p>
            <p className="text-[11px] text-[#7A756D]">
              Utiliza las opciones inferiores para añadir la prenda principal, pantalón o falda, y accesorios.
            </p>
          </div>
        )}

        {/* Añadir múltiples elementos al look actual */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#121110] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
            Añadir Elementos al Look
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Prenda Principal */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#121110]">Prenda Principal</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-[#7A756D] border border-[#E8E2D9]">
                    Capa 1
                  </span>
                </div>
                <p className="text-[10px] text-[#7A756D] leading-tight">
                  Americana, blazer, vestido, blusa o top principal
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerAddGarmentCamera('outerwear', 'Prenda Principal')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl bg-[#121110] text-[#FAF7F2] text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-black transition-colors"
                >
                  <Camera className="w-3 h-3 text-[#C5A059]" />
                  <span>Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAddGarmentGallery('outerwear', 'Prenda Principal')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl border border-[#E8E2D9] bg-white text-[#121110] text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-[#121110] transition-colors"
                >
                  <Upload className="w-3 h-3 text-[#7A756D]" />
                  <span>Galería</span>
                </button>
              </div>
            </div>

            {/* 2. Parte Inferior / Pantalón */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#121110]">Parte Inferior / Pantalón</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-[#7A756D] border border-[#E8E2D9]">
                    Capa 2
                  </span>
                </div>
                <p className="text-[10px] text-[#7A756D] leading-tight">
                  Pantalón sastre, vaquero, falda o shorts
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerAddGarmentCamera('bottom', 'Parte Inferior / Pantalón')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl bg-[#121110] text-[#FAF7F2] text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-black transition-colors"
                >
                  <Camera className="w-3 h-3 text-[#C5A059]" />
                  <span>Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAddGarmentGallery('bottom', 'Parte Inferior / Pantalón')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl border border-[#E8E2D9] bg-white text-[#121110] text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-[#121110] transition-colors"
                >
                  <Upload className="w-3 h-3 text-[#7A756D]" />
                  <span>Galería</span>
                </button>
              </div>
            </div>

            {/* 3. Accesorio / Bolso */}
            <div className="p-3.5 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#121110]">Accesorio / Bolso</span>
                  <span className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-white text-[#7A756D] border border-[#E8E2D9]">
                    Toque Final
                  </span>
                </div>
                <p className="text-[10px] text-[#7A756D] leading-tight">
                  Bolso, cinturón, calzado, pañuelo o joya
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => triggerAddGarmentCamera('accessory', 'Accesorio / Bolso')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl bg-[#121110] text-[#FAF7F2] text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-black transition-colors"
                >
                  <Camera className="w-3 h-3 text-[#C5A059]" />
                  <span>Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerAddGarmentGallery('accessory', 'Accesorio / Bolso')}
                  disabled={isCompressingGarment}
                  className="flex-1 py-2 px-2 rounded-xl border border-[#E8E2D9] bg-white text-[#121110] text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-[#121110] transition-colors"
                >
                  <Upload className="w-3 h-3 text-[#7A756D]" />
                  <span>Galería</span>
                </button>
              </div>
            </div>
          </div>

          {isCompressingGarment && (
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#C5A059]/40 flex items-center justify-center gap-2 text-xs font-semibold text-[#121110] animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#C5A059]" />
              <span>Optimizando fotografía en resolución 2K...</span>
            </div>
          )}
        </div>

        {/* SELECTOR DE MOTOR DE CALIDAD */}
        <div className="space-y-2.5 pt-4 border-t border-[#E8E2D9]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#121110] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              Motor de Calidad
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
        {lookGarments.length <= 1 && (
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
              {lookGarments.length > 1 ? 'Precio Total Look (€)' : 'Precio de Venta (€)'}
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
              {lookGarments.length >= 3
                ? `Vestir Look Completo (${lookGarments.length} Piezas) + Crear Ficha`
                : lookGarments.length === 2
                ? 'Vestir Conjunto 2 Piezas + Crear Ficha'
                : 'Vestir Prenda + Crear Ficha'}
            </span>
          </button>

          {!canSubmit && !isProcessing && (
            <p className="text-center text-[11px] text-[#7A756D] mt-2 font-medium">
              {modelMode === 'real' && !modelImage
                ? 'Falta la foto de la modelo (Paso 01) o elige Supermodelo Virtual'
                : lookGarments.length === 0
                ? 'Añade al menos una prenda al look actual (Paso 02)'
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

              {/* Garment / Look Thumbnail */}
              {lookGarments.length > 1 ? (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-black grid grid-cols-2 gap-0.5 p-0.5">
                  {lookGarments.slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={item.image.dataUri}
                      alt={item.label}
                      className="w-full h-full object-cover rounded"
                    />
                  ))}
                  <span className="absolute bottom-1 left-1 right-1 text-[8px] bg-black/90 text-[#C5A059] rounded py-0.5 font-mono text-center">
                    LOOK ({lookGarments.length} PIEZAS)
                  </span>
                </div>
              ) : lookGarments.length === 1 ? (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-black">
                  <img src={lookGarments[0].image.dataUri} alt="Prenda" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 right-1 text-[9px] bg-black/80 text-white rounded py-0.5 font-mono text-center">
                    PRENDA
                  </span>
                </div>
              ) : (
                <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#C5A059]/50 shadow-2xl relative bg-black flex items-center justify-center">
                  <span className="text-[9px] bg-black/80 text-white rounded px-2 py-0.5 font-mono">
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
                {processingStage === 'adjusting_look_completo' && 'Fase 1/3 · Componiendo capas y estilismo del Look Completo'}
                {processingStage === 'adjusting_garment' && 'Fase 1/3 · Ajustando caída y proporciones de prenda'}
                {processingStage === 'adjusting_garment_top' && 'Fase 1/4 · Ajustando parte superior a la silueta'}
                {processingStage === 'adjusting_garment_bottom' && 'Fase 2/4 · Coordinando parte inferior del conjunto'}
                {processingStage === 'generating_copy' && 'Fase 2/3 · Generando ficha editorial SEO'}
                {processingStage === 'replacing_background' && 'Fase 3/3 · Perfeccionando iluminación fotográfica'}
                {processingStage === 'completed' && 'Fase final · Generación completada con éxito'}
                {processingStage === 'idle' && 'Iniciando motor de alta costura...'}
              </p>
            </div>

            {/* Gold Progress Bar */}
            <div className="w-64 sm:w-72 h-1.5 bg-[#252321] rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full bg-gradient-to-r from-[#C5A059] via-[#E5C989] to-[#C5A059] transition-all duration-700 animate-pulse ${
                  processingStage === 'adjusting_look_completo'
                    ? 'w-1/2'
                    : processingStage === 'adjusting_garment'
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
