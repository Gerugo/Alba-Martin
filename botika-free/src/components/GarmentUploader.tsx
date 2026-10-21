import React, { useState } from 'react';
import {
  Upload,
  Camera,
  Shirt,
  Sparkles,
  Check,
  Tag,
  Euro,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { GarmentData, ProductCategory } from '../types/fashion';
import { processImageForTryOn } from '../utils/imageUtils';

interface GarmentUploaderProps {
  garment: GarmentData | null;
  onGarmentChange: (data: GarmentData) => void;
  price: number;
  onPriceChange: (p: number) => void;
  sizes: string[];
  onSizesChange: (s: string[]) => void;
}

const SAMPLE_GARMENTS = [
  {
    name: 'Blazer de Lino Marfil',
    category: 'outerwear' as ProductCategory,
    price: 89.95,
    url: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
  },
  {
    name: 'Vestido Seda Terracota',
    category: 'dresses' as ProductCategory,
    price: 65.0,
    url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&q=80',
  },
  {
    name: 'Top Minimalist Blanco',
    category: 'upper_body' as ProductCategory,
    price: 29.95,
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&q=80',
  },
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'Única'];

export default function GarmentUploader({
  garment,
  onGarmentChange,
  price,
  onPriceChange,
  sizes,
  onSizesChange,
}: GarmentUploaderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const processed = await processImageForTryOn(file);
      onGarmentChange({
        dataUri: processed.dataUri,
        base64Raw: processed.base64Raw,
        fileSizeBytes: processed.fileSizeBytes,
        category: garment?.category || 'upper_body',
      });
    } catch (e) {
      console.error('Error procesando imagen de prenda:', e);
      alert('Hubo un problema al procesar la imagen seleccionada.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = async (sample: (typeof SAMPLE_GARMENTS)[0]) => {
    setIsProcessing(true);
    try {
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
      const processed = await processImageForTryOn(file);
      onGarmentChange({
        dataUri: processed.dataUri,
        base64Raw: processed.base64Raw,
        fileSizeBytes: processed.fileSizeBytes,
        category: sample.category,
        titleSuggestion: sample.name,
      });
      onPriceChange(sample.price);
    } catch (err) {
      console.error('Error cargando prenda de muestra:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleSize = (size: string) => {
    if (sizes.includes(size)) {
      if (sizes.length > 1) {
        onSizesChange(sizes.filter((s) => s !== size));
      }
    } else {
      onSizesChange([...sizes, size]);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D9] shadow-sm space-y-5">
      {/* Step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E1D9] text-[#1A1613] font-serif font-bold text-sm flex items-center justify-center">
            1
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-[#1A1613] tracking-wide">
              Fotografía de la Prenda
            </h2>
            <p className="text-xs text-[#9B8C7E]">
              Flat-lay, percha, maniquí o catálogo existente
            </p>
          </div>
        </div>
        {garment && (
          <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <Check className="w-3 h-3" /> Prenda lista ({(garment.fileSizeBytes / 1024).toFixed(0)} KB)
          </span>
        )}
      </div>

      {/* Main Upload Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center ${
          dragActive
            ? 'border-[#C5A059] bg-[#FAF8F5]'
            : garment
            ? 'border-[#E8E1D9] bg-[#FAF8F5]/60'
            : 'border-[#D5C9BE] hover:border-[#1A1613] bg-white'
        }`}
      >
        {isProcessing ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#C5A059] animate-spin" />
            <p className="text-xs font-medium text-[#75685B]">
              Comprimiendo y optimizando tejido para IA...
            </p>
          </div>
        ) : garment ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative w-36 h-48 rounded-xl overflow-hidden shadow-md bg-black/5 flex-shrink-0 border border-[#E8E1D9]">
              <img
                src={garment.dataUri}
                alt="Prenda subida"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-2">
                <span className="text-[10px] text-white font-medium">Prenda cargada</span>
              </div>
            </div>

            <div className="flex-1 text-left space-y-3">
              <p className="text-xs text-[#534940] leading-relaxed">
                Fotografía lista para transferir con <strong>IDM-VTON</strong>. El motor
                eliminará perchas y fondo para fusionar la textura y el estampado en el
                cuerpo de la modelo.
              </p>

              <div className="flex items-center gap-2">
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Cambiar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center shadow-xs">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1A1613]">
                Arrastra aquí la foto de la prenda
              </p>
              <p className="text-xs text-[#9B8C7E] mt-0.5">
                o selecciona desde tu móvil o galería
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] transition-all shadow-xs">
                <Camera className="w-3.5 h-3.5" />
                <span>Hacer foto ahora</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-[#E8E1D9] text-[#1A1613] hover:bg-[#FAF8F5] transition-all">
                <ImageIcon className="w-3.5 h-3.5 text-[#9B8C7E]" />
                <span>Elegir archivo</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Quick Test Samples */}
      {!garment && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#75685B] uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[#C5A059]" />
            Prueba rápida con prendas de muestra (1 clic):
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SAMPLE_GARMENTS.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectSample(s)}
                className="flex items-center gap-2 p-2 rounded-xl border border-[#E8E1D9] bg-[#FAF8F5] hover:border-[#1A1613] hover:bg-white transition-all text-left group"
              >
                <img
                  src={s.url}
                  alt={s.name}
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-[#1A1613] truncate group-hover:text-[#C5A059]">
                    {s.name}
                  </p>
                  <p className="text-[10px] text-[#9B8C7E]">{s.price}€</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category, Price & Sizes Controls */}
      <div className="pt-2 border-t border-[#F4EFEB] space-y-4">
        {/* Category Selector */}
        <div>
          <label className="block text-xs font-semibold text-[#1A1613] mb-2 flex items-center gap-1.5">
            <Shirt className="w-3.5 h-3.5 text-[#C5A059]" />
            Tipo de Prenda:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'upper_body', label: 'Parte de Arriba' },
              { id: 'lower_body', label: 'Pantalón / Falda' },
              { id: 'dresses', label: 'Vestido' },
              { id: 'outerwear', label: 'Chaqueta / Blazer' },
            ].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() =>
                  garment &&
                  onGarmentChange({ ...garment, category: c.id as ProductCategory })
                }
                className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  garment?.category === c.id
                    ? 'border-[#1A1613] bg-[#1A1613] text-[#FAF8F5] shadow-xs'
                    : 'border-[#E8E1D9] bg-white text-[#75685B] hover:border-[#BDB0A3]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Price and Sizes in one line */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Price */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1613] mb-1.5 flex items-center gap-1.5">
              <Euro className="w-3.5 h-3.5 text-[#C5A059]" />
              Precio PVP (€):
            </label>
            <input
              type="number"
              step="0.05"
              value={price}
              onChange={(e) => onPriceChange(parseFloat(e.target.value) || 0)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E8E1D9] bg-[#FAF8F5] focus:bg-white focus:border-[#1A1613] outline-none transition-all font-mono"
            />
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-xs font-semibold text-[#1A1613] mb-1.5 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#C5A059]" />
              Tallas Disponibles:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_SIZES.map((sz) => {
                const isActive = sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                      isActive
                        ? 'border-[#1A1613] bg-[#1A1613] text-[#FAF8F5]'
                        : 'border-[#E8E1D9] bg-white text-[#75685B] hover:border-[#BDB0A3]'
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
