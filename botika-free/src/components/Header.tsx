import { Sparkles, Sliders, ShoppingBag, Zap } from 'lucide-react';
import { FreeEngineType } from '../types/fashion';

interface HeaderProps {
  activeTab: 'studio' | 'gallery';
  onSelectTab: (tab: 'studio' | 'gallery') => void;
  onOpenSettings: () => void;
  savedCount: number;
  engine: FreeEngineType;
}

export default function Header({
  activeTab,
  onSelectTab,
  onOpenSettings,
  savedCount,
  engine,
}: HeaderProps) {
  const engineLabels: Record<FreeEngineType, { label: string; badgeClass: string }> = {
    'hf-gradio': {
      label: 'Hugging Face Free',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    'colab-tunnel': {
      label: 'Colab T4 GPU',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    'simulation': {
      label: 'Modo Demo',
      badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    },
  };

  const currentEngine = engineLabels[engine] || engineLabels.simulation;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E1D9] px-4 py-3 shadow-[0_2px_15px_-3px_rgba(26,22,19,0.04)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => onSelectTab('studio')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#1A1613] text-[#C5A059] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg tracking-[0.2em] font-bold text-[#1A1613] uppercase">
                Botika
              </span>
              <span className="text-[11px] font-sans font-medium tracking-wider px-2 py-0.5 rounded-full bg-[#1A1613] text-[#FAF8F5]">
                LIBRE
              </span>
            </div>
            <p className="text-[10px] tracking-wider text-[#9B8C7E] uppercase font-sans">
              Estudio Fotográfico IA · 100% Gratuito
            </p>
          </div>
        </div>

        {/* Engine status & Navigation */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Engine indicator pill */}
          <div
            onClick={onOpenSettings}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border cursor-pointer hover:opacity-85 transition-opacity ${currentEngine.badgeClass}`}
            title="Haz clic para cambiar el motor gratuito de IA"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{currentEngine.label}</span>
          </div>

          {/* Tab: Estudio */}
          <button
            onClick={() => onSelectTab('studio')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all ${
              activeTab === 'studio'
                ? 'bg-[#1A1613] text-[#FAF8F5] shadow-sm'
                : 'text-[#75685B] hover:text-[#1A1613] hover:bg-[#F4EFEB]'
            }`}
          >
            Estudio
          </button>

          {/* Tab: Colección */}
          <button
            onClick={() => onSelectTab('gallery')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium tracking-wide transition-all relative ${
              activeTab === 'gallery'
                ? 'bg-[#1A1613] text-[#FAF8F5] shadow-sm'
                : 'text-[#75685B] hover:text-[#1A1613] hover:bg-[#F4EFEB]'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Colección</span>
            {savedCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#C5A059] text-[#1A1613] font-bold text-[9px] flex items-center justify-center">
                {savedCount}
              </span>
            )}
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#75685B] hover:text-[#1A1613] hover:bg-[#F4EFEB] transition-colors border border-transparent hover:border-[#E8E1D9]"
            aria-label="Ajustes de motor"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
