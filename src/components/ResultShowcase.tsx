import { useState, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  MessageCircle,
  ArrowRight,
  Tag,
  Barcode,
  Layers,
  ArrowLeft,
  RotateCcw,
  ZoomIn,
  X,
  Plus,
  Minus,
  MoveHorizontal,
  Instagram,
  ShoppingBag
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

type ComparisonMode = 'slider' | 'after' | 'before' | 'side-by-side';

export default function ResultShowcase({
  product,
  storePhone,
  storeName,
  onTestAnother,
  onGoToCatalog,
}: ResultShowcaseProps) {
  const [viewMode, setViewMode] = useState<ComparisonMode>('slider');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Copy caption to clipboard
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
      link.download = `lookbook-2k-${product.handle}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      const link = document.createElement('a');
      link.href = product.resultImageUrl;
      link.target = '_blank';
      link.download = `lookbook-2k-${product.handle}.jpg`;
      link.click();
    }
  };

  // WhatsApp Reservation
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

  // Handle slider movement
  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      updateSliderPosition(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  };

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* PORTADA DE LOOKBOOK Y COMPARADOR INTERACTIVO 2K */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-4">
        {/* Top Header & 2K Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase bg-[#121110] text-[#C5A059] border border-[#C5A059]/40 mb-2 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse"></span>
              EDICIÓN 2K · LISTA PARA PUBLICAR
            </div>
            <h2 className="text-xl font-serif text-[#121110] font-bold">
              Portada de Lookbook Editorial
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Desliza el dedo o el ratón para comparar la prenda original con la modelo estilizada
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#E8E2D9] self-start sm:self-auto text-xs font-semibold">
            <button
              type="button"
              onClick={() => setViewMode('slider')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'slider'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Comparador
            </button>
            <button
              type="button"
              onClick={() => setViewMode('after')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'after'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Modelo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('before')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'before'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Percha
            </button>
            <button
              type="button"
              onClick={() => setViewMode('side-by-side')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                viewMode === 'side-by-side'
                  ? 'bg-[#121110] text-[#FAF7F2] shadow-xs'
                  : 'text-[#7A756D] hover:text-[#121110]'
              }`}
            >
              Ambas
            </button>
          </div>
        </div>

        {/* COMPARADOR SLIDER INTERACTIVO */}
        {viewMode === 'slider' && (
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onMouseLeave={() => setIsDragging(false)}
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
            onClick={(e) => updateSliderPosition(e.clientX)}
            className="relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[560px] bg-stone-100 border border-[#E8E2D9] shadow-md select-none cursor-ew-resize touch-none group"
          >
            {/* Base layer: RESULT (After - Model) */}
            <img
              src={product.resultImageUrl}
              alt="Modelo vistiendo la prenda"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />

            {/* Clipped layer: ORIGINAL (Before - Garment) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{
                clipPath: `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
            >
              <img
                src={product.garmentPhotoBase64}
                alt="Prenda en percha"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              />
            </div>

            {/* Vertical Divider line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              {/* Draggable Circle Handle */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-[#121110] text-[#C5A059] border-2 border-white shadow-2xl flex items-center justify-center">
                <MoveHorizontal className="w-4 h-4" />
              </div>
            </div>

            {/* Floating Labels on image */}
            <span className="absolute bottom-3 left-3 backdrop-blur-md bg-black/70 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg pointer-events-none border border-white/20">
              ORIGINAL (PERCHA)
            </span>
            <span className="absolute bottom-3 right-3 backdrop-blur-md bg-[#121110]/85 text-[#C5A059] text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg pointer-events-none border border-[#C5A059]/40">
              ESTILISMO IA (2K)
            </span>

            {/* Zoom Inspection trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="absolute top-3 right-3 backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#7A756D]" />
              <span>Inspección HD</span>
            </button>
          </div>
        )}

        {/* MODO SOLO MODELO */}
        {viewMode === 'after' && (
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[560px] bg-stone-100 border border-[#E8E2D9] shadow-md group">
            <img
              src={product.resultImageUrl}
              alt="Modelo 2K"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
            />
            <span className="absolute bottom-3 left-3 backdrop-blur-md bg-[#121110]/85 text-[#C5A059] text-[10px] font-mono font-bold px-3 py-1 rounded-xl border border-[#C5A059]/40">
              ESTILISMO IA 2K FINAL
            </span>
            <button
              type="button"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="absolute top-3 right-3 backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#7A756D]" />
              <span>Inspección HD</span>
            </button>
          </div>
        )}

        {/* MODO SOLO PERCHA */}
        {viewMode === 'before' && (
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] max-h-[560px] bg-stone-100 border border-[#E8E2D9] shadow-md group">
            <img
              src={product.garmentPhotoBase64}
              alt="Prenda en percha"
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
            />
            <span className="absolute bottom-3 left-3 backdrop-blur-md bg-black/70 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-xl border border-white/20">
              FOTOGRAFÍA ORIGINAL EN PERCHA
            </span>
            <button
              type="button"
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="absolute top-3 right-3 backdrop-blur-md bg-white/85 hover:bg-white text-[#121110] border border-white/60 shadow-md text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
            >
              <ZoomIn className="w-3.5 h-3.5 text-[#7A756D]" />
              <span>Inspección HD</span>
            </button>
          </div>
        )}

        {/* MODO AMBAS (SIDE BY SIDE) */}
        {viewMode === 'side-by-side' && (
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 border border-[#E8E2D9] cursor-pointer group"
            >
              <img
                src={product.garmentPhotoBase64}
                alt="Original"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-black/75 text-white text-[9px] font-mono px-2 py-0.5 rounded">
                PERCHA
              </span>
            </div>
            <div
              onClick={() => {
                setIsZoomModalOpen(true);
                setZoomLevel(1.5);
              }}
              className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-stone-100 border border-[#E8E2D9] cursor-pointer group"
            >
              <img
                src={product.resultImageUrl}
                alt="Modelo"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 bg-[#121110] text-[#C5A059] text-[9px] font-mono px-2 py-0.5 rounded border border-[#C5A059]/40">
                MODELO 2K
              </span>
            </div>
          </div>
        )}

        {/* PIEZAS Y ACCESORIOS QUE COMPONEN EL LOOK COMPLETO */}
        {product.isLookCompleto && product.lookItems && product.lookItems.length > 0 && (
          <div className="bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-serif text-xs uppercase tracking-[0.15em] text-[#C5A059] font-bold flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#C5A059]" />
                Piezas del Look Completo ({product.lookItems.length})
              </span>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-white border border-[#C5A059]/40 text-[#121110]">
                Estilismo Botika
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {product.lookItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-2 rounded-xl border border-[#E8E2D9] flex flex-col items-center text-center space-y-1.5 shadow-xs"
                >
                  <div className="w-full aspect-[3/4] rounded-lg overflow-hidden bg-stone-100 border border-[#E8E2D9]">
                    <img
                      src={item.dataUri}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[11px] font-bold text-[#121110] line-clamp-1">
                    {item.label}
                  </span>
                  <span className="text-[9px] font-mono uppercase text-[#7A756D] bg-[#FAF7F2] px-1.5 py-0.5 rounded-md">
                    {item.category === 'outerwear'
                      ? 'Exterior'
                      : item.category === 'top'
                      ? 'Superior'
                      : item.category === 'bottom'
                      ? 'Inferior'
                      : 'Accesorio'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Download Button */}
        <button
          type="button"
          onClick={handleDownloadPhoto}
          className="w-full py-3.5 px-4 rounded-2xl border border-[#E8E2D9] bg-[#FAF7F2] hover:bg-white text-[#121110] font-serif text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs active:scale-[0.99]"
        >
          <Download className="w-4 h-4 text-[#C5A059]" />
          <span>Descargar Fotografía Editorial 2K en Alta Definición</span>
        </button>
      </section>

      {/* ======================================================== */}
      {/* TARJETA CON ESTÉTICA DE INSTAGRAM */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-4">
        {/* Instagram Post Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/alba_martinmodas/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full overflow-hidden border border-[#C5A059]/40 shadow-xs hover:scale-105 transition-transform flex-shrink-0 bg-white p-0.5"
              title="Abrir perfil @alba_martinmodas"
            >
              <img
                src="/alba-martin-avatar.png"
                alt="Alba Martín Modas"
                className="w-full h-full object-cover rounded-full"
              />
            </a>
            <div>
              <div className="flex items-center gap-1.5">
                <a
                  href="https://www.instagram.com/alba_martinmodas/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-xs text-[#121110] hover:text-[#C5A059] transition-colors"
                >
                  @alba_martinmodas
                </a>
                <span className="w-1 h-1 rounded-full bg-[#C5A059]"></span>
                <span className="text-[10px] text-[#C5A059] font-medium">Siguiendo</span>
              </div>
              <p className="text-[10px] text-[#7A756D]">
                Colección Atelier Digital · Rota, Cádiz
              </p>
            </div>
          </div>

          <a
            href="https://www.instagram.com/alba_martinmodas/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#7A756D] hover:text-[#121110] p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
            title="Abrir Instagram @alba_martinmodas"
          >
            <Instagram className="w-4 h-4 text-[#C5A059]" />
          </a>
        </div>

        {/* Post Caption (Editable) */}
        <div>
          <label className="text-xs font-semibold text-[#121110] block mb-1.5 flex items-center justify-between">
            <span>Texto Publicación Redes Sociales</span>
            <span className="text-[10px] text-[#7A756D] font-normal">Editable</span>
          </label>
          <textarea
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            rows={5}
            className="w-full text-xs font-sans p-3.5 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all leading-relaxed bg-[#FAF7F2] text-[#121110]"
          />
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopyCaption}
          className={`w-full py-3.5 px-4 rounded-2xl font-serif text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-xs ${
            isCopied
              ? 'bg-[#1E7447] text-white'
              : 'bg-[#121110] text-[#FAF7F2] hover:bg-black active:scale-[0.99]'
          }`}
        >
          {isCopied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copiado al portapapeles</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#C5A059]" />
              <span>Copiar texto para Instagram</span>
            </>
          )}
        </button>
      </section>

      {/* ======================================================== */}
      {/* VISTA PREVIA DE FICHA E-COMMERCE & RESERVA POR WHATSAPP */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-7 border border-[#E8E2D9] shadow-sm space-y-5">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase font-bold text-[#C5A059] tracking-wider">
                VISTA PREVIA FICHA E-COMMERCE
              </span>
              {product.isOutfit && (
                <span className="text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#121110] text-[#FAF7F2]">
                  Total Look
                </span>
              )}
            </div>
            <span className="text-lg font-bold text-[#121110] font-serif">
              {product.price.toFixed(2)} €
            </span>
          </div>
          <h3 className="text-xl font-bold text-[#121110] font-serif mt-1">
            {product.title}
          </h3>
          <p className="text-[11px] font-mono text-[#7A756D] mt-0.5">
            Handle: /{product.handle}
          </p>
        </div>

        {/* SKUs per size */}
        <div className="space-y-1.5 pt-3 border-t border-[#E8E2D9]">
          <span className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
            <Barcode className="w-3.5 h-3.5 text-[#7A756D]" />
            SKUs generados por talla (Shopify / PrestaShop)
          </span>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((sz) => (
              <span
                key={sz}
                className="text-[11px] font-mono bg-[#FAF7F2] text-[#121110] px-3 py-1 rounded-xl border border-[#E8E2D9]"
              >
                {product.skuPrefix}-{sz}
              </span>
            ))}
          </div>
        </div>

        {/* HTML Description */}
        <div className="space-y-1.5 pt-3 border-t border-[#E8E2D9]">
          <span className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#7A756D]" />
            Descripción HTML Comercial
          </span>
          <div
            className="text-xs text-[#121110] prose prose-sm max-w-none bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8E2D9] leading-relaxed space-y-2"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {product.tags.map((tg) => (
            <span
              key={tg}
              className="inline-flex items-center gap-1 text-[11px] text-[#7A756D] bg-[#FAF7F2] px-2.5 py-1 rounded-lg border border-[#E8E2D9]"
            >
              <Tag className="w-3 h-3 text-[#C5A059]" />
              {tg}
            </span>
          ))}
        </div>

        {/* WhatsApp Reservation Box */}
        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#121110]">
                Talla para prueba de reserva:
              </span>
              <div className="flex gap-1.5">
                {product.sizes.map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleSelectSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      selectedSizeForWhatsapp === sz
                        ? 'bg-[#1E7447] text-white shadow-xs'
                        : 'bg-[#FAF7F2] border border-[#E8E2D9] text-[#121110] hover:border-[#121110]'
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
              className="text-[11px] font-semibold text-[#1E7447] hover:underline"
            >
              {isEditingWhatsapp ? 'Cerrar' : 'Editar texto'}
            </button>
          </div>

          {/* WhatsApp message editor or preview */}
          {isEditingWhatsapp ? (
            <div className="space-y-1.5">
              <textarea
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                rows={3}
                className="w-full text-xs font-sans p-3.5 rounded-2xl border border-[#C5A059]/50 focus:border-[#1E7447] focus:ring-1 focus:ring-[#1E7447] outline-none transition-all leading-relaxed bg-[#FAF7F2] text-[#121110]"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleResetWhatsapp}
                  className="text-[10px] text-[#7A756D] hover:text-[#121110] flex items-center gap-1 font-medium"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restablecer original
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-[#FAF7F2] border border-[#E8E2D9] rounded-2xl text-xs text-[#121110] leading-relaxed flex items-start gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#1E7447] mt-1.5 flex-shrink-0" />
              <p className="text-[11px] text-[#7A756D] flex-1">{whatsappMessage}</p>
            </div>
          )}

          {/* WhatsApp Action Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-[#1E7447] hover:bg-[#18623B] text-white font-serif text-sm font-semibold flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white stroke-none" />
            <span>Probar Reserva Real por WhatsApp</span>
          </a>
        </div>
      </section>

      {/* ======================================================== */}
      {/* BOTONES DE NAVEGACIÓN INFERIOR */}
      {/* ======================================================== */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onTestAnother}
          className="flex-1 py-4 px-4 rounded-2xl bg-[#121110] text-[#FAF7F2] font-serif font-semibold text-sm flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all shadow-md"
        >
          <ArrowLeft className="w-4 h-4 text-[#C5A059]" />
          <span>Probar otra prenda</span>
        </button>

        <button
          type="button"
          onClick={onGoToCatalog}
          className="py-4 px-5 rounded-2xl border border-[#E8E2D9] bg-white hover:bg-[#FAF7F2] text-[#121110] font-serif font-semibold text-sm flex items-center justify-center gap-2 shadow-xs transition-all"
        >
          <ShoppingBag className="w-4 h-4 text-[#C5A059]" />
          <span>Ver Catálogo</span>
          <ArrowRight className="w-4 h-4 text-[#7A756D]" />
        </button>
      </div>

      {/* ======================================================== */}
      {/* MODAL DE INSPECCIÓN HD CON ZOOM */}
      {/* ======================================================== */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#121110]/95 flex flex-col justify-between p-4 backdrop-blur-md animate-in fade-in duration-200">
          {/* Top toolbar */}
          <div className="flex items-center justify-between text-white pb-3 border-b border-[#2D2A26]">
            <div>
              <p className="text-sm font-bold text-[#FAF7F2] font-serif">
                Inspección de Tejido & Confección en Alta Definición
              </p>
              <p className="text-[11px] text-[#C5A059]">
                {viewMode === 'before' ? 'Fotografía original en percha' : 'Estilismo IA 2K sobre la modelo'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.max(1, prev - 0.5))}
                className="w-8 h-8 rounded-full bg-[#252321] border border-[#3E3A35] hover:border-[#C5A059] flex items-center justify-center text-white transition-colors"
                title="Reducir zoom"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono font-bold w-12 text-center text-[#C5A059]">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((prev) => Math.min(3.5, prev + 0.5))}
                className="w-8 h-8 rounded-full bg-[#252321] border border-[#3E3A35] hover:border-[#C5A059] flex items-center justify-center text-white transition-colors"
                title="Aumentar zoom"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-8 h-8 ml-2 rounded-full bg-[#252321] border border-[#3E3A35] hover:border-red-400 flex items-center justify-center text-white transition-colors"
                title="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Zoomable Image Container */}
          <div className="flex-1 overflow-auto flex items-center justify-center my-4 select-none touch-pan-x touch-pan-y">
            <img
              src={viewMode === 'before' ? product.garmentPhotoBase64 : product.resultImageUrl}
              alt="Detalle en alta definición"
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
          <div className="text-center text-[#7A756D] text-[11px] pt-2 border-t border-[#2D2A26]">
            Arrastra o amplía para examinar estampados, costuras y caída del tejido con nitidez 2K.
          </div>
        </div>
      )}
    </div>
  );
}
