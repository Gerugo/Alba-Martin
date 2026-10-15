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
    <div className="space-y-5 pb-28 animate-in fade-in duration-300">
      {/* Header and Exporters Bar */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-stone-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-stone-700" />
              Catálogo Guardado ({products.length})
            </h2>
            <p className="text-xs text-stone-500">
              Prendas listas para exportar a tu tienda online
            </p>
          </div>
          {products.length > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmClear(true)}
              className="text-stone-400 hover:text-red-500 p-2 rounded-xl hover:bg-red-50 transition-colors"
              title="Vaciar catálogo"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Confirmation Modal / Alert */}
        {showConfirmClear && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-800">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              ¿Seguro que deseas borrar todas las prendas guardadas?
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmClear(false)}
                className="px-3 py-1 rounded-lg bg-white border border-stone-200 text-stone-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearAll();
                  setShowConfirmClear(false);
                }}
                className="px-3 py-1 rounded-lg bg-red-600 text-white font-semibold"
              >
                Sí, borrar todo
              </button>
            </div>
          </div>
        )}

        {/* Download Feedback */}
        {downloadSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            {downloadSuccess}
          </div>
        )}

        {/* Export Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleExportShopify}
            disabled={products.length === 0}
            className={`py-3 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
              products.length > 0
                ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99]'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Exportar Shopify (.CSV)
          </button>

          <button
            type="button"
            onClick={handleExportPrestaShop}
            disabled={products.length === 0}
            className={`py-3 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all ${
              products.length > 0
                ? 'bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99]'
                : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
            }`}
          >
            <Download className="w-4 h-4 text-amber-400" />
            Exportar PrestaShop (.CSV)
          </button>
        </div>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center space-y-4 border border-stone-200/80 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-900 text-sm">El catálogo está vacío</h3>
            <p className="text-xs text-stone-500 max-w-xs mx-auto">
              Captura tu primera prenda colgada en percha y pruébala en la modelo para acumular productos aquí.
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCapture}
            className="py-3 px-6 rounded-2xl bg-stone-900 text-white font-bold text-xs inline-flex items-center gap-2 hover:bg-stone-800 shadow-md transition-all"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
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
                className="bg-white rounded-3xl p-4 shadow-sm border border-stone-200/80 flex flex-col gap-3.5 hover:border-stone-300 transition-all"
              >
                <div className="flex gap-3.5">
                  {/* Thumbnail */}
                  <div
                    onClick={() => onSelectProduct(item)}
                    className="w-24 h-32 rounded-2xl overflow-hidden bg-stone-100 flex-shrink-0 cursor-pointer relative group border border-stone-200"
                  >
                    <img
                      src={item.resultImageUrl || item.garmentPhotoBase64}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-mono uppercase font-bold text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                          {item.skuPrefix}
                        </span>
                        <span className="text-sm font-bold text-stone-900 font-mono">
                          {item.price.toFixed(2)} €
                        </span>
                      </div>

                      <h4
                        onClick={() => onSelectProduct(item)}
                        className="font-bold text-stone-900 text-sm font-serif-fashion line-clamp-2 mt-1 hover:text-stone-700 cursor-pointer"
                      >
                        {item.title}
                      </h4>

                      <p className="text-[11px] font-mono text-stone-400 truncate">
                        /{item.handle}
                      </p>
                    </div>

                    {/* Sizes and Category chips */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3 text-stone-400" />
                        {item.productCategory}
                      </span>
                      <span className="text-[10px] bg-stone-100 text-stone-700 px-2 py-0.5 rounded font-mono">
                        {item.sizes.join(', ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 fill-white stroke-none" />
                    WhatsApp
                  </a>

                  <button
                    type="button"
                    onClick={() => onSelectProduct(item)}
                    className="py-2.5 px-3 rounded-xl border border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    Ver Ficha
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteProduct(item.id)}
                    className="p-2.5 rounded-xl border border-stone-200 text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
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
