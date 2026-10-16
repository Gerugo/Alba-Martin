import { useState } from 'react';
import { X, Key, Store, Phone, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
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
  const [showNotification, setShowNotification] = useState<boolean>(false);

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
      <div className="w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E8E2D9] max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E8E2D9] flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#121110] text-[#C5A059] flex items-center justify-center shadow-xs">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-[#121110] text-base font-serif tracking-wide">
                Ajustes de la Plataforma
              </h2>
              <p className="text-xs text-[#7A756D]">Configuración operativa de la empresa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7A756D] hover:text-[#121110] hover:bg-black/5 transition-colors"
            aria-label="Cerrar ajustes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Ropa API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                Ropa API Key
              </label>
              {hasEnvFal && (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Clave de sistema activa
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.falKey}
              onChange={(e) => setFormData({ ...formData, falKey: e.target.value })}
              placeholder="Introduce la clave de ropa..."
              className="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all bg-[#FAF7F2] text-[#121110]"
            />
          </div>

          {/* Texto API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#C5A059]" />
                Texto API Key
              </label>
              {hasEnvGemini && (
                <span className="text-[10px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" /> Clave de sistema activa
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.geminiKey}
              onChange={(e) => setFormData({ ...formData, geminiKey: e.target.value })}
              placeholder="Introduce la clave de texto..."
              className="w-full text-xs font-mono px-4 py-3 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all bg-[#FAF7F2] text-[#121110]"
            />
          </div>

          {/* Modelo IA texto */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121110] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                Modelo IA texto
              </span>
              <span className="text-[10px] text-[#C5A059] bg-[#FAF7F2] border border-[#E8E2D9] px-2.5 py-0.5 rounded-full font-medium">
                Recomendado
              </span>
            </label>
            <select
              value={formData.geminiModel || 'gemini-3.6-flash'}
              onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
              className="w-full text-xs px-4 py-3 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all bg-[#FAF7F2] font-medium text-[#121110]"
            >
              <option value="gemini-3.6-flash">Modelo 3.6 Flash (Ultrarrápido, 1.7s, máxima estabilidad)</option>
              <option value="gemini-3.8-flash">Modelo 3.8 Flash (Mayor capacidad)</option>
              <option value="gemini-3.5-flash-lite">Modelo 3.5 Flash Lite (Económico / Ligero)</option>
            </select>
          </div>

          {/* Nombre de la Empresa */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-[#C5A059]" />
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Ej. Alba Martín"
              className="w-full text-sm px-4 py-3 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all bg-[#FAF7F2] text-[#121110]"
            />
          </div>

          {/* Teléfono WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#121110] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#C5A059]" />
              Teléfono WhatsApp (con prefijo de país)
            </label>
            <input
              type="text"
              value={formData.storePhone}
              onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              placeholder="34600000000"
              className="w-full text-sm font-mono px-4 py-3 rounded-2xl border border-[#E8E2D9] focus:border-[#121110] focus:ring-1 focus:ring-[#121110] outline-none transition-all bg-[#FAF7F2] text-[#121110]"
            />
          </div>

          {/* Validation tip */}
          {(!formData.falKey || !formData.geminiKey) && (
            <div className="flex items-start gap-2 p-3.5 bg-amber-50 text-amber-800 rounded-2xl border border-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                Faltan claves de API requeridas (Ropa API Key y Texto API Key) para generar los looks y textos automáticos.
              </span>
            </div>
          )}

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-4 px-4 rounded-2xl font-serif tracking-wider font-semibold text-sm bg-[#121110] text-[#FAF7F2] hover:bg-black active:scale-[0.99] transition-all shadow-md"
            >
              {showNotification ? 'Configuración guardada' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
