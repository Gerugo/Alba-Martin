import { useState } from 'react';
import {
  Download,
  Trash2,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  Instagram
} from 'lucide-react';
import { CatalogProduct } from '../types/catalog';
import { exportShopifyCSV, exportPrestaShopCSV } from '../utils/csvExporter';
import { buildWhatsAppMessage } from '../utils/whatsappHelper';

interface SavedCatalogTabProps {
  products: CatalogProduct[];
  storeName: string;
  storePhone: string;
  onSelectProduct: (product: CatalogProduct) => void;
  onDeleteProduct: (id: string) => void;
  onClearAll: () => void;
  onGoToCapture: () => void;
}

export default function SavedCatalogTab({
  products,
  storeName,
  storePhone,
  onSelectProduct,
  onDeleteProduct,
  onClearAll,
  onGoToCapture,
}: SavedCatalogTabProps) {
  const [showConfirmClear, setShowConfirmClear] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExportShopify = () => {
    if (products.length === 0) return;
    exportShopifyCSV(products);
    setDownloadSuccess('CSV Shopify descargado correctamente (UTF-8 con BOM)');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportPrestaShop = () => {
    if (products.length === 0) return;
    exportPrestaShopCSV(products);
    setDownloadSuccess('CSV PrestaShop descargado correctamente (UTF-8 con BOM)');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const cleanPhone = storePhone.replace(/[^0-9]/g, '') || '34600000000';

  // Calculate inventory total value
  const totalValue = products.reduce((acc, curr) => acc + (curr.price || 0), 0);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* PANEL EJECUTIVO OSCURO DE INVENTARIO & EXPORTACIÓN CSV */}
      {/* ======================================================== */}
      <section className="bg-[#121110] text-[#FAF7F2] rounded-3xl p-6 sm:p-7 border border-[#2D2A26] shadow-xl space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-serif text-[10px] uppercase tracking-[0.25em] text-[#C5A059] font-bold block mb-1">
              PANEL EJECUTIVO DE COLECCIÓN
            </span>
            <h2 className="text-xl sm:text-2xl font-serif text-[#FAF7F2] font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C5A059]" />
              Lookbook & Escaparate Digital
            </h2>
            <p className="text-xs text-[#7A756D] mt-0.5">
              Gestión editorial de prendas, valor de catálogo y sincronización e-commerce
            </p>
            <a
              href="https://www.instagram.com/alba_martinmodas/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#C5A059] hover:underline mt-1.5 font-medium"
            >
              <Instagram className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>@alba_martinmodas</span>
            </a>
          </div>

          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-[#7A756D] hover:text-red-400 p-2 rounded-xl hover:bg-white/5 transition-colors"
              title="Vaciar catálogo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Confirmation Alert */}
        {showConfirmClear && (
          <div className="p-4 bg-red-950/50 border border-red-800/80 rounded-2xl space-y-2.5 text-xs text-red-200 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>¿Confirmas eliminar todas las prendas de la colección guardada?</span>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF7F2] font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Eliminar todo
              </button>
            </div>
          </div>
        )}

        {/* Inventory Summary Metrics */}
        <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-[#252321]">
          <div className="bg-[#1C1A18] p-3 rounded-2xl border border-[#2D2A26]">
            <span className="text-[10px] text-[#7A756D] uppercase tracking-wider block font-medium">
              Prendas
            </span>
            <span className="text-lg sm:text-xl font-bold font-serif text-[#FAF7F2]">
              {products.length}
            </span>
          </div>
          <div className="bg-[#1C1A18] p-3 rounded-2xl border border-[#2D2A26]">
            <span className="text-[10px] text-[#7A756D] uppercase tracking-wider block font-medium">
              Valor Catálogo
            </span>
            <span className="text-lg sm:text-xl font-bold font-serif text-[#C5A059]">
              {totalValue.toFixed(2)} €
            </span>
          </div>
          <div className="bg-[#1C1A18] p-3 rounded-2xl border border-[#2D2A26]">
            <span className="text-[10px] text-[#7A756D] uppercase tracking-wider block font-medium">
              Fotografía
            </span>
            <span className="text-lg sm:text-xl font-bold font-serif text-emerald-400">
              2K HD
            </span>
          </div>
        </div>

        {/* Download Success Notice */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-700/60 rounded-2xl text-xs font-semibold text-emerald-300 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Professional CSV Export Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportShopify}
            disabled={products.length === 0}
            className={`py-3.5 px-4 rounded-2xl text-xs font-serif tracking-wider font-semibold flex items-center justify-center gap-2.5 transition-all ${
              products.length > 0
                ? 'bg-white text-[#121110] hover:bg-[#FAF7F2] shadow-sm active:scale-[0.99] cursor-pointer'
                : 'bg-white/10 text-stone-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Download className={`w-4 h-4 ${products.length > 0 ? 'text-[#C5A059]' : 'text-stone-500'}`} />
            <span>Exportar CSV Shopify</span>
          </button>

          <button
            type="button"
            onClick={handleExportPrestaShop}
            disabled={products.length === 0}
            className={`py-3.5 px-4 rounded-2xl text-xs font-serif tracking-wider font-semibold flex items-center justify-center gap-2.5 transition-all ${
              products.length > 0
                ? 'bg-[#252321] text-[#FAF7F2] hover:bg-[#2F2C29] border border-[#3E3A35] shadow-sm active:scale-[0.99] cursor-pointer'
                : 'bg-white/10 text-stone-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <Download className={`w-4 h-4 ${products.length > 0 ? 'text-[#C5A059]' : 'text-stone-500'}`} />
            <span>Exportar CSV PrestaShop</span>
          </button>
        </div>
      </section>

      {/* ======================================================== */}
      {/* CUADRÍCULA DE MODA TIPO ZARA / MASSIMO DUTTI (2 COLUMNAS) */}
      {/* ======================================================== */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center space-y-4 border border-[#E8E2D9] shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF7F2] text-[#C5A059] border border-[#E8E2D9] flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#121110] text-lg font-serif">
              El lookbook está vacío
            </h3>
            <p className="text-xs text-[#7A756D] max-w-xs mx-auto">
              Captura tu primera prenda en percha y pruébala en la modelo virtual para generar tu escaparate digital.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCapture}
            className="py-3.5 px-6 rounded-2xl bg-[#121110] text-[#FAF7F2] font-serif tracking-wider font-semibold text-xs inline-flex items-center gap-2 hover:bg-black shadow-md transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            <span>Probar una prenda ahora</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:gap-6">
          {products.map((item) => {
            const firstSize = item.sizes[0] || 'M';
            const whatsappText = buildWhatsAppMessage(storeName, item.title, item.price, firstSize);
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-[#E8E2D9] shadow-sm hover:shadow-md hover:border-[#C5A059]/50 flex flex-col justify-between transition-all group"
              >
                <div>
                  {/* Vertical 3:4 Photograph Frame */}
                  <div
                    onClick={() => onSelectProduct(item)}
                    className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-stone-100 cursor-pointer border border-[#E8E2D9]"
                  >
                    <img
                      src={item.resultImageUrl || item.garmentPhotosBase64?.[0] || item.garmentPhotoBase64}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Badge top-left */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {item.resultImageUrls && item.resultImageUrls.length > 1 ? (
                        <span className="text-[9px] uppercase tracking-wider bg-[#C5A059] text-[#121110] px-2 py-0.5 rounded font-mono font-bold">
                          Pack {item.resultImageUrls.length} Fotos
                        </span>
                      ) : null}
                      {item.isLookCompleto ? (
                        <span className="text-[9px] uppercase tracking-wider bg-[#121110] text-[#C5A059] border border-[#C5A059]/40 px-2 py-0.5 rounded font-mono font-bold">
                          Look Completo
                        </span>
                      ) : item.isOutfit ? (
                        <span className="text-[9px] uppercase tracking-wider bg-[#121110] text-[#FAF7F2] px-2 py-0.5 rounded font-mono font-bold">
                          Total Look
                        </span>
                      ) : null}
                      <span className="text-[9px] uppercase tracking-wider bg-black/60 backdrop-blur-md text-white px-2 py-0.5 rounded font-mono">
                        {item.productCategory}
                      </span>
                    </div>

                    {/* Carousel indicator dots */}
                    {item.resultImageUrls && item.resultImageUrls.length > 1 && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-1 z-10 pointer-events-none">
                        {item.resultImageUrls.map((_, dotIdx) => (
                          <span
                            key={dotIdx}
                            className={`h-1 rounded-full ${
                              dotIdx === 0 ? 'w-3.5 bg-[#C5A059]' : 'w-1 bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Floating Zoom / Open on hover */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="backdrop-blur-md bg-white/90 text-[#121110] px-3 py-1.5 rounded-xl text-xs font-serif font-semibold shadow-md flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Ver Ficha</span>
                      </span>
                    </div>
                  </div>

                  {/* Editorial Info */}
                  <div className="pt-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-[#7A756D] font-mono">
                      <span>{item.skuPrefix}</span>
                      <span>{item.sizes.join(' · ')}</span>
                    </div>

                    <h4
                      onClick={() => onSelectProduct(item)}
                      className="font-serif font-semibold text-[#121110] text-sm sm:text-base line-clamp-2 leading-snug hover:text-[#C5A059] cursor-pointer transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </h4>

                    <p className="font-serif font-bold text-base text-[#121110]">
                      {item.price.toFixed(2)} €
                    </p>
                  </div>
                </div>

                {/* Card Action Buttons: Quick WhatsApp Button */}
                <div className="pt-3 border-t border-[#E8E2D9] mt-3 space-y-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 px-3 rounded-xl bg-[#1E7447] hover:bg-[#18623B] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                    <span>WhatsApp</span>
                  </a>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectProduct(item)}
                      className="text-[11px] font-serif font-semibold text-[#121110] hover:text-[#C5A059] flex items-center gap-1"
                    >
                      <span>Detalles</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteProduct(item.id)}
                      className="text-stone-400 hover:text-red-600 p-1 rounded-lg transition-colors"
                      title="Eliminar prenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
