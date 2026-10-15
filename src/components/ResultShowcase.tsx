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
      <section className="glass-card rounded-[28px] p-6 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-stone-900 text-base font-serif-couture tracking-wide flex items-center gap-2">
            <Eye className="w-4 h-4 text-stone-700" />
            Comparativa Antes / Después
          </h2>
          {/* View toggle */}
          <div className="flex bg-[#F0EAE1]/80 p-1 rounded-xl text-[11px] font-semibold text-stone-600 border border-[#E5DAC8]/70">
            <button
              type="button"
              onClick={() => setActiveView('after')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'after'
                  ? 'bg-[#1A1816] text-[#F5EFE6] shadow-xs'
                  : 'hover:text-stone-900'
              }`}
            >
              Probada (IA)
            </button>
            <button
              type="button"
              onClick={() => setActiveView('before')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'before'
                  ? 'bg-[#1A1816] text-[#F5EFE6] shadow-xs'
                  : 'hover:text-stone-900'
              }`}
            >
              En Percha
            </button>
            <button
              type="button"
              onClick={() => setActiveView('split')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'split'
                  ? 'bg-[#1A1816] text-[#F5EFE6] shadow-xs'
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
          className="w-full py-3.5 px-4 rounded-2xl border border-[#E5DAC8] bg-[#FAF8F5] hover:bg-[#F3ECE0] text-[#2D2823] font-serif-couture tracking-wider text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99]"
        >
          <Download className="w-4 h-4 text-[#8C7654]" />
          Descargar Fotografía HD para Catálogo & Redes
        </button>
      </section>

      {/* ======================================================== */}
      {/* BOTÓN DESTACADO DE RESERVA POR WHATSAPP */}
      {/* ======================================================== */}
      <section className="glass-card rounded-[28px] p-6 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80 bg-gradient-to-br from-[#F5FAF6] via-white to-[#F0F7F3] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1E7447] text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm font-serif-couture tracking-wide">
                Reserva Inmediata por WhatsApp
              </h3>
              <p className="text-[11px] text-stone-500">Demuestra al cliente cómo recibir pedidos al instante</p>
            </div>
          </div>
        </div>

        {/* Choose size for reservation test */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-stone-600">Talla a reservar:</span>
            <div className="flex gap-1.5">
              {product.sizes.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => handleSelectSize(sz)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                    selectedSizeForWhatsapp === sz
                      ? 'bg-[#1E7447] text-white shadow-xs'
                      : 'bg-white/90 border border-[#E5DAC8] text-stone-700 hover:border-[#C4B59D]'
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
            className="text-[11px] font-semibold text-[#1E7447] hover:text-[#144F30] underline underline-offset-2"
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
              className="w-full text-xs font-sans p-3.5 rounded-2xl border border-[#A4CFB5] focus:border-[#1E7447] focus:ring-1 focus:ring-[#1E7447] outline-none transition-all leading-relaxed bg-white"
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
          <div className="p-3.5 bg-white/95 border border-[#CDE5D6] rounded-2xl text-xs text-stone-800 leading-relaxed shadow-xs flex items-start gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#1E7447] mt-1.5 flex-shrink-0" />
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
          className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-[#1E7447] via-[#228250] to-[#1E7447] hover:from-[#18623B] hover:to-[#18623B] text-white font-serif-couture tracking-wider text-sm font-semibold flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 active:scale-[0.99] transition-all"
        >
          <MessageCircle className="w-5 h-5 fill-white stroke-none" />
          Probar Reserva real por WhatsApp
        </a>
      </section>

      {/* ======================================================== */}
      {/* COPY EDITABLE DE INSTAGRAM / WHATSAPP */}
      {/* ======================================================== */}
      <section className="glass-card rounded-[28px] p-6 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm font-serif-couture tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Texto Editorial para Publicación en Redes
          </h3>
          <span className="text-[11px] text-stone-400">Editable en vivo</span>
        </div>

        <textarea
          value={captionText}
          onChange={(e) => setCaptionText(e.target.value)}
          rows={6}
          className="w-full text-xs font-sans p-4 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all leading-relaxed bg-[#FAF8F5]/60 text-stone-800"
        />

        <button
          type="button"
          onClick={handleCopyCaption}
          className={`w-full py-3.5 px-4 rounded-2xl font-serif-couture tracking-wider text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
            isCopied
              ? 'bg-[#1E7447] text-white'
              : 'bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] hover:bg-black active:scale-[0.99]'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4" />
              Copiado al portapapeles
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#D4AF37]" />
              Copiar Texto para Publicar
            </>
          )}
        </button>
      </section>

      {/* ======================================================== */}
      {/* FICHA TÉCNICA GENERADA (SEO + SKUs) */}
      {/* ======================================================== */}
      <section className="glass-card rounded-[28px] p-6 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80 space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-[#8C7654] tracking-wider">
                Ficha Comercial & SEO
              </span>
              {product.isOutfit && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#1A1816] text-[#F5EFE6] ring-1 ring-white/10">
                  Conjunto 2 Piezas
                </span>
              )}
            </div>
            <span className="text-base font-bold text-[#1A1816] font-serif-couture tracking-tight">
              {product.price.toFixed(2)} €
            </span>
          </div>
          <h3 className="text-lg font-bold text-[#1A1816] font-serif-fashion mt-1">
            {product.title}
          </h3>
          <p className="text-[11px] font-mono text-stone-500 mt-0.5">
            Handle: /{product.handle}
          </p>
        </div>

        {/* SKUs per size */}
        <div className="space-y-1.5 pt-3 border-t border-[#EDE4D5]">
          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-stone-500" />
            SKUs generados por talla (Shopify / PrestaShop)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {product.sizes.map((sz) => (
              <span
                key={sz}
                className="text-[11px] font-mono bg-[#FAF8F5] text-stone-800 px-3 py-1 rounded-xl border border-[#E5DAC8]"
              >
                {product.skuPrefix}-{sz}
              </span>
            ))}
          </div>
        </div>

        {/* HTML Description Preview */}
        <div className="space-y-1.5 pt-3 border-t border-[#EDE4D5]">
          <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-stone-500" />
            Descripción HTML Comercial
          </span>
          <div
            className="text-xs text-stone-700 prose prose-sm max-w-none bg-[#FAF8F5]/80 p-4 rounded-2xl border border-[#EDE4D5] leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {product.tags.map((tg) => (
            <span
              key={tg}
              className="inline-flex items-center gap-1 text-[11px] text-[#7A6A55] bg-[#FAF8F5] px-2.5 py-1 rounded-lg border border-[#EDE4D5]"
            >
              <Tag className="w-3 h-3 text-[#A89884]" />
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
          className="flex-1 py-4 px-4 rounded-2xl bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] font-serif-couture tracking-wider font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#D4AF37]" />
          Probar otra prenda
        </button>

        <button
          type="button"
          onClick={onGoToCatalog}
          className="py-4 px-5 rounded-2xl border border-[#DED4C0] bg-white/90 hover:bg-[#FAF6F0] text-[#1A1816] font-serif-couture tracking-wider font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          Ver Catálogo
          <ArrowRight className="w-4 h-4 text-[#8C7654]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE INSPECCIÓN HD CON ZOOM */}
      {/* ======================================================== */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0E0D0C]/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-200">
          {/* Top toolbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-stone-800">
            <div>
              <p className="text-sm font-bold text-[#F5EFE6] font-serif-couture tracking-wide">Inspección de Tejido & Confección en Alta Definición</p>
              <p className="text-[11px] text-[#A89884]">
                {activeView === 'before'
                  ? 'Fotografía original en percha'
                  : 'Prenda estilizada sobre modelo'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 hover:border-[#D4AF37]/50 flex items-center justify-center text-white transition-colors"
                title="Reducir zoom"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-[#D4AF37]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3.5, prev + 0.5))}
                className="w-8 h-8 rounded-full bg-stone-900 border border-stone-700 hover:border-[#D4AF37]/50 flex items-center justify-center text-white transition-colors"
                title="Aumentar zoom"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 ml-2 rounded-full bg-stone-900 border border-stone-700 hover:border-red-400 flex items-center justify-center text-white transition-colors"
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
