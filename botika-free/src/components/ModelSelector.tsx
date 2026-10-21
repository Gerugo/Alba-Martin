import { useState } from 'react';
import { Users, Upload, Check, Sparkles } from 'lucide-react';
import { AIModelProfile } from '../types/fashion';
import { PRESET_MODELS } from '../services/modelPresets';
import { processImageForTryOn } from '../utils/imageUtils';

interface ModelSelectorProps {
  selectedModel: AIModelProfile;
  onSelectModel: (model: AIModelProfile) => void;
  customModelDataUri: string | null;
  onCustomModelChange: (dataUri: string | null) => void;
}

export default function ModelSelector({
  selectedModel,
  onSelectModel,
  customModelDataUri,
  onCustomModelChange,
}: ModelSelectorProps) {
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('female');
  const [isUploadingCustom, setIsUploadingCustom] = useState(false);

  const filteredModels = PRESET_MODELS.filter((m) => {
    if (filterGender === 'all') return true;
    return m.gender === filterGender;
  });

  const handleCustomUpload = async (file: File) => {
    setIsUploadingCustom(true);
    try {
      const processed = await processImageForTryOn(file, 864, 1152, 0.88);
      onCustomModelChange(processed.dataUri);
    } catch (err) {
      console.error('Error subiendo modelo personalizada:', err);
      alert('No se pudo procesar la foto de la modelo.');
    } finally {
      setIsUploadingCustom(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#E8E1D9] shadow-sm space-y-5">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#E8E1D9] text-[#1A1613] font-serif font-bold text-sm flex items-center justify-center">
            2
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-[#1A1613] tracking-wide">
              Modelo IA de Moda (Estilo Botika)
            </h2>
            <p className="text-xs text-[#9B8C7E]">
              Diversidad de etnias, tallas y fisonomías o sube a tu propia dependienta
            </p>
          </div>
        </div>

        {/* Gender Filter Chips */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E1D9]">
          <button
            type="button"
            onClick={() => setFilterGender('female')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterGender === 'female'
                ? 'bg-[#1A1613] text-[#FAF8F5]'
                : 'text-[#75685B] hover:text-[#1A1613]'
            }`}
          >
            Mujeres
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('male')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterGender === 'male'
                ? 'bg-[#1A1613] text-[#FAF8F5]'
                : 'text-[#75685B] hover:text-[#1A1613]'
            }`}
          >
            Hombres
          </button>
          <button
            type="button"
            onClick={() => setFilterGender('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filterGender === 'all'
                ? 'bg-[#1A1613] text-[#FAF8F5]'
                : 'text-[#75685B] hover:text-[#1A1613]'
            }`}
          >
            Todos
          </button>
        </div>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {filteredModels.map((m) => {
          const isSelected = selectedModel.id === m.id && !customModelDataUri;
          return (
            <div
              key={m.id}
              onClick={() => {
                onCustomModelChange(null);
                onSelectModel(m);
              }}
              className={`group cursor-pointer rounded-2xl overflow-hidden border transition-all text-center relative flex flex-col ${
                isSelected
                  ? 'border-[#1A1613] ring-2 ring-[#1A1613] shadow-md bg-[#FAF8F5]'
                  : 'border-[#E8E1D9] hover:border-[#BDB0A3] bg-white'
              }`}
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-black/5">
                <img
                  src={m.avatarUrl}
                  alt={m.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1A1613] text-[#FAF8F5] flex items-center justify-center shadow-xs">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] py-0.5 px-1.5 rounded-md uppercase tracking-wider font-semibold">
                  {m.ethnicity} · {m.bodyType}
                </div>
              </div>

              <div className="p-2">
                <p className="text-xs font-serif font-bold text-[#1A1613] truncate">
                  {m.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Option to Upload Custom Model / Persona */}
      <div className="pt-3 border-t border-[#F4EFEB] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#C5A059]" />
          <span className="text-xs font-semibold text-[#1A1613]">
            ¿Quieres vestir a una persona real de tu tienda?
          </span>
        </div>

        <div className="flex items-center gap-3">
          {customModelDataUri ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3" /> Modelo propia activa
              </span>
              <button
                type="button"
                onClick={() => onCustomModelChange(null)}
                className="text-xs text-[#9B8C7E] hover:text-[#1A1613] underline"
              >
                Volver a modelos IA
              </button>
            </div>
          ) : (
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[#E8E1D9] bg-[#FAF8F5] text-[#1A1613] hover:bg-white hover:border-[#1A1613] transition-all">
              <Upload className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isUploadingCustom ? 'Cargando...' : 'Subir foto propia'}</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={isUploadingCustom}
                onChange={(e) =>
                  e.target.files?.[0] && handleCustomUpload(e.target.files[0])
                }
              />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
