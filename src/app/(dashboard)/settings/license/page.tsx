'use client';

import { useState, useEffect } from 'react';
import { getProfile, activateLicense, Profile } from '@/app/actions/profiles';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export default function LicensePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [key, setKey] = useState('');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    async function load() {
      const p = await getProfile();
      setProfile(p);
      setLoading(false);
    }
    load();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setActivating(true);
    setMessage(null);

    try {
      const success = await activateLicense(key.trim());
      if (success) {
        setMessage({
          type: 'success',
          text: '¡NeuroScribe activado con éxito! Gracias por tu apoyo.',
        });
        const updated = await getProfile();
        setProfile(updated);
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text:
          error ||
          'Error al activar la licencia. Verifica la clave e intenta de nuevo.',
      });
    } finally {
      setActivating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const trialDays = profile
    ? 30 -
      Math.ceil(
        Math.abs(
          new Date().getTime() - new Date(profile.trial_start_date).getTime()
        ) /
          (1000 * 60 * 60 * 24)
      )
    : 0;
  const isExpired = !profile?.is_activated && trialDays <= 0;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Licencia y Activación
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Gestiona tu suscripción y el estado de tu copia de NeuroScribe.
        </p>
      </div>

      {/* Status Card */}
      <div
        className={cn(
          'rounded-2xl border p-6 flex items-start gap-4',
          profile?.is_activated
            ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30'
            : isExpired
              ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30'
              : 'bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30'
        )}
      >
        <div
          className={cn(
            'p-3 rounded-xl',
            profile?.is_activated
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
              : isExpired
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400'
          )}
        >
          {profile?.is_activated ? (
            <ShieldCheck size={24} />
          ) : isExpired ? (
            <ShieldAlert size={24} />
          ) : (
            <Key size={24} />
          )}
        </div>
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
            {profile?.is_activated
              ? 'Versión Activada'
              : isExpired
                ? 'Periodo de Prueba Expirado'
                : 'Periodo de Prueba Activo'}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            {profile?.is_activated
              ? 'Tienes acceso ilimitado a todas las funciones locales de por vida.'
              : isExpired
                ? 'Tu trial de 30 días ha terminado. Por favor, adquiere una licencia para continuar.'
                : `Te quedan ${trialDays} días de prueba gratuita ilimitada.`}
          </p>
        </div>
      </div>

      {/* Activation Form */}
      {!profile?.is_activated && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">
            Activar NeuroScribe
          </h3>

          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label
                htmlFor="key"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                License Key
              </label>
              <input
                id="key"
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                placeholder="NS-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-white"
                required
              />
              <p className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Enviada a tu correo tras la compra en neuroscribe.app
              </p>
            </div>

            {message && (
              <div
                className={cn(
                  'flex items-center gap-2 p-4 rounded-xl text-sm font-medium',
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-700 border border-red-100'
                )}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={activating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {activating ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <ShieldCheck size={20} />
              )}
              {activating ? 'Verificando...' : 'Activar Ahora'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="font-bold text-zinc-900 dark:text-white mb-4">
              ¿No tienes una licencia?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="https://neuroscribe.app/buy"
                target="_blank"
                className="p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 transition-all group"
              >
                <span className="block font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Pago Único (Lifetime)
                </span>
                <span className="text-sm text-zinc-500">
                  $99 - Olvídate de suscripciones.
                </span>
              </a>
              <a
                href="https://neuroscribe.app/buy"
                target="_blank"
                className="p-4 rounded-xl border border-zinc-200 hover:border-indigo-500 transition-all group"
              >
                <span className="block font-bold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                  Micro-Suscripción Anual
                </span>
                <span className="text-sm text-zinc-500">
                  $10/año - Acceso completo.
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Info Section (for support) */}
      <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Esta licencia está vinculada a tu hardware para prevenir el uso
          compartido no autorizado.
        </p>
      </div>
    </div>
  );
}
