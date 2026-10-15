import { useState } from 'react';
import { X, Key, Store, Phone, Zap, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { DemoSettings } from '../types/catalog';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: DemoSettings;
  onSave: (updated: DemoSettings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: SettingsModalProps) {
  const [formData, setFormData] = useState<DemoSettings>(settings);
  const [showNotification, setShowNotification] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setShowNotification(true);
    setTimeout(() => {
      setShowNotification(false);
      onClose();
    }, 600);
  };

  const hasEnvFal = Boolean(import.meta.env.VITE_FAL_KEY);
  const hasEnvGemini = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md glass-card rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden border border-[#E8DFC8]/90 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#EDE4D5] flex items-center justify-between bg-[#FAF8F5]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#1A1816] text-[#D4AF37] ring-1 ring-white/10 flex items-center justify-center shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#1A1816] text-base font-serif-couture tracking-wide">
                Ajustes de la Plataforma
              </h2>
              <p className="text-xs text-stone-500">Configuración operativa para la boutique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-[#FAF6F0] transition-colors"
            aria-label="Cerrar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Fal.ai Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#8C7654]" />
                Fal.ai API Key
              </label>
              {hasEnvFal && (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> .env activo
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.falKey}
              onChange={(e) => setFormData({ ...formData, falKey: e.target.value })}
              placeholder="fal_sk_..."
              className="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all bg-[#FAF8F5]/60 text-stone-800"
            />
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#8C7654]" />
                Gemini API Key
              </label>
              {hasEnvGemini && (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> .env activo
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.geminiKey}
              onChange={(e) => setFormData({ ...formData, geminiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all bg-[#FAF8F5]/60 text-stone-800"
            />
          </div>

          {/* Selector de Modelo Gemini */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                Modelo Gemini IA
              </span>
              <span className="text-[10px] text-[#7A6A55] bg-[#FAF8F5] border border-[#EDE4D5] px-2.5 py-0.5 rounded-full font-medium">
                3.6 recomendado
              </span>
            </label>
            <select
              value={formData.geminiModel || 'gemini-3.6-flash'}
              onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
              className="w-full text-xs px-4 py-3 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all bg-[#FAF8F5]/90 font-medium text-stone-800"
            >
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Ultrarrápido, 1.7s, máxima estabilidad)</option>
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Mayor capacidad)</option>
              <option value="gemini-3.5-flash-lite">Gemini 3.5 Flash Lite (Económico / Ligero)</option>
            </select>
            <p className="text-[11px] text-stone-500">
              Para generar títulos comerciales y posts de Instagram, 3.6 Flash ofrece el mejor rendimiento.
            </p>
          </div>

          {/* Nombre de la Tienda */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#8C7654]" />
              Nombre de la Boutique
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Ej. Alba Martín Boutique"
              className="w-full text-sm px-4 py-3 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all bg-[#FAF8F5]/60 text-stone-800"
            />
          </div>

          {/* Teléfono WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#8C7654]" />
              Teléfono WhatsApp (con prefijo de país)
            </label>
            <input
              type="text"
              value={formData.storePhone}
              onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              placeholder="34600000000"
              className="w-full text-sm font-mono px-4 py-3 rounded-2xl border border-[#E5DAC8] focus:border-[#1A1816] focus:ring-1 focus:ring-[#1A1816] outline-none transition-all bg-[#FAF8F5]/60 text-stone-800"
            />
            <p className="text-[11px] text-stone-500">
              Número receptor para los enlaces directos de pedidos por WhatsApp.
            </p>
          </div>

          {/* Modo Simulación (Fallback) */}
          <div className="p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DFC8] flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#5C4D38]">
                <Zap className="w-3.5 h-3.5 text-[#8C7654]" />
                Modo Simulación (Fallback)
              </div>
              <p className="text-[11px] text-[#7A6A55] leading-snug">
                Actívalo si no hay buena cobertura 4G/WiFi dentro del local.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={formData.simulationMode}
                onChange={(e) => setFormData({ ...formData, simulationMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1A1816]"></div>
            </label>
          </div>

          {/* Validation tip */}
          {!formData.falKey && !formData.geminiKey && !formData.simulationMode && (
            <div className="flex items-start gap-2 p-3.5 bg-red-50/80 text-red-700 rounded-2xl border border-red-200/80 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                Faltan claves de API. Puedes introducirlas aquí o activar el <strong>Modo Simulación</strong> para la demo.
              </span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-4 rounded-2xl font-serif-couture tracking-wider font-semibold text-sm bg-gradient-to-r from-[#1A1816] via-[#24211E] to-[#1A1816] text-[#F5EFE6] hover:bg-black active:scale-[0.99] transition-all shadow-md"
            >
              {showNotification ? 'Configuración guardada' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
