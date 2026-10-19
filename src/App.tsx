import { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  ShoppingBag,
  Camera,
  AlertCircle,
  X
} from 'lucide-react';
import LiveCaptureWizard, { ProcessPayload } from './components/LiveCaptureWizard';
import ResultShowcase from './components/ResultShowcase';
import SavedCatalogTab from './components/SavedCatalogTab';
import SettingsModal from './components/SettingsModal';
import { loadSettings, saveSettings } from './services/settingsStorage';
import {
  loadCatalog,
  loadCatalogAsync,
  addProductToCatalog,
  deleteProductFromCatalog,
  clearCatalog,
} from './services/catalogStorage';
import { executeLiveTryOnAndCatalog, TryOnStage } from './services/aiService';
import { CatalogProduct, DemoSettings } from './types/catalog';

type NavigationTab = 'capture' | 'result' | 'catalog';

export default function App() {
  const [settings, setSettings] = useState<DemoSettings>(loadSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavigationTab>('capture');

  // Catalog items in local storage
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);

  // Current product in showcase
  const [currentProduct, setCurrentProduct] = useState<CatalogProduct | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStage, setProcessingStage] = useState<TryOnStage>('idle');
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Load catalog on mount (synchronous cache + full IndexedDB load)
  useEffect(() => {
    setCatalog(loadCatalog());
    loadCatalogAsync().then((items) => {
      setCatalog(items);
    });
  }, []);

  // Save settings handler
  const handleSaveSettings = (updated: DemoSettings) => {
    setSettings(updated);
    saveSettings(updated);
    setExecutionError(null);
  };

  // Run live tryon & copy generation
  const handleStartProcess = async (payload: ProcessPayload) => {
    setExecutionError(null);
    setIsProcessing(true);
    setProcessingStage(
      payload.isLookCompleto
        ? 'adjusting_look_completo'
        : payload.isOutfit
        ? 'adjusting_garment_top'
        : 'adjusting_garment'
    );

    try {
      const product = await executeLiveTryOnAndCatalog({
        modelDataUri: payload.modelImage?.dataUri || '',
        garmentDataUri: payload.garmentImage.dataUri,
        garmentBase64Raw: payload.garmentImage.base64Raw,
        secondaryGarmentDataUri: payload.secondaryGarmentImage?.dataUri,
        secondaryGarmentBase64Raw: payload.secondaryGarmentImage?.base64Raw,
        garmentPhotos:
          payload.garmentPhotos && payload.garmentPhotos.length > 0
            ? payload.garmentPhotos.map((p) => p.dataUri)
            : payload.lookItems && payload.lookItems.length > 0
            ? payload.lookItems.map((i) => i.dataUri)
            : [payload.garmentImage.dataUri],
        garmentPhotosRaw:
          payload.garmentPhotos && payload.garmentPhotos.length > 0
            ? payload.garmentPhotos.map((p) => p.base64Raw)
            : payload.lookItems && payload.lookItems.length > 0
            ? payload.lookItems.map((i) => i.base64Raw)
            : [payload.garmentImage.base64Raw],
        isOutfit: payload.isOutfit,
        isLookCompleto: payload.isLookCompleto,
        lookItems: payload.lookItems,
        category: payload.category,
        engine: payload.engine,
        sceneStyle: payload.sceneStyle,
        backgroundType: payload.backgroundType,
        customBackgroundBase64: payload.customBackgroundImage?.dataUri,
        price: payload.price,
        sizes: payload.sizes,
        storeName: settings.storeName || 'ALBA MARTÍN',
        falKey: settings.falKey,
        geminiKey: settings.geminiKey,
        geminiModel: settings.geminiModel,
        simulationMode: settings.simulationMode,
        modelMode: payload.modelMode,
        editorialRepose: payload.editorialRepose,
        virtualModel: payload.virtualModel,
        shotPackMode: payload.shotPackMode,
        onStageChange: (stage) => setProcessingStage(stage),
      });

      setProcessingStage('completed');

      // Add to catalog in storage (IndexedDB)
      const updatedList = await addProductToCatalog(product);
      setCatalog(updatedList);
      setCurrentProduct(product);

      // Short delay for completion feedback before transition
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage('idle');
        setActiveTab('result');
      }, 700);
    } catch (err: unknown) {
      console.error('Error durante el procesamiento:', err);
      setIsProcessing(false);
      setProcessingStage('idle');
      const msg = err instanceof Error ? err.message : String(err);
      setExecutionError(msg);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const updated = await deleteProductFromCatalog(id);
    setCatalog(updated);
    if (currentProduct?.id === id) {
      setCurrentProduct(null);
      setActiveTab('catalog');
    }
  };

  const handleClearCatalog = async () => {
    await clearCatalog();
    setCatalog([]);
    setCurrentProduct(null);
  };

  const hasFalKey = Boolean(settings.falKey);
  const hasGeminiKey = Boolean(settings.geminiKey);
  const isReady = hasFalKey && hasGeminiKey;

  return (
    <div className="min-h-screen luxury-silk-bg text-[#121110] flex flex-col selection:bg-[#121110] selection:text-[#FAF7F2]">
      {/* ======================================================== */}
      {/* TOP NAVBAR HAUTE COUTURE / HIGH-FASHION EDITORIAL */}
      {/* ======================================================== */}
      <header className="border-b border-[#E8E2D9] glass-luxury sticky top-0 z-30 px-4 py-3 shadow-[0_4px_25px_-5px_rgba(18,17,16,0.03)]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('capture')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/alba-martin-logo.png"
              alt={settings.storeName || 'Alba Martín · Modas y Complementos'}
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold tracking-wider uppercase bg-[#121110] text-[#C5A059] border border-[#C5A059]/40 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></span>
              2K STUDIO
            </span>
          </div>

          {/* Right Action: Settings gear & status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isReady
                  ? 'bg-white border-[#E8E2D9] text-[#121110] hover:border-[#C5A059] shadow-xs'
                  : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
              }`}
              title="Ajustes de Demo"
              aria-label="Abrir ajustes de demo"
            >
              <Settings className="w-3.5 h-3.5 text-[#121110]" />
              <span className="hidden sm:inline text-xs font-serif-editorial uppercase tracking-wider">Ajustes</span>
              {isReady ? (
                <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] ring-2 ring-[#E6D5B8]"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar - Luxury Segmented Control */}
        <div className="max-w-lg mx-auto mt-3">
          <div className="bg-white/90 p-1 rounded-2xl border border-[#E8E2D9] shadow-xs flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('capture')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                activeTab === 'capture'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-sm font-medium'
                  : 'text-[#7A756D] hover:text-[#121110] hover:bg-black/5'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Estudio en Vivo</span>
            </button>

            {currentProduct && (
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                  activeTab === 'result'
                    ? 'bg-[#121110] text-[#FAF7F2] shadow-sm font-medium'
                    : 'text-[#7A756D] hover:text-[#121110] hover:bg-black/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                <span>Look Creado</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-300 ${
                activeTab === 'catalog'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-sm font-medium'
                  : 'text-[#7A756D] hover:text-[#121110] hover:bg-black/5'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Lookbook & Catálogo ({catalog.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* API Key Status Notice if missing */}
      {!isReady && (
        <aside className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              Configura tus claves de API (Ropa y Texto) en Ajustes.
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="underline font-bold text-amber-900 ml-2"
            >
              Configurar
            </button>
          </div>
        </aside>
      )}

      {/* Execution Error Banner */}
      {executionError && (
        <aside className="bg-red-50 border-b border-red-200 px-4 py-3 text-xs text-red-800 animate-in fade-in">
          <div className="max-w-lg mx-auto flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error en la llamada a la IA:</p>
                <p className="text-[11px] text-red-700 mt-0.5">{executionError}</p>
                <p className="text-[11px] text-red-900 mt-1 font-semibold">
                  Consejo: Si no dispones de cobertura en la tienda o saldo en la API, puedes activar el <strong>Modo Simulación</strong> en Ajustes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setExecutionError(null)}
              className="text-red-500 font-bold p-1 hover:bg-red-100/80 rounded-lg"
              aria-label="Cerrar error"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}

      {/* ======================================================== */}
      {/* MAIN CONTENT AREA */}
      {/* ======================================================== */}
      <main className="flex-1 p-4 max-w-lg mx-auto w-full">
        {activeTab === 'capture' && (
          <LiveCaptureWizard
            onProcess={handleStartProcess}
            isProcessing={isProcessing}
            processingStage={processingStage}
          />
        )}

        {activeTab === 'result' && currentProduct && (
          <ResultShowcase
            product={currentProduct}
            storeName={settings.storeName || 'Boutique Rota'}
            storePhone={settings.storePhone || '34600000000'}
            onTestAnother={() => setActiveTab('capture')}
            onGoToCatalog={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'catalog' && (
          <SavedCatalogTab
            products={catalog}
            storeName={settings.storeName || 'Boutique Rota'}
            storePhone={settings.storePhone || '34600000000'}
            onSelectProduct={(p) => {
              setCurrentProduct(p);
              setActiveTab('result');
            }}
            onDeleteProduct={handleDeleteProduct}
            onClearAll={handleClearCatalog}
            onGoToCapture={() => setActiveTab('capture')}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
