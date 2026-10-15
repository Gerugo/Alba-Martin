import { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  MessageCircle,
  Sparkles,
  ArrowRight,
  Eye,
  Tag,
  Barcode,
  Layers,
  ArrowLeft,
  RotateCcw,
  ZoomIn,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { CatalogProduct } from '../types/catalog';
import { buildWhatsAppMessage } from '../utils/whatsappHelper';

interface ResultShowcaseProps {
  product: CatalogProduct;
  storePhone: string;
  storeName: string;
  onTestAnother: () => void;
  onGoToCatalog: () => void;
}

export default function ResultShowcase({
  product,
  storePhone,
  storeName,
  onTestAnother,
  onGoToCatalog,
}: ResultShowcaseProps) {
  const [activeView, setActiveView] = useState<'after' | 'before' | 'split'>('after');
  const [captionText, setCaptionText] = useState<string>(product.instagramCaption);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [selectedSizeForWhatsapp, setSelectedSizeForWhatsapp] = useState<string>(
    product.sizes[0] || 'M'
  );
  const [whatsappMessage, setWhatsappMessage] = useState<string>(() =>
    buildWhatsAppMessage(storeName, product.title, product.price, product.sizes[0] || 'M')
  );
  const [isEditingWhatsapp, setIsEditingWhatsapp] = useState<boolean>(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);

  // Copy Instagram caption to clipboard
  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2200);
    } catch (err) {
      console.error('Error al copiar al portapapeles', err);
    }
  };

  // Download high-res result photo
  const handleDownloadPhoto = async () => {
    try {
      const response = await fetch(product.resultImageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `foto-probador-ia-${product.handle}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Direct link fallback
      const link = document.createElement('a');
      link.href = product.resultImageUrl;
      link.target = '_blank';
      link.download = `foto-probador-ia-${product.handle}.jpg`;
      link.click();
    }
  };

  // WhatsApp Reservation message
  const cleanPhone = storePhone.replace(/[^0-9]/g, '') || '34600000000';
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const handleSelectSize = (sz: string) => {
    setSelectedSizeForWhatsapp(sz);
    setWhatsappMessage(buildWhatsAppMessage(storeName, product.title, product.price, sz));
  };

  const handleResetWhatsapp = () => {
    setWhatsappMessage(
      buildWhatsAppMessage(storeName, product.title, product.price, selectedSizeForWhatsapp)
    );
    setIsEditingWhatsapp(false);
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* COMPARADOR VISUAL ANTES / DESPUÉS */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <Eye className="w-4 h-4 text-stone-700" />
            Comparativa Antes / Después
          </h2>
          {/* View toggle */}
          <div className="flex bg-stone-100 p-0.5 rounded-xl text-[11px] font-semibold text-stone-600">
            <button
              type="button"
              onClick={() => setActiveView('after')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeView === 'after'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'hover:text-stone-900'
              }`}
            >
              Probada (IA)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('before')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeView === 'before'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'hover:text-stone-900'
              }`}
            >
              En Percha
            </button>
            <button
              type="button"
              onClick={() => setActiveView('split')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                activeView === 'split'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'hover:text-stone-900'
              }`}
            >
              Ambas
            </button>
          </div>
        </div>

        {/* Image Containers */}
        {activeView === 'split' ? (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div
              onClick={() => {
                setActiveView('before');
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] cursor-pointer group"
            >
              <img
                src={product.garmentPhotoBase64}
                alt="En percha"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Antes (Percha)
              </span>
              <span className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
              </span>
            </div>
            <div
              onClick={() => {
                setActiveView('after');
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] cursor-pointer group"
            >
              <img
                src={product.resultImageUrl}
                alt="Modelo vistiendo la prenda"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Después (IA)
              </span>
              <span className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <ZoomIn className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ) : activeView === 'before' && product.isOutfit && product.secondaryGarmentPhotoBase64 ? (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4]">
              <img src={product.garmentPhotoBase64} alt="Parte superior" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                1. Superior
              </span>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4]">
              <img src={product.secondaryGarmentPhotoBase64} alt="Parte inferior" className="w-full h-full object-cover" />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                2. Inferior
              </span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] max-h-96 flex items-center justify-center mb-3 group">
            <img
              src={activeView === 'after' ? product.resultImageUrl : product.garmentPhotoBase64}
              alt="Visualización prenda"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
            />
            {/* Zoom trigger button */}
            <button
              type="button"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="absolute top-3 right-3 bg-black/70 hover:bg-black/90 text-white px-2.5 py-1.5 rounded-xl backdrop-blur-md transition-all shadow-sm flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer"
              title="Ampliar y ver detalles de la prenda"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>Ver con zoom</span>
            </button>

            <span
              className={`absolute bottom-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md ${
                activeView === 'after' ? 'bg-emerald-600' : 'bg-stone-900'
              }`}
            >
              {activeView === 'after' ? 'Modelo con la Prenda (Probador Virtual)' : 'Foto en Percha'}
            </span>
          </div>
        )}

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownloadPhoto}
          className="w-full py-3 px-4 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-xs font-bold text-stone-800 flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99]"
        >
          <Download className="w-4 h-4 text-stone-600" />
          Descargar Foto HD para Instagram / Estados
        </button>
      </section>

      {/* ======================================================== */}
      {/* BOTÓN DESTACADO DE RESERVA POR WHATSAPP */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 rounded-3xl p-5 border border-emerald-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Prueba de Reserva por WhatsApp</h3>
              <p className="text-[11px] text-stone-500">Demuestra al cliente cómo recibir pedidos al instante</p>
            </div>
          </div>
        </div>

        {/* Choose size for reservation test */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-600">Talla a reservar:</span>
            <div className="flex gap-1">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSelectSize(sz)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedSizeForWhatsapp === sz
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditingWhatsapp(!isEditingWhatsapp)}
            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 underline"
          >
            {isEditingWhatsapp ? 'Cerrar edición' : 'Editar texto'}
          </button>
        </div>

        {/* WhatsApp message preview or editor */}
        {isEditingWhatsapp ? (
          <div className="space-y-1.5">
            <textarea
              value={whatsappMessage}
              onChange={(e) => setWhatsappMessage(e.target.value)}
              rows={3}
              className="w-full text-xs font-sans p-3 rounded-xl border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all leading-relaxed bg-white"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetWhatsapp}
                className="text-[10px] text-stone-500 hover:text-stone-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                Restablecer texto original
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-white/90 border border-emerald-200/70 rounded-2xl text-xs text-stone-800 leading-relaxed shadow-xs flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-sans text-[11px] text-stone-700">{whatsappMessage}</p>
            </div>
          </div>
        )}

        {/* WhatsApp Big Action Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white stroke-none" />
          Probar Reserva real por WhatsApp
        </a>
      </section>

      {/* ======================================================== */}
      {/* COPY EDITABLE DE INSTAGRAM / WHATSAPP */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Copy para Instagram y Estados
          </h3>
          <span className="text-[11px] text-stone-400">Editable en vivo</span>
        </div>

        <textarea
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          rows={6}
          className="w-full text-xs font-sans p-3.5 rounded-2xl border border-stone-200 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all leading-relaxed bg-stone-50/50"
        />

        <button
          type="button"
          onClick={handleCopyCaption}
          className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
            isCopied
              ? 'bg-emerald-600 text-white'
              : 'bg-stone-900 text-white hover:bg-stone-800'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              ¡Copiado al portapapeles!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar Texto para Publicar
            </>
          )}
        </button>
      </section>

      {/* ======================================================== */}
      {/* FICHA TÉCNICA GENERADA (SEO + SKUs) */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-stone-400">
                Título Comercial & SEO
              </span>
              {product.isOutfit && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-900 text-white">
                  Conjunto 2 Piezas
                </span>
              )}
            </div>
            <span className="text-sm font-bold text-stone-900 font-mono">
              {product.price.toFixed(2)} €
            </span>
          </div>
          <h3 className="text-base font-bold text-stone-900 font-serif-fashion mt-0.5">
            {product.title}
          </h3>
          <p className="text-[11px] font-mono text-stone-500 mt-0.5">
            Handle: /{product.handle}
          </p>
        </div>

        {/* SKUs per size */}
        <div className="space-y-1.5 pt-3 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-stone-500" />
            SKUs generados por talla (Shopify / PrestaShop)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((sz) => (
              <span
                key={sz}
                className="text-[11px] font-mono bg-stone-100 text-stone-800 px-2.5 py-1 rounded-lg border border-stone-200"
              >
                {product.skuPrefix}-{sz}
              </span>
            ))}
          </div>
        </div>

        {/* HTML Description Preview */}
        <div className="space-y-1.5 pt-3 border-t border-stone-100">
          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            Descripción HTML Comercial
          </span>
          <div
            className="text-xs text-stone-700 prose prose-sm max-w-none bg-stone-50 p-3.5 rounded-2xl border border-stone-100 leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {product.tags.map((tg) => (
            <span
              key={tg}
              className="inline-flex items-center gap-1 text-[11px] text-stone-600 bg-stone-100 px-2.5 py-0.5 rounded-md"
            >
              <Tag className="w-3 h-3 text-stone-400" />
              {tg}
            </span>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* BOTONES DE NAVEGACIÓN INFERIOR */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onTestAnother}
          className="flex-1 py-4 px-4 rounded-2xl bg-stone-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-[0.99] transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Probar otra prenda
        </button>

        <button
          type="button"
          onClick={onGoToCatalog}
          className="py-4 px-5 rounded-2xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-900 font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          Ver Catálogo
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE INSPECCIÓN HD CON ZOOM */}
      {/* ======================================================== */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-200">
          {/* Top toolbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800">
            <div>
              <p className="text-xs font-bold text-stone-200">Detalle de la prenda en alta resolución</p>
              <p className="text-[11px] text-stone-400">
                {activeView === 'before'
                  ? 'Foto en percha (alta resolución)'
                  : 'Modelo vistiendo la prenda (alta resolución)'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white"
                title="Reducir zoom"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-stone-300">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3.5, prev + 0.5))}
                className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white"
                title="Aumentar zoom"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 ml-2 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-white"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Zoomable Image container */}
          <div className="flex-1 overflow-auto flex items-center justify-center my-4 select-none touch-pan-x touch-pan-y">
            <img
              src={activeView === 'before' ? product.garmentPhotoBase64 : product.resultImageUrl}
              alt="Detalle de prenda en alta definición"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-out',
                maxHeight: '85vh',
                maxWidth: '95vw',
              }}
              className="object-contain rounded-xl shadow-2xl"
            />
          </div>

          {/* Bottom hint */}
          <div className="text-center text-stone-400 text-[11px] pt-2 border-t border-stone-800">
            Usa los botones de zoom o desplaza la imagen para examinar tejidos, estampados y costuras con total nitidez.
          </div>
        </div>
      )}
    </div>
  );
}
