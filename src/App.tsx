import { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  ShoppingBag,
  Camera,
  AlertCircle
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
import { executeLiveTryOnAndCatalog } from './services/aiService';
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
  const [processingStage, setProcessingStage] = useState<
    'idle' | 'adjusting_garment' | 'generating_copy' | 'completed'
  >('idle');
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
    setProcessingStage('adjusting_garment');

    try {
      const product = await executeLiveTryOnAndCatalog({
        modelDataUri: payload.modelImage.dataUri,
        garmentDataUri: payload.garmentImage.dataUri,
        garmentBase64Raw: payload.garmentImage.base64Raw,
        category: payload.category,
        price: payload.price,
        sizes: payload.sizes,
        storeName: settings.storeName || 'Boutique Rota',
        falKey: settings.falKey,
        geminiKey: settings.geminiKey,
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
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col selection:bg-stone-900 selection:text-white">
      {/* ======================================================== */}
      {/* TOP NAVBAR MOBILE-FIRST */}
      {/* ======================================================== */}
      <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5 shadow-xs">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div
            onClick={() => setActiveTab('capture')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-2xl bg-stone-900 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold font-serif-fashion tracking-tight text-stone-900">
                  {settings.storeName || 'Demo Moda IA'}
                </h1>
                {settings.simulationMode ? (
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    SIM
                  </span>
                ) : (
                  <span className="text-[9px] uppercase font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    IA REAL
                  </span>
                )}
              </div>
              <p className="text-[10px] text-stone-500 font-medium">
                Probador IA & Catálogo Express
              </p>
            </div>
          </div>

          {/* Right Action: Settings gear & status */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-2xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                isReady
                  ? 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
              }`}
              title="Ajustes de Demo"
              aria-label="Abrir ajustes de demo"
            >
              <Settings className="w-3.5 h-3.5 text-stone-700" />
              <span className="hidden sm:inline text-xs">Ajustes</span>
              {isReady ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="max-w-lg mx-auto mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'capture'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Probador en Vivo
          </button>

          {currentProduct && (
            <button
              type="button"
              onClick={() => setActiveTab('result')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'result'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Resultado
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'catalog'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Catálogo ({catalog.length})
          </button>
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
              className="text-red-500 font-bold px-2 py-0.5 hover:bg-red-100 rounded text-sm"
            >
              ✕
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
