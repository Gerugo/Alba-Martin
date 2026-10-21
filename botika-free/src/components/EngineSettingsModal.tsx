import { useState } from 'react';
import {
  X,
  Zap,
  Server,
  Cloud,
  ShieldCheck,
  ExternalLink,
  Store,
  Phone,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { BotikaFreeSettings } from '../types/settings';
import { FreeEngineType } from '../types/fashion';

interface EngineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BotikaFreeSettings;
  onSave: (updated: BotikaFreeSettings) => void;
}

export default function EngineSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: EngineSettingsModalProps) {
  const [formData, setFormData] = useState<BotikaFreeSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E8E1D9] max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#E8E1D9] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A1613] text-[#C5A059] flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-base text-[#1A1613] tracking-wide">
                Ajustes del Motor Gratuito
              </h2>
              <p className="text-xs text-[#9B8C7E]">
                Configuración de inferencia IA sin costes por uso
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#75685B] hover:text-[#1A1613] hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Selector de Motor */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#1A1613] uppercase tracking-wider block">
              Seleccionar Motor de Virtual Try-On:
            </label>

            <div className="space-y-2.5">
              {/* Option 1: Hugging Face Spaces */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.engine === 'hf-gradio'
                    ? 'border-[#1A1613] bg-[#FAF8F5] ring-1 ring-[#1A1613]'
                    : 'border-[#E8E1D9] hover:border-[#BDB0A3]'
                }`}
              >
                <input
                  type="radio"
                  name="engine"
                  value="hf-gradio"
                  checked={formData.engine === 'hf-gradio'}
                  onChange={() => setFormData({ ...formData, engine: 'hf-gradio' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-[#1A1613]">
                      Hugging Face Spaces (Gradio API Gratuito)
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      0 € / Sin GPU local
                    </span>
                  </div>
                  <p className="text-[11px] text-[#75685B] mt-1 leading-relaxed">
                    Utiliza la API abierta de IDM-VTON en Hugging Face. No requiere tener
                    GPU ni pagar por peticiones.
                  </p>
                  {formData.engine === 'hf-gradio' && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        value={formData.hfSpaceEndpoint}
                        onChange={(e) =>
                          setFormData({ ...formData, hfSpaceEndpoint: e.target.value })
                        }
                        placeholder="yisol/IDM-VTON"
                        className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-[#E8E1D9] bg-white text-[#1A1613] focus:border-[#1A1613] outline-none"
                      />
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Google Colab GPU T4 */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.engine === 'colab-tunnel'
                    ? 'border-[#1A1613] bg-[#FAF8F5] ring-1 ring-[#1A1613]'
                    : 'border-[#E8E1D9] hover:border-[#BDB0A3]'
                }`}
              >
                <input
                  type="radio"
                  name="engine"
                  value="colab-tunnel"
                  checked={formData.engine === 'colab-tunnel'}
                  onChange={() => setFormData({ ...formData, engine: 'colab-tunnel' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-[#1A1613]">
                      Google Colab GPU T4 (Servidor Privado Gratuito)
                    </span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Recomendado / Ilimitado
                    </span>
                  </div>
                  <p className="text-[11px] text-[#75685B] mt-1 leading-relaxed">
                    Ejecuta tu propio backend en Google Colab con una GPU Nvidia T4 gratuita
                    (16GB VRAM) y conéctalo mediante el túnel de Cloudflare.
                  </p>
                  {formData.engine === 'colab-tunnel' && (
                    <div className="mt-2.5 space-y-1.5">
                      <input
                        type="url"
                        value={formData.colabTunnelUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, colabTunnelUrl: e.target.value })
                        }
                        placeholder="https://tu-tunel.trycloudflare.com"
                        className="w-full text-xs font-mono px-3 py-1.5 rounded-xl border border-[#E8E1D9] bg-white text-[#1A1613] focus:border-[#1A1613] outline-none"
                      />
                      <p className="text-[10px] text-[#9B8C7E]">
                        Cuaderno disponible en: <code>botika-free/colab/botika_vton_backend.ipynb</code>
                      </p>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 3: Simulation */}
              <label
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  formData.engine === 'simulation'
                    ? 'border-[#1A1613] bg-[#FAF8F5] ring-1 ring-[#1A1613]'
                    : 'border-[#E8E1D9] hover:border-[#BDB0A3]'
                }`}
              >
                <input
                  type="radio"
                  name="engine"
                  value="simulation"
                  checked={formData.engine === 'simulation'}
                  onChange={() => setFormData({ ...formData, engine: 'simulation' })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A059]" />
                    <span className="text-xs font-bold text-[#1A1613]">
                      Modo Simulación / Demostración Rápida
                    </span>
                  </div>
                  <p className="text-[11px] text-[#75685B] mt-1 leading-relaxed">
                    Generación inmediata con presets fotográficos para evaluar la interfaz
                    sin necesidad de conexión a servidores ni colas.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Gemini Free Tier Key */}
          <div className="pt-3 border-t border-[#F4EFEB] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1A1613] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                Google Gemini API Key (Copia comercial y SEO):
              </label>
              <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                Free Tier: 1.500 req/día gratis
              </span>
            </div>
            <input
              type="password"
              value={formData.geminiApiKey}
              onChange={(e) =>
                setFormData({ ...formData, geminiApiKey: e.target.value })
              }
              placeholder="Pega tu clave gratuita de Google AI Studio..."
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-[#E8E1D9] bg-[#FAF8F5] focus:bg-white focus:border-[#1A1613] outline-none transition-all"
            />
            <p className="text-[10px] text-[#9B8C7E]">
              Opcional. Si se deja en blanco, el sistema genera automáticamente copias
              comerciales con un motor heurístico de moda.
            </p>
          </div>

          {/* Store branding */}
          <div className="pt-3 border-t border-[#F4EFEB] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1A1613] mb-1.5 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-[#C5A059]" />
                Nombre de la Tienda:
              </label>
              <input
                type="text"
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E8E1D9] bg-[#FAF8F5] focus:bg-white focus:border-[#1A1613] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1A1613] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
                WhatsApp para Reservas:
              </label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                placeholder="34600000000"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E8E1D9] bg-[#FAF8F5] focus:bg-white focus:border-[#1A1613] outline-none"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-[#F4EFEB] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#75685B] hover:text-[#1A1613] hover:bg-[#F4EFEB] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#1A1613] text-[#FAF8F5] hover:bg-[#342D27] shadow-sm transition-all"
            >
              {savedSuccess ? '¡Guardado!' : 'Guardar Ajustes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
