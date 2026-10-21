import { useState, useEffect } from 'react';
import {
  Sparkles,
  Zap,
  ShoppingBag,
  Sliders,
  AlertCircle,
  X,
  CheckCircle,
} from 'lucide-react';
import Header from './components/Header';
import GarmentUploader from './components/GarmentUploader';
import ModelSelector from './components/ModelSelector';
import SceneSelector from './components/SceneSelector';
import EngineSettingsModal from './components/EngineSettingsModal';
import GenerationProgress from './components/GenerationProgress';
import ResultShowcase from './components/ResultShowcase';
import CatalogGallery from './components/CatalogGallery';
import {
  AIModelProfile,
  GarmentData,
  GeneratedCatalogItem,
  ScenePreset,
} from './types/fashion';
import { BotikaFreeSettings, DEFAULT_SETTINGS } from './types/settings';
import { PRESET_MODELS } from './services/modelPresets';
import {
  loadStoredSettings,
  saveStoredSettings,
  getSavedCatalogAsync,
  saveCatalogItem,
  deleteCatalogItem,
} from './services/storageService';
import { executeFreeTryOn } from './services/vtonService';
import { generateFashionMetadataFree } from './services/geminiFreeService';

export default function App() {
  const [settings, setSettings] = useState<BotikaFreeSettings>(loadStoredSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'studio' | 'gallery'>('studio');

  // Studio Flow State
  const [garment, setGarment] = useState<GarmentData | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModelProfile>(PRESET_MODELS[0]);
  const [customModelDataUri, setCustomModelDataUri] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] = useState<ScenePreset>('studio_minimal');
  const [price, setPrice] = useState<number>(39.95);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L']);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result & Catalog
  const [currentResult, setCurrentResult] = useState<GeneratedCatalogItem | null>(null);
  const [catalog, setCatalog] = useState<GeneratedCatalogItem[]>([]);

  // Load saved catalog items on mount
  useEffect(() => {
    getSavedCatalogAsync().then((items) => setCatalog(items));
  }, []);

  const handleSaveSettings = (updated: BotikaFreeSettings) => {
    setSettings(updated);
    saveStoredSettings(updated);
  };

  const handleStartGeneration = async () => {
    if (!garment) {
      alert('Por favor, sube primero una foto de la prenda.');
      return;
    }

    setErrorMessage(null);
    setIsGenerating(true);
    setCurrentStep('Iniciando estudio fotográfico con motor 100% gratuito...');
    setProgressPercent(10);

    try {
      // 1. Run Virtual Try-On
      const tryOnPromise = executeFreeTryOn({
        model: selectedModel,
        customModelDataUri: customModelDataUri || undefined,
        garment,
        scene: selectedScene,
        engine: settings.engine,
        hfSpaceEndpoint: settings.hfSpaceEndpoint,
        colabTunnelUrl: settings.colabTunnelUrl,
        onStepProgress: (step, percent) => {
          setCurrentStep(step);
          setProgressPercent(percent);
        },
      });

      // 2. Run Gemini Free Tier for SEO copy in parallel
      const metadataPromise = generateFashionMetadataFree(
        garment.base64Raw,
        price,
        sizes,
        settings.storeName,
        settings.storePhone,
        settings.geminiApiKey,
        settings.geminiModel
      );

      // Execute both in parallel
      const [vtonResult, metadata] = await Promise.all([tryOnPromise, metadataPromise]);

      const newItem: GeneratedCatalogItem = {
        id: 'look-' + Date.now().toString(),
        createdAt: new Date().toISOString(),
        title: metadata.title,
        handle: metadata.handle,
        descriptionHtml: metadata.descriptionHtml,
        tags: metadata.tags,
        price,
        sizes,
        vendor: settings.storeName,
        category: garment.category,
        modelProfile: selectedModel,
        scene: selectedScene,
        engineUsed: settings.engine,
        garmentOriginalDataUri: garment.dataUri,
        resultHeroUrl: vtonResult.heroUrl,
        resultSideUrl: vtonResult.sideUrl,
        resultDetailUrl: vtonResult.detailUrl,
        instagramCaption: metadata.instagramCaption,
        whatsappMessage: metadata.whatsappMessage,
      };

      setCurrentResult(newItem);
      const updatedCatalog = await saveCatalogItem(newItem);
      setCatalog(updatedCatalog);
      setIsGenerating(false);
    } catch (err: unknown) {
      console.error('Error generando lookbook:', err);
      setIsGenerating(false);
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    }
  };

  const handleDeleteItem = async (id: string) => {
    const updated = await deleteCatalogItem(id);
    setCatalog(updated);
    if (currentResult?.id === id) {
      setCurrentResult(null);
    }
  };

  const isCurrentSaved = Boolean(
    currentResult && catalog.some((c) => c.id === currentResult.id)
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1613] flex flex-col font-sans">
      {/* Top Navigation */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setErrorMessage(null);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        savedCount={catalog.length}
        engine={settings.engine}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-start justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Error durante el procesamiento</p>
                <p className="text-xs text-red-800 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Studio */}
        {activeTab === 'studio' && (
          <>
            {currentResult ? (
              <ResultShowcase
                item={currentResult}
                onBackToStudio={() => setCurrentResult(null)}
                onSaveToCollection={async () => {
                  if (currentResult) {
                    const updated = await saveCatalogItem(currentResult);
                    setCatalog(updated);
                  }
                }}
                isSaved={isCurrentSaved}
              />
            ) : (
              <div className="space-y-6">
                {/* Hero Editorial Subheader */}
                <div className="text-center py-4 space-y-1.5">
                  <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.2em] text-[#C5A059]">
                    Generador de Sesiones On-Model
                  </span>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1613]">
                    Convierte Fotos Planas en Catálogo de Moda Profesional
                  </h1>
                  <p className="text-xs text-[#75685B] max-w-md mx-auto">
                    Misma calidad que Botika.com ejecutado al 100% en infraestructura abierta y gratuita.
                  </p>
                </div>

                {/* Step 1: Garment Photo */}
                <GarmentUploader
                  garment={garment}
                  onGarmentChange={setGarment}
                  price={price}
                  onPriceChange={setPrice}
                  sizes={sizes}
                  onSizesChange={setSizes}
                />

                {/* Step 2: AI Fashion Model Picker */}
                <ModelSelector
                  selectedModel={selectedModel}
                  onSelectModel={setSelectedModel}
                  customModelDataUri={customModelDataUri}
                  onCustomModelChange={setCustomModelDataUri}
                />

                {/* Step 3: Studio & Scene Environment */}
                <SceneSelector
                  selectedScene={selectedScene}
                  onSelectScene={setSelectedScene}
                />

                {/* Primary Sticky Action Button */}
                <div className="sticky bottom-4 z-20 pt-2">
                  <div className="bg-white/80 backdrop-blur-md p-3 rounded-3xl border border-[#E8E1D9] shadow-xl max-w-md mx-auto">
                    <button
                      type="button"
                      disabled={!garment || isGenerating}
                      onClick={handleStartGeneration}
                      className={`w-full py-4 px-6 rounded-2xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-md ${
                        !garment
                          ? 'bg-[#E8E1D9] text-[#9B8C7E] cursor-not-allowed'
                          : 'bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] hover:scale-[1.01]'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#C5A059]" />
                      <span>Vestir Modelo con IA (100% Gratis)</span>
                    </button>
                    {!garment && (
                      <p className="text-[10px] text-center text-[#9B8C7E] mt-1.5 font-medium">
                        Sube una foto o selecciona una prenda de muestra arriba para activar
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Gallery */}
        {activeTab === 'gallery' && (
          <CatalogGallery
            items={catalog}
            onSelectItem={(item) => {
              setCurrentResult(item);
              setActiveTab('studio');
            }}
            onDeleteItem={handleDeleteItem}
            onBackToStudio={() => {
              setCurrentResult(null);
              setActiveTab('studio');
            }}
          />
        )}
      </main>

      {/* Generation Progress Modal */}
      {isGenerating && (
        <GenerationProgress
          currentStep={currentStep}
          progressPercent={progressPercent}
        />
      )}

      {/* Settings Modal */}
      <EngineSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Footer */}
      <footer className="border-t border-[#E8E1D9] bg-white py-4 text-center text-xs text-[#9B8C7E]">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Botika Libre · Pipeline de Moda e-Commerce 100% Gratuito</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-[#75685B] hover:text-[#1A1613] underline text-[11px]"
            >
              Configurar Motores Gratuitos
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
