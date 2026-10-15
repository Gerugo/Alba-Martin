import { useState } from 'react';
import {
  Download,
  Trash2,
  MessageCircle,
  ShoppingBag,
  ExternalLink,
  Layers,
  Sparkles,
  AlertTriangle
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
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleExportShopify = () => {
    if (products.length === 0) return;
    exportShopifyCSV(products);
    setDownloadSuccess('CSV Shopify descargado (con UTF-8 BOM)');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportPrestaShop = () => {
    if (products.length === 0) return;
    exportPrestaShopCSV(products);
    setDownloadSuccess('CSV PrestaShop descargado (con UTF-8 BOM)');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const cleanPhone = storePhone.replace(/[^0-9]/g, '') || '34600000000';

  return (
    <div className="space-y-6 pb-28 animate-in fade-in duration-300">
      {/* Header and Exporters Bar */}
      <div className="glass-card rounded-[28px] p-6 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900 text-base font-serif-couture tracking-wide flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#8C7654]" />
              Catálogo Guardado ({products.length})
            </h2>
            <p className="text-xs text-stone-500">
              Colección preparada para exportación a tienda online
            </p>
          </div>
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-stone-400 hover:text-red-600 p-2.5 rounded-xl hover:bg-red-50/80 transition-colors"
              title="Vaciar catálogo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Confirmation Modal / Alert */}
        {showConfirmClear && (
          <div className="p-3.5 bg-red-50/80 border border-red-200/80 rounded-2xl space-y-2 text-xs text-red-800">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              ¿Confirmas eliminar todas las prendas de la colección guardada?
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-[#E5DAC8] text-stone-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-semibold"
              >
                Eliminar todo
              </button>
            </div>
          </div>
        )}

        {/* Download Feedback */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {downloadSuccess}
          </div>
        )}

        {/* Export Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportShopify}
            disabled={products.length === 0}
            className={`py-3 px-3.5 rounded-2xl text-xs font-serif-couture tracking-wider font-semibold flex items-center justify-center gap-2 shadow-xs transition-all ${
              products.length > 0
                ? 'bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] hover:bg-black active:scale-[0.99]'
                : 'bg-[#FAF8F5] text-stone-400 cursor-not-allowed border border-[#EAE0D2]'
            }`}
          >
            <Download className="w-4 h-4 text-[#D4AF37]" />
            Exportar Shopify (.CSV)
          </button>

          <button
            type="button"
            onClick={handleExportPrestaShop}
            disabled={products.length === 0}
            className={`py-3 px-3.5 rounded-2xl text-xs font-serif-couture tracking-wider font-semibold flex items-center justify-center gap-2 shadow-xs transition-all ${
              products.length > 0
                ? 'bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] hover:bg-black active:scale-[0.99]'
                : 'bg-[#FAF8F5] text-stone-400 cursor-not-allowed border border-[#EAE0D2]'
            }`}
          >
            <Download className="w-4 h-4 text-[#A89884]" />
            Exportar PrestaShop (.CSV)
          </button>
        </div>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="glass-card rounded-[28px] p-10 text-center space-y-4 border border-[#E8DFC8]/80 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)]">
          <div className="w-16 h-16 rounded-3xl bg-[#FAF6F0] text-[#8C7654] border border-[#E5DAC8] flex items-center justify-center mx-auto shadow-xs">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 text-base font-serif-couture tracking-wide">
              El catálogo está vacío
            </h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Captura tu primera prenda en percha y pruébala en la modelo virtual para construir tu lookbook comercial.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCapture}
            className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] font-serif-couture tracking-wider font-semibold text-xs inline-flex items-center gap-2 hover:bg-black shadow-md transition-all active:scale-[0.99]"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            Probar una prenda ahora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((item) => {
            const firstSize = item.sizes[0] || 'M';
            const whatsappText = buildWhatsAppMessage(storeName, item.title, item.price, firstSize);
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;

            return (
              <div
                key={item.id}
                className="glass-card rounded-[28px] p-5 shadow-[0_10px_35px_-8px_rgba(30,25,20,0.04)] border border-[#E8DFC8]/80 hover:border-[#D4AF37]/50 flex flex-col gap-3.5 transition-all"
              >
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div
                    onClick={() => onSelectProduct(item)}
                    className="w-24 h-32 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 cursor-pointer relative group border border-[#E5DAC8] shadow-xs"
                  >
                    <img
                      src={item.resultImageUrl || item.garmentPhotoBase64}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-[#8C7654] bg-[#FAF8F5] border border-[#E5DAC8] px-2 py-0.5 rounded">
                          {item.skuPrefix}
                        </span>
                        <span className="text-base font-bold text-[#1A1816] font-serif-couture tracking-tight">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>

                      <h4
                        onClick={() => onSelectProduct(item)}
                        className="font-bold text-stone-900 text-sm font-serif-fashion line-clamp-2 mt-1 hover:text-[#8C7654] cursor-pointer"
                      >
                        {item.title}
                      </h4>

                      <p className="text-[11px] font-mono text-stone-400 truncate">
                        /{item.handle}
                      </p>
                    </div>

                    {/* Sizes and Category chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {item.isOutfit && (
                        <span className="text-[9px] uppercase tracking-wider bg-[#1A1816] text-[#F5EFE6] px-2 py-0.5 rounded-full font-bold ring-1 ring-white/10">
                          Conjunto 2 Piezas
                        </span>
                      )}
                      <span className="text-[10px] bg-[#FAF8F5] text-stone-700 px-2.5 py-0.5 rounded-md font-medium flex items-center gap-1 border border-[#EDE4D5]">
                        <Layers className="w-3 h-3 text-[#A89884]" />
                        {item.productCategory}
                      </span>
                      <span className="text-[10px] bg-[#FAF8F5] text-stone-700 px-2.5 py-0.5 rounded-md font-mono border border-[#EDE4D5]">
                        {item.sizes.join(', ')}
                      </span>
                      {item.backgroundType && item.backgroundType !== 'original' && (
                        <span className="text-[10px] bg-[#FAF8F5] text-stone-700 px-2.5 py-0.5 rounded-md font-medium border border-[#EDE4D5]">
                          {item.backgroundType === 'beach' && 'Fondo: Playa'}
                          {item.backgroundType === 'studio' && 'Fondo: Estudio'}
                          {item.backgroundType === 'urban' && 'Fondo: Urbano'}
                          {item.backgroundType === 'garden' && 'Fondo: Jardín'}
                          {item.backgroundType === 'custom' && 'Fondo: Personalizado'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-[#EDE4D5] flex items-center gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1E7447] to-[#18623B] hover:from-[#18623B] hover:to-[#144F30] text-white text-xs font-serif-couture tracking-wider font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                    WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="py-2.5 px-3 rounded-xl border border-[#E5DAC8] bg-[#FAF8F5] hover:bg-[#F3ECE0] text-[#1A1816] text-xs font-serif-couture tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    Ver Ficha
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteProduct(item.id)}
                    className="p-2.5 rounded-xl border border-[#E5DAC8] text-stone-400 hover:text-red-600 hover:bg-red-50/80 transition-colors"
                    title="Eliminar de catálogo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
