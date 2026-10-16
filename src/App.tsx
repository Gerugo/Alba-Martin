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

  // Load catalog on mount
  useEffect(() => {
    setCatalog(loadCatalog());
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
    setProcessingStage(payload.isOutfit ? 'adjusting_garment_top' : 'adjusting_garment');

    try {
      const product = await executeLiveTryOnAndCatalog({
        modelDataUri: payload.modelImage.dataUri,
        garmentDataUri: payload.garmentImage.dataUri,
        garmentBase64Raw: payload.garmentImage.base64Raw,
        secondaryGarmentDataUri: payload.secondaryGarmentImage?.dataUri,
        secondaryGarmentBase64Raw: payload.secondaryGarmentImage?.base64Raw,
        isOutfit: payload.isOutfit,
        category: payload.category,
        engine: payload.engine,
        sceneStyle: payload.sceneStyle,
        backgroundType: payload.backgroundType,
        customBackgroundBase64: payload.customBackgroundImage?.dataUri,
        price: payload.price,
        sizes: payload.sizes,
        storeName: settings.storeName || 'Boutique Rota',
        falKey: settings.falKey,
        geminiKey: settings.geminiKey,
        geminiModel: settings.geminiModel,
        simulationMode: settings.simulationMode,
        onStageChange: (stage) => setProcessingStage(stage),
      });

      setProcessingStage('completed');

      // Add to catalog in storage
      const updatedList = addProductToCatalog(product);
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

  const handleDeleteProduct = (id: string) => {
    const updated = deleteProductFromCatalog(id);
    setCatalog(updated);
    if (currentProduct?.id === id) {
      setCurrentProduct(null);
      setActiveTab('catalog');
    }
  };

  const handleClearCatalog = () => {
    clearCatalog();
    setCatalog([]);
    setCurrentProduct(null);
  };

  const hasFalKey = Boolean(settings.falKey);
  const hasGeminiKey = Boolean(settings.geminiKey);
  const isReady = (hasFalKey && hasGeminiKey) || settings.simulationMode;

  return (
    <div className="min-h-screen luxury-bg text-stone-900 flex flex-col selection:bg-[#1A1816] selection:text-[#F5EFE6]">
      {/* ======================================================== */}
      {/* TOP NAVBAR HAUTE COUTURE MOBILE-FIRST */}
      {/* ======================================================== */}
      <header className="border-b border-[#EBDDC9]/60 glass-luxury sticky top-0 z-30 px-4 py-3 shadow-[0_4px_25px_-5px_rgba(30,20,10,0.03)]">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('capture')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-stone-950 via-stone-900 to-stone-800 text-[#EBDDC9] flex items-center justify-center shadow-sm border border-stone-800 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold font-serif-couture tracking-[0.16em] uppercase text-stone-900">
                  {settings.storeName || 'Alba Martín'}
                </h1>
                {settings.simulationMode ? (
                  <span className="text-[9px] uppercase font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Modo Demo
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-mono font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                    IA Alta Costura
                  </span>
                )}
              </div>
              <p className="text-[10px] tracking-wider uppercase text-stone-500 font-medium font-sans">
                Boutique Virtual & Catálogo Lookbook
              </p>
            </div>
          </div>

          {/* Right Action: Settings gear & status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isReady
                  ? 'bg-white/80 border-[#EBDDC9]/80 text-stone-700 hover:bg-white shadow-xs'
                  : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
              }`}
              title="Ajustes de Demo"
              aria-label="Abrir ajustes de demo"
            >
              <Settings className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline text-xs font-serif-couture uppercase tracking-wider">Ajustes</span>
              {isReady ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar - Luxury Segmented Control */}
        <div className="max-w-lg mx-auto mt-3">
          <div className="bg-[#F0EAE1]/75 p-1 rounded-2xl border border-[#E5DAC8]/70 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('capture')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'capture'
                  ? 'bg-[#1A1816] text-[#F5EFE6] shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-white/10'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Probador</span>
            </button>

            {currentProduct && (
              <button
                type="button"
                onClick={() => setActiveTab('result')}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'result'
                    ? 'bg-[#1A1816] text-[#F5EFE6] shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-white/10'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Look Creado</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'catalog'
                  ? 'bg-[#1A1816] text-[#F5EFE6] shadow-[0_2px_10px_rgba(0,0,0,0.15)] ring-1 ring-white/10'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Colección ({catalog.length})</span>
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
              Configura tus API Keys o activa el modo simulación para la demo.
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
