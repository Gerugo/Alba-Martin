import { Image as ImageIcon, Check } from 'lucide-react';
import { ScenePreset } from '../types/fashion';
import { PRESET_SCENES } from '../services/modelPresets';

interface SceneSelectorProps {
  selectedScene: ScenePreset;
  onSelectScene: (scene: ScenePreset) => void;
}

export default function SceneSelector({
  selectedScene,
  onSelectScene,
}: SceneSelectorProps) {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D9] shadow-sm space-y-4">
      {/* Step Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E1D9] text-[#1A1613] font-serif font-bold text-sm flex items-center justify-center">
          3
        </div>
        <div>
          <h2 className="font-serif text-base font-bold text-[#1A1613] tracking-wide">
            Entorno y Fondo de Estudio
          </h2>
          <p className="text-xs text-[#9B8C7E]">
            Iluminación y ambiente fotográfico para la sesión de catálogo
          </p>
        </div>
      </div>

      {/* Scenes Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {PRESET_SCENES.map((scene) => {
          const isSelected = selectedScene === scene.id;
          return (
            <div
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all text-center relative flex flex-col ${
                isSelected
                  ? 'border-[#1A1613] ring-2 ring-[#1A1613] shadow-md bg-[#FAF8F5]'
                  : 'border-[#E8E1D9] hover:border-[#BDB0A3] bg-white'
              }`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/5">
                <img
                  src={scene.thumbnail}
                  alt={scene.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1A1613] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              <div className="p-2">
                <p className="text-xs font-semibold text-[#1A1613] truncate">
                  {scene.name}
                </p>
                <p className="text-[10px] text-[#9B8C7E] truncate mt-0.5">
                  {scene.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
