import React, { useState } from 'react';
import {
  Download,
  Share2,
  Copy,
  Check,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  Layers,
  MessageCircle,
  Eye,
  Maximize2,
  Euro,
  Tag,
} from 'lucide-react';
import { GeneratedCatalogItem } from '../types/fashion';
import {
  downloadImage,
  buildWhatsAppReservationUrl,
} from '../utils/exportUtils';

interface ResultShowcaseProps {
  item: GeneratedCatalogItem;
  onBackToStudio: () => void;
  onSaveToCollection: () => void;
  isSaved: boolean;
}

export default function ResultShowcase({
  item,
  onBackToStudio,
  onSaveToCollection,
  isSaved,
}: ResultShowcaseProps) {
  const [activeShot, setActiveShot] = useState<'hero' | 'side' | 'detail'>('hero');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [comparisonMode, setComparisonMode] = useState<'model' | 'garment' | 'split'>('model');

  const currentDisplayUrl =
    activeShot === 'hero'
      ? item.resultHeroUrl
      : activeShot === 'side'
      ? item.resultSideUrl || item.resultHeroUrl
      : item.resultDetailUrl || item.resultHeroUrl;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(item.instagramCaption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(item.descriptionHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const whatsappUrl = buildWhatsAppReservationUrl(
    '34600000000',
    item.whatsappMessage,
    item.resultHeroUrl
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToStudio}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#75685B] hover:text-[#1A1613] transition-colors px-3 py-1.5 rounded-xl hover:bg-[#F4EFEB]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Estudio</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onSaveToCollection}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isSaved
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27]'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaved ? 'Guardado en Colección' : 'Guardar en Colección'}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Lookbook Photo Left + Product Metadata Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Editorial Photo Viewer (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-black/5 border border-[#E8E1D9] shadow-lg aspect-[3/4] max-h-[720px] flex items-center justify-center">
            {comparisonMode === 'model' && (
              <img
                src={currentDisplayUrl}
                alt={item.title}
                className="w-full h-full object-cover animate-in fade-in duration-200"
              />
            )}

            {comparisonMode === 'garment' && (
              <img
                src={item.garmentOriginalDataUri}
                alt="Prenda original"
                className="w-full h-full object-cover animate-in fade-in duration-200"
              />
            )}

            {comparisonMode === 'split' && (
              <div className="w-full h-full grid grid-cols-2">
                <div className="relative h-full overflow-hidden border-r border-white/20">
                  <img
                    src={item.garmentOriginalDataUri}
                    alt="Prenda original"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 text-[10px] uppercase tracking-wider font-semibold bg-black/60 text-white px-2 py-0.5 rounded-md">
                    Prenda Original
                  </span>
                </div>
                <div className="relative h-full overflow-hidden">
                  <img
                    src={currentDisplayUrl}
                    alt="Modelo IA"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] uppercase tracking-wider font-semibold bg-black/60 text-white px-2 py-0.5 rounded-md">
                    Modelo VTON
                  </span>
                </div>
              </div>
            )}

            {/* Comparison toggle badge on bottom left */}
            <div className="absolute top-4 left-4 flex items-center bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/10 text-white text-[10px] font-semibold">
              <button
                onClick={() => setComparisonMode('model')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  comparisonMode === 'model' ? 'bg-white text-[#1A1613]' : 'opacity-70'
                }`}
              >
                Modelo IA
              </button>
              <button
                onClick={() => setComparisonMode('garment')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  comparisonMode === 'garment' ? 'bg-white text-[#1A1613]' : 'opacity-70'
                }`}
              >
                Prenda
              </button>
              <button
                onClick={() => setComparisonMode('split')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  comparisonMode === 'split' ? 'bg-white text-[#1A1613]' : 'opacity-70'
                }`}
              >
                Dividida
              </button>
            </div>

            {/* Download Button on top right */}
            <button
              onClick={() =>
                downloadImage(currentDisplayUrl, `${item.handle}-${activeShot}.jpg`)
              }
              className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black transition-all border border-white/10"
              title="Descargar Foto HD"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Shot Lookbook selector chips */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'hero', label: '01 / Portada Lookbook' },
              { id: 'side', label: '02 / Movimiento & Perfil' },
              { id: 'detail', label: '03 / Detalle Macro Tejido' },
            ].map((shot) => {
              const isActive = activeShot === shot.id;
              return (
                <button
                  key={shot.id}
                  onClick={() => setActiveShot(shot.id as any)}
                  className={`py-2 px-3 rounded-2xl text-xs font-semibold border text-center transition-all ${
                    isActive
                      ? 'border-[#1A1613] bg-[#1A1613] text-[#FAF8F5] shadow-xs'
                      : 'border-[#E8E1D9] bg-white text-[#75685B] hover:border-[#BDB0A3]'
                  }`}
                >
                  {shot.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: E-commerce Product Metadata & Actions (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-[#E8E1D9] shadow-sm space-y-4">
            {/* Title & Price */}
            <div className="border-b border-[#F4EFEB] pb-4 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#C5A059] bg-[#FAF8F5] px-2 py-0.5 rounded-md border border-[#E8E1D9]">
                  {item.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] font-mono text-[#9B8C7E]">
                  SKU: {item.handle.slice(0, 10).toUpperCase()}
                </span>
              </div>

              <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1613] leading-tight">
                {item.title}
              </h1>

              <div className="flex items-center justify-between pt-1">
                <p className="font-serif text-2xl font-bold text-[#1A1613]">
                  {item.price.toFixed(2)}€
                </p>
                <div className="flex items-center gap-1">
                  {item.sizes.map((s) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 rounded-md border border-[#E8E1D9] text-[11px] font-mono text-[#534940] bg-[#FAF8F5]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Description HTML */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1613] uppercase tracking-wider">
                  Ficha E-commerce (Shopify / Web):
                </span>
                <button
                  onClick={handleCopyHtml}
                  className="text-xs text-[#75685B] hover:text-[#1A1613] flex items-center gap-1 font-medium"
                >
                  {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedHtml ? 'Copiado' : 'Copiar HTML'}</span>
                </button>
              </div>

              <div
                className="text-xs text-[#534940] leading-relaxed bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E1D9] prose prose-xs max-w-none"
                dangerouslySetInnerHTML={{ __html: item.descriptionHtml }}
              />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {item.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF8F5] text-[#75685B] border border-[#E8E1D9]"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Instagram / Social Caption */}
            <div className="space-y-2 pt-2 border-t border-[#F4EFEB]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1613] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                  Post para Redes Sociales:
                </span>
                <button
                  onClick={handleCopyCaption}
                  className="text-xs text-[#75685B] hover:text-[#1A1613] flex items-center gap-1 font-medium"
                >
                  {copiedCaption ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCaption ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <textarea
                readOnly
                value={item.instagramCaption}
                rows={4}
                className="w-full text-xs font-sans p-3 rounded-2xl border border-[#E8E1D9] bg-[#FAF8F5] text-[#1A1613] resize-none outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-3 space-y-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Reservar Prenda por WhatsApp</span>
              </a>

              <button
                onClick={() =>
                  downloadImage(item.resultHeroUrl, `${item.handle}-hero-hd.jpg`)
                }
                className="w-full py-2.5 px-4 rounded-2xl text-xs font-semibold border border-[#E8E1D9] text-[#1A1613] hover:bg-[#FAF8F5] transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4 text-[#C5A059]" />
                <span>Descargar Fotografía HD</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
