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
  Crown,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ArrowLeft
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
  LookItemCategory,
  ShotPackMode
} from '../types/catalog';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import { loadSavedModel, loadSavedModelAsync, saveModelToStorage, removeSavedModel } from '../services/settingsStorage';
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
  shotPackMode: ShotPackMode;
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
  preserveFaceIdentity: boolean;
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
  // Navigation Stepper & View state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [wizardView, setWizardView] = useState<'stepper' | 'all'>('stepper');
  const [showAdvancedEngine, setShowAdvancedEngine] = useState<boolean>(false);

  // Model Mode & Profile state
  const [modelMode, setModelMode] = useState<ModelMode>('real');
  const [editorialRepose, setEditorialRepose] = useState<boolean>(true);
  const [preserveFaceIdentity, setPreserveFaceIdentity] = useState<boolean>(true);
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
  const [priceInput, setPriceInput] = useState<string>('29,95');

  const parsePrice = (val: string): number => {
    const cleaned = val.replace(',', '.').replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  const handlePriceChange = (val: string) => {
    // Permitir dígitos y como máximo una coma o un punto decimal
    if (/^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setPriceInput(val);
      const parsed = parsePrice(val);
      setPrice(parsed);
    }
  };

  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [isCompressingGarment, setIsCompressingGarment] = useState<boolean>(false);

  // Engine & Lighting Scene state
  const [engine, setEngine] = useState<TryOnEngine>('nano-banana-pro');
  const [sceneStyle, setSceneStyle] = useState<SceneStyle>('boutique');
  const [shotPackMode, setShotPackMode] = useState<ShotPackMode>('pack-3');

  // Error alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dynamic message index for AI Runway
  const [runwayMessageIndex, setRunwayMessageIndex] = useState<number>(0);

  // File input refs
  const modelCameraInputRef = useRef<HTMLInputElement>(null);
  const modelGalleryInputRef = useRef<HTMLInputElement>(null);
  const garmentCameraInputRef = useRef<HTMLInputElement>(null);
  const garmentGalleryInputRef = useRef<HTMLInputElement>(null);

  // Load saved model from storage on mount (synchronous cache + IndexedDB)
  useEffect(() => {
    const applySavedModel = (saved: { dataUri: string; fileSizeBytes: number } | null) => {
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
    };

    const immediate = loadSavedModel();
    if (immediate) {
      applySavedModel(immediate);
    } else {
      loadSavedModelAsync().then((fromDB) => {
        if (fromDB) applySavedModel(fromDB);
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
        const currentNum = parsePrice(priceInput);
        if (next.length === 1 && (currentNum === 29.95 || currentNum === 59.95 || currentNum === 89.95)) {
          setPrice(29.95);
          setPriceInput('29,95');
        } else if (next.length === 2 && currentNum === 29.95) {
          setPrice(59.95);
          setPriceInput('59,95');
        } else if (next.length >= 3 && (currentNum === 29.95 || currentNum === 59.95)) {
          setPrice(89.95);
          setPriceInput('89,95');
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
      const currentNum = parsePrice(priceInput);
      if (next.length === 1 && currentNum === 59.95) {
        setPrice(29.95);
        setPriceInput('29,95');
      } else if (next.length === 2 && currentNum === 89.95) {
        setPrice(59.95);
        setPriceInput('59,95');
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
      price: parsePrice(priceInput) || Number(price) || (lookGarments.length >= 3 ? 89.95 : lookGarments.length === 2 ? 59.95 : 29.95),
      sizes,
      engine,
      sceneStyle,
      shotPackMode,
      backgroundType: 'original',
      customBackgroundImage: null,
      modelMode,
      editorialRepose,
      preserveFaceIdentity,
      virtualModel,
    });
  };

  const isStep1Ready = Boolean(modelMode === 'virtual' || modelImage);
  const isStep2Ready = lookGarments.length > 0;
  const isStep3Ready = isStep1Ready && isStep2Ready;
  const canSubmit = Boolean(isStep1Ready && isStep2Ready && !isProcessing);

  const selectedVirtualProfile = VIRTUAL_MODELS.find((m) => m.id === virtualModel) || VIRTUAL_MODELS[0];

  const jumpToStep = (step: 1 | 2 | 3) => {
    setCurrentStep(step);
    if (wizardView === 'all') {
      const el = document.getElementById(`wizard-step-${step}`);
      el?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
      {/* BARRA SUPERIOR DE CONTROL: PASOS GUIADOS (STEPPER) & VISTA */}
      {/* ======================================================== */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 border border-[#E8E2D9] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-serif text-[11px] uppercase tracking-[0.2em] text-[#C5A059] font-bold">
              ESTUDIO GUIADO
            </span>
            <span className="text-stone-300">·</span>
            <span className="text-xs text-[#7A756D] font-medium">
              {wizardView === 'stepper' ? `Paso 0${currentStep} de 03` : 'Modo Expandido'}
            </span>
          </div>

          {/* Toggle: Por Pasos vs Ver Todo */}
          <div className="bg-[#FAF7F2] p-0.5 rounded-xl border border-[#E8E2D9] flex items-center text-[11px] font-semibold">
            <button
              type="button"
              onClick={() => setWizardView('stepper')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                wizardView === 'stepper'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Por Pasos
            </button>
            <button
              type="button"
              onClick={() => setWizardView('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                wizardView === 'all'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Ver Todo
            </button>
          </div>
        </div>

        {/* 3 Step Pills */}
        <div className="grid grid-cols-3 gap-2">
          {/* Step 1 Pill */}
          <button
            type="button"
            onClick={() => jumpToStep(1)}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              currentStep === 1 && wizardView === 'stepper'
                ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/40'
                : isStep1Ready
                ? 'bg-[#FAF7F2] text-[#121110] border-[#C5A059]/50 hover:border-[#121110]'
                : 'bg-[#FAF7F2]/60 text-[#7A756D] border-[#E8E2D9] hover:border-[#7A756D]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                01 Modelo
              </span>
              {isStep1Ready && (
                <Check className={`w-3.5 h-3.5 ${currentStep === 1 && wizardView === 'stepper' ? 'text-[#C5A059]' : 'text-[#C5A059]'}`} />
              )}
            </div>
            <p className={`text-[11px] font-semibold truncate mt-1 ${
              currentStep === 1 && wizardView === 'stepper' ? 'text-white' : 'text-[#121110]'
            }`}>
              {modelMode === 'virtual' ? selectedVirtualProfile.name : modelImage ? 'Foto lista' : 'Sin elegir'}
            </p>
          </button>

          {/* Step 2 Pill */}
          <button
            type="button"
            onClick={() => jumpToStep(2)}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              currentStep === 2 && wizardView === 'stepper'
                ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/40'
                : isStep2Ready
                ? 'bg-[#FAF7F2] text-[#121110] border-[#C5A059]/50 hover:border-[#121110]'
                : 'bg-[#FAF7F2]/60 text-[#7A756D] border-[#E8E2D9] hover:border-[#7A756D]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                02 Prendas
              </span>
              {isStep2Ready && (
                <Check className={`w-3.5 h-3.5 ${currentStep === 2 && wizardView === 'stepper' ? 'text-[#C5A059]' : 'text-[#C5A059]'}`} />
              )}
            </div>
            <p className={`text-[11px] font-semibold truncate mt-1 ${
              currentStep === 2 && wizardView === 'stepper' ? 'text-white' : 'text-[#121110]'
            }`}>
              {lookGarments.length > 0 ? `${lookGarments.length} pieza${lookGarments.length > 1 ? 's' : ''}` : 'Sin prendas'}
            </p>
          </button>

          {/* Step 3 Pill */}
          <button
            type="button"
            onClick={() => jumpToStep(3)}
            className={`p-2 sm:p-2.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
              currentStep === 3 && wizardView === 'stepper'
                ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/40'
                : isStep3Ready
                ? 'bg-[#FAF7F2] text-[#121110] border-[#C5A059]/50 hover:border-[#121110]'
                : 'bg-[#FAF7F2]/60 text-[#7A756D] border-[#E8E2D9] hover:border-[#7A756D]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                03 Sesión
              </span>
              {isStep3Ready && (
                <Check className={`w-3.5 h-3.5 ${currentStep === 3 && wizardView === 'stepper' ? 'text-[#C5A059]' : 'text-[#C5A059]'}`} />
              )}
            </div>
            <p className={`text-[11px] font-semibold truncate mt-1 ${
              currentStep === 3 && wizardView === 'stepper' ? 'text-white' : 'text-[#121110]'
            }`}>
              {shotPackMode === 'pack-3' ? 'Pack 3 Fotos' : '1 Foto'}
            </p>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECCIÓN 01 / LA MODELO */}
      {/* ======================================================== */}
      {(wizardView === 'all' || currentStep === 1) && (
        <section
          id="wizard-step-1"
          className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5 animate-in fade-in"
        >
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

          {/* SELECTOR DE MODO: PERSONA REAL VS SUPERMODELO VIRTUAL */}
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
              <span>Persona Real de Tienda</span>
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
              <span>Supermodelo Virtual IA</span>
            </button>
          </div>

          {/* MODO A: PERSONA REAL DE LA TIENDA */}
          {modelMode === 'real' && (
            <div className="space-y-4">
              {/* RE-POSADO EDITORIAL AUTOMÁTICO */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-[#121110] font-serif tracking-wide">
                      Re-Posado Editorial Automático
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

              {/* FIJAR IDENTIDAD Y ROSTRO REAL AL 100% */}
              <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D9] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-[#121110] font-serif tracking-wide">
                      Fijar Rostro e Identidad Real al 100%
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#121110] text-[#C5A059]">
                      Máxima Fidelidad
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={preserveFaceIdentity}
                      onChange={(e) => setPreserveFaceIdentity(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#121110]"></div>
                  </label>
                </div>

                <p className="text-[11px] text-[#7A756D] leading-relaxed">
                  {preserveFaceIdentity
                    ? 'Bloquea y transfiere los rasgos exactos de tu cara, ojos, sonrisa y expresión original sobre la pose y estilismo de moda.'
                    : 'Permite que la IA interprete y adapte el rostro con libertad creativa.'}
                </p>
              </div>

              {/* Model Display: Image vs Upload Controls */}
              {modelImage ? (
                <div className="space-y-3">
                  <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E8E2D9] shadow-sm">
                    <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-80 bg-stone-100 flex items-center justify-center">
                      <img
                        src={modelImage.dataUri}
                        alt="Modelo de colección"
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute top-2.5 left-2.5 backdrop-blur-md bg-[#121110]/80 border border-[#C5A059]/40 text-[#FAF7F2] px-2.5 py-1 rounded-full text-[10px] font-mono font-medium flex items-center gap-1.5 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]"></span>
                        <span>2K OPTIMIZADO · {formatBytes(modelImage.fileSizeBytes)}</span>
                      </div>

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

          {/* MODO B: SUPERMODELO VIRTUAL IA */}
          {modelMode === 'virtual' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-3.5 text-xs text-[#7A756D] flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-[#C5A059] flex-shrink-0 mt-0.5" />
                <p className="leading-snug text-[11px]">
                  <strong className="text-[#121110]">Sin fotos de personas:</strong> Viste a la supermodelo virtual seleccionada directamente con tus prendas en percha o dobladas.
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
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 02 / LAS PRENDAS DEL LOOK */}
      {/* ======================================================== */}
      {(wizardView === 'all' || currentStep === 2) && (
        <section
          id="wizard-step-2"
          className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5 animate-in fade-in"
        >
          {/* Summary of Step 1 when in Stepper mode */}
          {wizardView === 'stepper' && (
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center flex-shrink-0">
                  {modelMode === 'virtual' ? (
                    <Crown className="w-4 h-4 text-[#C5A059]" />
                  ) : (
                    <User className="w-4 h-4 text-[#C5A059]" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D] block">
                    Modelo Activa (Paso 01)
                  </span>
                  <p className="text-xs font-bold text-[#121110]">
                    {modelMode === 'virtual' ? `Supermodelo IA · ${selectedVirtualProfile.name}` : modelImage ? 'Foto Real de Tienda' : 'Pendiente de seleccionar'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => jumpToStep(1)}
                className="text-xs font-semibold text-[#121110] hover:text-[#C5A059] px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
              >
                Cambiar
              </button>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
                02 / LAS PRENDAS DEL LOOK
              </span>
              <h2 className="text-xl font-serif text-[#121110] font-bold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#7A756D]" />
                Prendas del Look Actual
              </h2>
              <p className="text-xs text-[#7A756D] mt-0.5">
                Añade una o varias prendas y accesorios para componer el estilismo completo
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
        </section>
      )}

      {/* ======================================================== */}
      {/* SECCIÓN 03 / SESIÓN FOTOGRÁFICA & FICHA */}
      {/* ======================================================== */}
      {(wizardView === 'all' || currentStep === 3) && (
        <section
          id="wizard-step-3"
          className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-6 animate-in fade-in"
        >
          {/* Summary of Steps 1 & 2 when in Stepper mode */}
          {wizardView === 'stepper' && (
            <div className="p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8E2D9] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center flex-shrink-0">
                    {modelMode === 'virtual' ? (
                      <Crown className="w-4 h-4 text-[#C5A059]" />
                    ) : (
                      <User className="w-4 h-4 text-[#C5A059]" />
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D] block">
                      Modelo
                    </span>
                    <p className="text-xs font-bold text-[#121110]">
                      {modelMode === 'virtual' ? selectedVirtualProfile.name : modelImage ? 'Foto Real' : 'Sin foto'}
                    </p>
                  </div>
                </div>

                <div className="h-6 w-px bg-[#E8E2D9]"></div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E8E2D9] flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#7A756D] block">
                      Look
                    </span>
                    <p className="text-xs font-bold text-[#121110]">
                      {lookGarments.length} {lookGarments.length === 1 ? 'prenda' : 'piezas'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => jumpToStep(2)}
                className="text-xs font-semibold text-[#121110] hover:text-[#C5A059] px-2.5 py-1 rounded-lg hover:bg-white transition-colors"
              >
                Editar
              </button>
            </div>
          )}

          <div>
            <span className="font-serif text-xs uppercase tracking-[0.2em] text-[#C5A059] font-bold block mb-1">
              03 / SESIÓN FOTOGRÁFICA & FICHA
            </span>
            <h2 className="text-xl font-serif text-[#121110] font-bold">
              Sesión de Fotos & Ficha Comercial
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Formato de entrega, iluminación de boutique y datos para venta en tienda
            </p>
          </div>

          {/* 1. SELECTOR DE FORMATO DE SESIÓN FOTOGRÁFICA */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#121110] uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
                Formato de Sesión Fotográfica
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Tarjeta 1: Single */}
              <button
                type="button"
                onClick={() => setShotPackMode('single')}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  shotPackMode === 'single'
                    ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-sm ring-1 ring-[#C5A059]/40'
                    : 'bg-[#FAF7F2] text-[#121110] border-[#E8E2D9] hover:border-[#121110]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-[#C5A059] uppercase">
                      Toma Única
                    </span>
                    {shotPackMode === 'single' && (
                      <Check className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    )}
                  </div>
                  <p className="font-serif text-sm font-bold mb-1">
                    1 Foto · Portada Lookbook
                  </p>
                  <p className={`text-xs leading-relaxed ${shotPackMode === 'single' ? 'text-stone-300' : 'text-[#7A756D]'}`}>
                    Pose principal editorial · ~12 seg
                  </p>
                </div>
              </button>

              {/* Tarjeta 2: Pack 3 (Destacada) */}
              <button
                type="button"
                onClick={() => setShotPackMode('pack-3')}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  shotPackMode === 'pack-3'
                    ? 'bg-[#121110] text-[#FAF7F2] border-[#121110] shadow-md ring-2 ring-[#C5A059]'
                    : 'bg-[#FAF7F2] text-[#121110] border-[#E8E2D9] hover:border-[#121110]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#C5A059] text-[#121110] tracking-wider uppercase">
                      CARRUSEL COMPLETO
                    </span>
                    {shotPackMode === 'pack-3' && (
                      <Check className="w-3.5 h-3.5 text-[#C5A059] flex-shrink-0" />
                    )}
                  </div>
                  <p className="font-serif text-sm font-bold mb-1">
                    Pack 3 Fotos · Carrusel E-commerce & IG
                  </p>
                  <p className={`text-xs leading-relaxed ${shotPackMode === 'pack-3' ? 'text-stone-300' : 'text-[#7A756D]'}`}>
                    1. Portada Lookbook + 2. Movimiento Dinámico + 3. Zoom Detalle Tejido · Se generan a la vez en paralelo
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* 2. SELECTOR DE ILUMINACIÓN Y ESCENARIO */}
          <div className="space-y-3 pt-3 border-t border-[#E8E2D9]">
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

          {/* 3. FICHA COMERCIAL (PRECIO, TALLAS Y CATEGORÍA) */}
          <div className="space-y-4 pt-3 border-t border-[#E8E2D9]">
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

            {/* Price */}
            <div>
              <label className="text-xs font-semibold text-[#121110] block mb-1">
                {lookGarments.length > 1 ? 'Precio Total Look (€)' : 'Precio de Venta (€)'}
              </label>
              <div className="relative max-w-xs">
                <input
                  type="text"
                  inputMode="decimal"
                  value={priceInput}
                  onChange={(e) => handlePriceChange(e.target.value)}
                  onBlur={() => {
                    const num = parsePrice(priceInput);
                    if (num > 0) {
                      setPrice(num);
                      setPriceInput(num.toFixed(2).replace('.', ','));
                    }
                  }}
                  placeholder="19,90"
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

          {/* 4. MOTOR IA Y RESOLUCIÓN (DRAWER / ACORDEÓN PLEGABLE) */}
          <div className="pt-3 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setShowAdvancedEngine(!showAdvancedEngine)}
              className="w-full p-3.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E8E2D9] flex items-center justify-between text-left transition-all"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <div>
                  <span className="text-xs font-bold text-[#121110] block">
                    Motor IA: {engine === 'nano-banana-pro' ? 'Calidad Editorial 2K (Recomendado)' : engine === 'flux-2-max' ? 'Fotografía Realista HD' : 'Ajuste Directo'}
                  </span>
                  <span className="text-[10px] text-[#7A756D]">
                    {showAdvancedEngine ? 'Toca para ocultar opciones avanzadas' : 'Ajustes avanzados de resolución y motor'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[#7A756D]">
                {showAdvancedEngine ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </button>

            {showAdvancedEngine && (
              <div className="space-y-2 mt-3 animate-in fade-in">
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
            )}
          </div>
        </section>
      )}

      {/* ======================================================== */}
      {/* BOTÓN FLOTANTE INFERIOR CONTEXTUAL */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAF7F2]/90 backdrop-blur-xl border-t border-[#E8E2D9] z-20 shadow-[0_-8px_30px_rgba(18,17,16,0.06)]">
        <div className="max-w-lg mx-auto">
          {wizardView === 'stepper' && currentStep === 1 && (
            <div>
              <button
                type="button"
                onClick={() => {
                  if (!isStep1Ready) {
                    setErrorMessage('Haz una foto a la modelo o selecciona una Supermodelo Virtual IA para continuar.');
                    return;
                  }
                  setErrorMessage(null);
                  jumpToStep(2);
                }}
                disabled={!isStep1Ready}
                className={`w-full py-4 px-6 rounded-2xl font-serif text-sm tracking-wider font-semibold flex items-center justify-center gap-2.5 transition-all ${
                  isStep1Ready
                    ? 'bg-[#121110] text-[#FAF7F2] hover:bg-black shadow-[0_12px_30px_rgba(18,17,16,0.35)] ring-1 ring-[#C5A059]/40 active:scale-[0.99] cursor-pointer'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>Continuar a Prendas (Paso 02)</span>
                <ArrowRight className={`w-4 h-4 ${isStep1Ready ? 'text-[#C5A059]' : 'text-stone-400'}`} />
              </button>
              {!isStep1Ready && (
                <p className="text-center text-[11px] text-[#7A756D] mt-2 font-medium">
                  {modelMode === 'real'
                    ? 'Añade la foto de la modelo o cambia a Supermodelo Virtual IA'
                    : 'Selecciona una supermodelo'}
                </p>
              )}
            </div>
          )}

          {wizardView === 'stepper' && currentStep === 2 && (
            <div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => jumpToStep(1)}
                  className="py-4 px-4 rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#FAF7F2] text-[#121110] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-[#7A756D]" />
                  <span>Modelo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!isStep2Ready) {
                      setErrorMessage('Añade al menos una prenda al look actual para continuar.');
                      return;
                    }
                    setErrorMessage(null);
                    jumpToStep(3);
                  }}
                  disabled={!isStep2Ready}
                  className={`flex-1 py-4 px-4 rounded-2xl font-serif text-sm tracking-wider font-semibold flex items-center justify-center gap-2 transition-all ${
                    isStep2Ready
                      ? 'bg-[#121110] text-[#FAF7F2] hover:bg-black shadow-[0_12px_30px_rgba(18,17,16,0.35)] ring-1 ring-[#C5A059]/40 active:scale-[0.99] cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span className="truncate">Continuar a Sesión & Ficha (Paso 03)</span>
                  <ArrowRight className={`w-4 h-4 flex-shrink-0 ${isStep2Ready ? 'text-[#C5A059]' : 'text-stone-400'}`} />
                </button>
              </div>
              {!isStep2Ready && (
                <p className="text-center text-[11px] text-[#7A756D] mt-2 font-medium">
                  Añade al menos una prenda al look actual para continuar
                </p>
              )}
            </div>
          )}

          {(wizardView === 'all' || (wizardView === 'stepper' && currentStep === 3)) && (
            <div>
              <div className="flex items-center gap-2.5">
                {wizardView === 'stepper' && (
                  <button
                    type="button"
                    onClick={() => jumpToStep(2)}
                    className="py-4 px-4 rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#FAF7F2] text-[#121110] font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs flex-shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-[#7A756D]" />
                    <span>Prendas</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAction}
                  disabled={!canSubmit}
                  className={`flex-1 py-4 px-5 rounded-2xl font-serif text-sm sm:text-base tracking-wider font-semibold flex items-center justify-center gap-2.5 transition-all ${
                    canSubmit
                      ? 'bg-[#121110] text-[#FAF7F2] hover:bg-black shadow-[0_12px_30px_rgba(18,17,16,0.35)] ring-1 ring-[#C5A059]/40 active:scale-[0.99] cursor-pointer'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${canSubmit ? 'text-[#C5A059]' : 'text-stone-400'}`} />
                  <span className="truncate">
                    {shotPackMode === 'pack-3'
                      ? lookGarments.length >= 3
                        ? `Generar Pack 3 Fotos Look Completo (${lookGarments.length} Piezas)`
                        : lookGarments.length === 2
                        ? 'Generar Pack 3 Fotos Conjunto (2 Piezas)'
                        : 'Generar Pack Editorial 3 Fotos'
                      : lookGarments.length >= 3
                      ? `Vestir Look Completo (${lookGarments.length} Piezas) + Ficha`
                      : lookGarments.length === 2
                      ? 'Vestir Conjunto 2 Piezas + Ficha'
                      : 'Vestir Prenda + Ficha'}
                  </span>
                </button>
              </div>

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
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* OVERLAY / PANTALLA DE PASARELA IA A PANTALLA COMPLETA */}
      {/* ======================================================== */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-[#121110]/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center text-[#FAF7F2] animate-in fade-in duration-300">
          <div className="max-w-md w-full flex flex-col items-center space-y-6">
            <span className="font-serif text-xs uppercase tracking-[0.25em] text-[#C5A059] font-bold px-3 py-1 rounded-full border border-[#C5A059]/40 bg-[#121110]">
              PASARELA IA 2K · ATELIER VIRTUAL
            </span>

            {/* Fusion visual container */}
            <div className="relative flex items-center justify-center gap-4 py-2">
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
                {processingStage === 'locking_face_identity' && 'Fase 2/3 · Fijando y perfeccionando rasgos faciales al 100% (Identidad Real)'}
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
                    : processingStage === 'locking_face_identity'
                    ? 'w-4/5'
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
