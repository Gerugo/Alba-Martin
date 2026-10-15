import { useState } from 'react';
import { X, Key, Store, Phone, Zap, ShieldCheck, AlertCircle } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-stone-900 text-base">Ajustes de la Demo</h2>
              <p className="text-xs text-stone-500">Configuración en vivo para la tienda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
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
                <Key className="w-3.5 h-3.5 text-stone-500" />
                Fal.ai API Key
              </label>
              {hasEnvFal && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> .env activo
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.falKey}
              onChange={(e) => setFormData({ ...formData, falKey: e.target.value })}
              placeholder="fal_sk_..."
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
            />
          </div>

          {/* Gemini API Key */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-stone-500" />
                Gemini API Key
              </label>
              {hasEnvGemini && (
                <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> .env activo
                </span>
              )}
            </div>
            <input
              type="password"
              value={formData.geminiKey}
              onChange={(e) => setFormData({ ...formData, geminiKey: e.target.value })}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
            />
          </div>

          {/* Nombre de la Tienda */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-stone-500" />
              Nombre de la Tienda
            </label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              placeholder="Ej. Boutique Rota"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
            />
          </div>

          {/* Teléfono WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-stone-500" />
              Teléfono WhatsApp (con código de país)
            </label>
            <input
              type="text"
              value={formData.storePhone}
              onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
              placeholder="34600000000"
              className="w-full text-sm font-mono px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-stone-900 focus:ring-1 focus:ring-stone-900 outline-none transition-all"
            />
            <p className="text-[11px] text-stone-500">
              Para probar el botón de reserva por WhatsApp en la demo.
            </p>
          </div>

          {/* Modo Simulación (Fallback) */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950">
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Modo Simulación (Fallback)
              </div>
              <p className="text-[11px] text-amber-800/80 leading-snug">
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
              <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {/* Validation tip */}
          {!formData.falKey && !formData.geminiKey && !formData.simulationMode && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-xs">
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
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-stone-900 text-white hover:bg-stone-800 active:scale-[0.99] transition-all shadow-md"
            >
              {showNotification ? '✓ Guardado correctamente' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
