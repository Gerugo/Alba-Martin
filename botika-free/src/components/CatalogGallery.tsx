import { useState } from 'react';
import {
  ShoppingBag,
  Download,
  Trash2,
  ExternalLink,
  Tag,
  Euro,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';
import { GeneratedCatalogItem } from '../types/fashion';
import { exportShopifyCSV } from '../utils/exportUtils';

interface CatalogGalleryProps {
  items: GeneratedCatalogItem[];
  onSelectItem: (item: GeneratedCatalogItem) => void;
  onDeleteItem: (id: string) => void;
  onBackToStudio: () => void;
}

export default function CatalogGallery({
  items,
  onSelectItem,
  onDeleteItem,
  onBackToStudio,
}: CatalogGalleryProps) {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filtered = items.filter((item) => {
    if (filterCategory === 'all') return true;
    return item.category === filterCategory;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E8E1D9] shadow-sm">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#1A1613]">
            Colección de Catálogo Guardada
          </h1>
          <p className="text-xs text-[#9B8C7E] mt-0.5">
            {items.length} {items.length === 1 ? 'prenda generada' : 'prendas generadas'} listas para e-commerce
          </p>
        </div>

        {items.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportShopifyCSV(items)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Exportar a Shopify (.CSV)</span>
            </button>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-[#E8E1D9] text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF8F5] text-[#9B8C7E] mx-auto flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 stroke-1" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1613]">
              Aún no has generado ninguna prenda
            </h3>
            <p className="text-xs text-[#9B8C7E] max-w-sm mx-auto mt-1">
              Sube la fotografía de una prenda en percha o flat-lay y viste a una modelo IA
              para comenzar tu colección.
            </p>
          </div>
          <button
            onClick={onBackToStudio}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] transition-all"
          >
            <span>Ir al Estudio de Moda</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group bg-white rounded-2xl overflow-hidden border border-[#E8E1D9] hover:border-[#1A1613] transition-all shadow-xs hover:shadow-md flex flex-col"
            >
              <div
                onClick={() => onSelectItem(item)}
                className="relative aspect-[3/4] bg-black/5 overflow-hidden cursor-pointer"
              >
                <img
                  src={item.resultHeroUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-md">
                  {item.price.toFixed(2)}€
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h3
                    onClick={() => onSelectItem(item)}
                    className="font-serif text-sm font-bold text-[#1A1613] line-clamp-1 cursor-pointer group-hover:text-[#C5A059]"
                  >
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-[#9B8C7E] mt-0.5">
                    Modelo: {item.modelProfile.name}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[#F4EFEB]">
                  <button
                    onClick={() => onSelectItem(item)}
                    className="text-xs font-semibold text-[#1A1613] hover:text-[#C5A059] flex items-center gap-1"
                  >
                    <span>Ver ficha</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="text-[#9B8C7E] hover:text-red-600 p-1 transition-colors"
                    title="Eliminar de colección"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
