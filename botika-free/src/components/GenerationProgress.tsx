import { RefreshCw, Sparkles, Layers, Wand2 } from 'lucide-react';

interface GenerationProgressProps {
  currentStep: string;
  progressPercent: number;
}

export default function GenerationProgress({
  currentStep,
  progressPercent,
}: GenerationProgressProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-[#E8E1D9] shadow-2xl text-center space-y-6">
        {/* Animated Icon Ring */}
        <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-[#FAF8F5]"></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-[#1A1613] border-t-transparent animate-spin"
            style={{ animationDuration: '2s' }}
          ></div>
          <div className="w-16 h-16 rounded-full bg-[#FAF8F5] text-[#C5A059] flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
        </div>

        {/* Title & Stage */}
        <div className="space-y-2">
          <h3 className="font-serif text-lg font-bold text-[#1A1613] tracking-wide">
            Estudio Fotográfico IA en Proceso
          </h3>
          <p className="text-xs font-medium text-[#75685B] min-h-[32px] flex items-center justify-center px-4">
            {currentStep || 'Inicializando motor de difusión...'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-2 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#E8E1D9]">
            <div
              className="h-full bg-[#1A1613] transition-all duration-300 ease-out"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] font-mono text-[#9B8C7E]">
            <span>100% Entorno Gratuito</span>
            <span>{progressPercent}%</span>
          </div>
        </div>

        {/* Informative Tip */}
        <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E8E1D9] text-[11px] text-[#75685B] text-left space-y-1">
          <p className="font-semibold text-[#1A1613] flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-[#C5A059]" />
            Pipeline de Virtual Try-On Abierto:
          </p>
          <p className="text-[10px] text-[#9B8C7E] leading-relaxed">
            Segmentando prenda con U2-Net/SAM, calculando mapa de densidad corporal y
            transfiriendo pliegues de tela mediante difusión neuronal sin costes de API.
          </p>
        </div>
      </div>
    </div>
  );
}
