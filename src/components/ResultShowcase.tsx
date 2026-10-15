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
  ArrowLeft
} from 'lucide-react';
import { CatalogProduct } from '../types/catalog';

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
  const whatsappMessage = `¡Hola ${storeName}! Acabo de ver en el catálogo el nuevo ${product.title} (${product.price.toFixed(2)}€) y quería reservar la talla ${selectedSizeForWhatsapp}.`;
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Top Wow Badge */}
      <div className="p-3 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between text-xs">
        <span className="font-bold text-stone-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          ¡Efecto WOW generado con éxito!
        </span>
        <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white">
          Listo para vender
        </span>
      </div>

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
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4]">
              <img
                src={product.garmentPhotoBase64}
                alt="En percha"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Antes (Percha)
              </span>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4]">
              <img
                src={product.resultImageUrl}
                alt="Modelo vistiendo la prenda"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                Después (IA)
              </span>
            </div>
          </div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 aspect-[3/4] max-h-96 flex items-center justify-center mb-3">
            <img
              src={activeView === 'after' ? product.resultImageUrl : product.garmentPhotoBase64}
              alt="Visualización prenda"
              className="w-full h-full object-cover"
            />
            <span
              className={`absolute bottom-3 left-3 text-white text-xs font-bold px-3 py-1 rounded-xl shadow-md ${
                activeView === 'after' ? 'bg-emerald-600' : 'bg-stone-900'
              }`}
            >
              {activeView === 'after' ? '✨ Modelo Real Vistiendo la Prenda (IA)' : 'Foto en Percha'}
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
        <div className="flex items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-stone-600">Elegir talla a probar:</span>
          <div className="flex gap-1">
            {product.sizes.map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setSelectedSizeForWhatsapp(sz)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSizeForWhatsapp === sz
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

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

        <p className="text-[11px] text-stone-500 text-center font-mono">
          Enviará: &quot;¡Hola {storeName}! Acabo de ver en el catálogo el nuevo {product.title}...&quot;
        </p>
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
            <span className="text-[10px] font-mono uppercase font-bold text-stone-400">
              Título Comercial & SEO
            </span>
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
    </div>
  );
}
