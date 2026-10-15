import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
  Camera,
  Upload,
  User,
  ShoppingBag,
  Sparkles,
  Check,
  RefreshCw,
  Info,
  Layers,
  Euro,
  BookmarkCheck,
  Trash2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { ProductCategory, BackgroundType, CompressedImageResult } from '../types/catalog';
import { compressImage, formatBytes } from '../utils/imageCompressor';
import { loadSavedModel, saveModelToStorage, removeSavedModel } from '../services/settingsStorage';

export interface ProcessPayload {
  modelImage: CompressedImageResult;
  garmentImage: CompressedImageResult;
  category: ProductCategory;
  price: number;
  sizes: string[];
  backgroundType: BackgroundType;
  customBackgroundImage?: CompressedImageResult | null;
}

interface LiveCaptureWizardProps {
  onProcess: (payload: ProcessPayload) => void;
  isProcessing: boolean;
  processingStage?: 'idle' | 'adjusting_garment' | 'generating_copy' | 'replacing_background' | 'completed';
}

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Única'];

const CATEGORY_OPTIONS: { id: ProductCategory; label: string }[] = [
  { id: 'auto', label: 'Detección automática' },
  { id: 'tops', label: 'Parte superior / Chaqueta' },
  { id: 'bottoms', label: 'Pantalón / Falda' },
  { id: 'one-pieces', label: 'Vestido / Cuerpo entero' },
];

const BACKGROUND_OPTIONS: { id: BackgroundType; label: string; desc: string }[] = [
  { id: 'original', label: 'Tienda original', desc: 'Conserva el fondo original de la modelo' },
  { id: 'beach', label: 'Playa y verano', desc: 'Arena dorada, luz cálida de verano y mar suave' },
  { id: 'studio', label: 'Estudio minimalista', desc: 'Fondo neutro pulcro de fotografía de moda' },
  { id: 'urban', label: 'Calle / Terraza urbana', desc: 'Fachada elegante y terraza exterior con luz natural' },
  { id: 'garden', label: 'Jardín mediterráneo', desc: 'Terraza vegetal, olivos y muro de piedra' },
  { id: 'custom', label: 'Subir fondo propio', desc: 'Rincón de la tienda o foto propia de fondo' },
];

export default function LiveCaptureWizard({
  onProcess,
  isProcessing,
  processingStage = 'idle',
}: LiveCaptureWizardProps) {
  // Model state
  const [modelImage, setModelImage] = useState<CompressedImageResult | null>(null);
  const [saveAsDefaultModel, setSaveAsDefaultModel] = useState<boolean>(true);
  const [hasSavedModelOnDisk, setHasSavedModelOnDisk] = useState<boolean>(false);
  const [isCompressingModel, setIsCompressingModel] = useState<boolean>(false);

  // Garment state
  const [garmentImage, setGarmentImage] = useState<CompressedImageResult | null>(null);
  const [category, setCategory] = useState<ProductCategory>('auto');
  const [price, setPrice] = useState<number>(29.95);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);
  const [isCompressingGarment, setIsCompressingGarment] = useState<boolean>(false);

  // Background selector state
  const [backgroundType, setBackgroundType] = useState<BackgroundType>('original');
  const [customBgImage, setCustomBgImage] = useState<CompressedImageResult | null>(null);
  const [isCompressingBg, setIsCompressingBg] = useState<boolean>(false);

  // Error alert
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // File input refs
  const modelCameraInputRef = useRef<HTMLInputElement>(null);
  const modelGalleryInputRef = useRef<HTMLInputElement>(null);
  const garmentCameraInputRef = useRef<HTMLInputElement>(null);
  const garmentGalleryInputRef = useRef<HTMLInputElement>(null);
  const customBgCameraInputRef = useRef<HTMLInputElement>(null);
  const customBgGalleryInputRef = useRef<HTMLInputElement>(null);

  // Load saved model from storage on mount
  useEffect(() => {
    const saved = loadSavedModel();
    if (saved) {
      setHasSavedModelOnDisk(true);
      // Auto-load as initial model for fast shop workflow
      setModelImage({
        dataUri: saved.dataUri,
        base64Raw: saved.dataUri.replace(/^data:image\/[a-zA-Z0-9.+]+;base64,/, ''),
        mimeType: 'image/jpeg',
        fileSizeBytes: saved.fileSizeBytes || 180000,
        originalSizeBytes: saved.fileSizeBytes || 180000,
        width: 864,
        height: 1152,
      });
    }
  }, []);

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
      // Reset input value so same photo can be re-selected if desired
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
        width: 864,
        height: 1152,
      });
    }
  };

  const handleClearSavedModel = () => {
    removeSavedModel();
    setHasSavedModelOnDisk(false);
    setModelImage(null);
  };

  // Handle custom background change
  const handleCustomBgChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setErrorMessage(null);
      setIsCompressingBg(true);
      const compressed = await compressImage(file);
      setCustomBgImage(compressed);
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo procesar la foto de fondo. Prueba con otra imagen.');
    } finally {
      setIsCompressingBg(false);
      if (customBgCameraInputRef.current) customBgCameraInputRef.current.value = '';
      if (customBgGalleryInputRef.current) customBgGalleryInputRef.current.value = '';
    }
  };

  // Handle action submission
  const handleAction = () => {
    if (!modelImage) {
      setErrorMessage('Por favor, añade o haz la foto a la modelo (Paso 1).');
      return;
    }
    if (!garmentImage) {
      setErrorMessage('Por favor, añade o haz la foto a la prenda en percha (Paso 2).');
      return;
    }
    setErrorMessage(null);
    onProcess({
      modelImage,
      garmentImage,
      category,
      price: Number(price) || 29.95,
      sizes,
      backgroundType,
      customBackgroundImage: customBgImage,
    });
  };

  const canSubmit = Boolean(modelImage && garmentImage && !isProcessing);

  return (
    <div className="space-y-5 pb-28">
      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-500 font-bold px-2 py-0.5 hover:bg-red-100 rounded"
          >
            ✕
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
      {/* PASO 1: FOTO DE LA MODELO (DUEÑA / DEPENDIENTA) */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 transition-all">
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              1
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <User className="w-4 h-4 text-stone-700" />
                Foto de la Modelo (Dueña / Dependienta)
              </h2>
              <p className="text-[11px] text-stone-500">
                La persona real que vestirá la prenda
              </p>
            </div>
          </div>
          {modelImage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
              <Check className="w-3 h-3 stroke-[3]" /> Lista
            </span>
          )}
        </div>

        {/* Visual Guide Overlay Banner */}
        <div className="mb-4 bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="leading-snug text-[11px]">
            <strong>Guía de encuadre:</strong> De rodillas o cintura hacia arriba, mirando al frente, brazos relajados a los lados y ropa base ajustada.
          </p>
        </div>

        {/* Model State: Preview vs Capture Buttons */}
        {modelImage ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] max-h-72 flex items-center justify-center">
              <img
                src={modelImage.dataUri}
                alt="Modelo"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md rounded-xl px-3 py-1.5 text-white flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  {formatBytes(modelImage.fileSizeBytes)}
                </span>
                <span className="text-stone-300 text-[10px]">
                  {modelImage.width}×{modelImage.height}px
                </span>
              </div>
            </div>

            {/* Model actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => modelCameraInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                Repetir foto
              </button>
              <button
                type="button"
                onClick={() => modelGalleryInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                Galería
              </button>
            </div>

            {/* Save as default model toggle */}
            <div className="pt-1 flex items-center justify-between text-xs text-stone-600 border-t border-stone-100">
              <label className="flex items-center gap-2 cursor-pointer select-none">
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
                  className="rounded text-stone-900 focus:ring-stone-900 w-4 h-4"
                />
                <span className="text-[11px] font-medium text-stone-700">
                  Guardar como modelo habitual para siguientes prendas
                </span>
              </label>

              {hasSavedModelOnDisk && (
                <button
                  type="button"
                  onClick={handleClearSavedModel}
                  title="Borrar modelo guardada"
                  className="text-stone-400 hover:text-red-500 transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* If there was a saved model */}
            {hasSavedModelOnDisk && (
              <div className="p-3 bg-stone-100/80 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookmarkCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-medium text-stone-800">
                    Modelo habitual guardada disponible
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleUseSavedModel}
                  className="text-xs font-bold text-stone-900 bg-white px-3 py-1.5 rounded-xl border border-stone-300 shadow-sm hover:bg-stone-50"
                >
                  Cargar
                </button>
              </div>
            )}

            {/* Main large camera button */}
            <button
              type="button"
              onClick={() => modelCameraInputRef.current?.click()}
              disabled={isCompressingModel}
              className="w-full py-4 px-4 rounded-2xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all hover:bg-stone-800"
            >
              {isCompressingModel ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Comprimiendo foto...
                </span>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-emerald-400" />
                  Hacer foto a la modelo ahora
                </>
              )}
            </button>

            {/* Secondary gallery button */}
            <button
              type="button"
              onClick={() => modelGalleryInputRef.current?.click()}
              disabled={isCompressingModel}
              className="w-full py-3 px-4 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-stone-500" />
              Elegir de la galería
            </button>
          </div>
        )}
      </section>

      {/* ======================================================== */}
      {/* PASO 2: FOTO DE LA PRENDA EN PERCHA + DATOS BÁSICOS */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 transition-all">
        <div className="flex items-start justify-between mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs tracking-wider">
              2
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-stone-700" />
                Foto de la Prenda en Percha + Datos
              </h2>
              <p className="text-[11px] text-stone-500">
                Captura la prenda colgada y fija precio/tallas
              </p>
            </div>
          </div>
          {garmentImage && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/50">
              <Check className="w-3 h-3 stroke-[3]" /> Lista
            </span>
          )}
        </div>

        {/* Garment Image Area */}
        {garmentImage ? (
          <div className="mb-4 space-y-2">
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] max-h-72 flex items-center justify-center">
              <img
                src={garmentImage.dataUri}
                alt="Prenda en percha"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md rounded-xl px-3 py-1.5 text-white flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1 font-mono">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  {formatBytes(garmentImage.fileSizeBytes)}
                </span>
                <span className="text-stone-300 text-[10px]">
                  {garmentImage.width}×{garmentImage.height}px
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => garmentCameraInputRef.current?.click()}
                className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-stone-500" />
                Repetir foto prenda
              </button>
              <button
                type="button"
                onClick={() => garmentGalleryInputRef.current?.click()}
                className="py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 flex items-center justify-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" />
                Galería
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 space-y-2">
            <button
              type="button"
              onClick={() => garmentCameraInputRef.current?.click()}
              disabled={isCompressingGarment}
              className="w-full py-4 px-4 rounded-2xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all hover:bg-stone-800"
            >
              {isCompressingGarment ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Comprimiendo foto...
                </span>
              ) : (
                <>
                  <Camera className="w-5 h-5 text-emerald-400" />
                  Hacer foto a la prenda en percha
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => garmentGalleryInputRef.current?.click()}
              disabled={isCompressingGarment}
              className="w-full py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Upload className="w-4 h-4 text-stone-500" />
              Elegir de la galería
            </button>
          </div>
        )}

        {/* Category Selector Chips */}
        <div className="space-y-2 mb-4">
          <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
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
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price & Sizes Single Row / Responsive Section */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          {/* Price input */}
          <div className="flex items-center gap-3">
            <div className="w-32 flex-shrink-0">
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                Precio (€)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl border border-stone-300 text-sm font-bold text-stone-900 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none"
                />
                <Euro className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Sizes Chips */}
            <div className="flex-1">
              <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                Tallas disponibles ({sizes.join(', ')})
              </label>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SIZES.map((sz) => {
                  const isSelected = sizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleSize(sz)}
                      className={`h-9 px-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Selector de Fondo / Ambiente de la foto */}
        <div className="space-y-3 pt-3 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
              Escenario / Fondo de la foto
            </label>
            {backgroundType !== 'original' && (
              <button
                type="button"
                onClick={() => {
                  setBackgroundType('original');
                  setCustomBgImage(null);
                }}
                className="text-[11px] text-stone-500 hover:text-stone-800 underline"
              >
                Restablecer a tienda
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BACKGROUND_OPTIONS.map((bg) => {
              const active = backgroundType === bg.id;
              return (
                <button
                  key={bg.id}
                  type="button"
                  onClick={() => setBackgroundType(bg.id)}
                  className={`p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 shadow-sm'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold truncate">{bg.label}</span>
                    {active && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 ml-1" />}
                  </div>
                  <p className={`text-[10px] leading-tight line-clamp-2 ${active ? 'text-stone-300' : 'text-stone-500'}`}>
                    {bg.desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Upload card if custom background chosen */}
          {backgroundType === 'custom' && (
            <div className="mt-2.5 p-3 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
              <input
                ref={customBgCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleCustomBgChange}
                className="hidden"
              />
              <input
                ref={customBgGalleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleCustomBgChange}
                className="hidden"
              />

              {customBgImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={customBgImage.dataUri}
                    alt="Fondo personalizado"
                    className="w-16 h-16 rounded-xl object-cover border border-stone-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-stone-900 truncate">Fondo propio cargado</p>
                    <p className="text-[10px] text-stone-500">
                      {customBgImage.width}x{customBgImage.height} px · {formatBytes(customBgImage.fileSizeBytes)}
                    </p>
                    <div className="flex gap-2.5 mt-1.5">
                      <button
                        type="button"
                        onClick={() => customBgGalleryInputRef.current?.click()}
                        className="text-[11px] font-semibold text-stone-800 underline"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomBgImage(null)}
                        className="text-[11px] font-semibold text-red-600 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-xs font-semibold text-stone-800 mb-2">
                    Sube una foto de un rincón de la tienda o un fondo especial
                  </p>
                  <div className="flex gap-2 justify-center">
                    <button
                      type="button"
                      onClick={() => customBgCameraInputRef.current?.click()}
                      disabled={isCompressingBg}
                      className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                      Hacer foto
                    </button>
                    <button
                      type="button"
                      onClick={() => customBgGalleryInputRef.current?.click()}
                      disabled={isCompressingBg}
                      className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-stone-50"
                    >
                      <Upload className="w-3.5 h-3.5 text-stone-500" />
                      Galería
                    </button>
                  </div>
                  {isCompressingBg && (
                    <p className="text-[10px] text-stone-500 mt-2 flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Procesando foto de fondo...
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* PASO 3: BOTÓN DE ACCIÓN PRINCIPAL (STICKY / FIXED MOBILE) */}
      {/* ======================================================== */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-lg border-t border-stone-200/80 z-20 shadow-2xl">
        <div className="max-w-lg mx-auto">
          {/* Processing stage indicators */}
          {isProcessing ? (
            <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-2 shadow-lg animate-pulse">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  {processingStage === 'adjusting_garment' && '1/3 Ajustando prenda al cuerpo de la modelo...'}
                  {processingStage === 'generating_copy' && '2/3 Redactando ficha SEO y texto WhatsApp...'}
                  {processingStage === 'replacing_background' && '3/3 Integrando en el escenario de fondo...'}
                  {processingStage === 'completed' && 'Completado con éxito'}
                  {processingStage === 'idle' && 'Iniciando procesamiento IA...'}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">IA en vivo</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-emerald-500 transition-all duration-700 ${
                    processingStage === 'adjusting_garment'
                      ? 'w-1/3'
                      : processingStage === 'generating_copy'
                      ? 'w-2/3'
                      : processingStage === 'replacing_background'
                      ? 'w-11/12'
                      : 'w-full'
                  }`}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAction}
              disabled={!canSubmit}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 shadow-lg transition-all ${
                canSubmit
                  ? 'bg-stone-900 text-white hover:bg-black active:scale-[0.99] cursor-pointer'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${canSubmit ? 'text-emerald-400' : 'text-stone-400'}`} />
              <span>Vestir Modelo + Crear Ficha IA</span>
            </button>
          )}

          {/* Helper hint when incomplete */}
          {!canSubmit && !isProcessing && (
            <p className="text-center text-[11px] text-stone-500 mt-2 font-medium">
              {!modelImage && !garmentImage
                ? 'Toma la foto de la modelo (Paso 1) y de la prenda (Paso 2)'
                : !modelImage
                ? 'Falta la foto de la modelo (Paso 1)'
                : 'Falta la foto de la prenda colgada en percha (Paso 2)'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
