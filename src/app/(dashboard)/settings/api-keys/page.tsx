'use client'

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Key, Save, Trash2, Eye, EyeOff, Loader2, CheckCircle2, Shield } from "lucide-react";
import { TRANSCRIPTION_PROVIDERS, RESEARCH_API_PROVIDERS, type ApiKeyEntry } from "@/types/apiKeys";
import { cn } from "@/lib/utils/cn";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const result = await invoke<ApiKeyEntry[]>("get_api_keys");
      setKeys(result);
    } catch (err) {
      console.error("Error loading API keys:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (provider: string) => {
    const key = formValues[provider];
    if (!key?.trim()) return alert("Ingresa una API key valida.");

    setSaving(provider);
    try {
      await invoke("save_api_key", { provider, key });
      setFormValues(prev => ({ ...prev, [provider]: "" }));
      setSaved(provider);
      setTimeout(() => setSaved(null), 2000);
      await loadKeys();
    } catch (err: any) {
      alert(`Error: ${err}`);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (provider: string) => {
    if (!confirm(`Eliminar la API key de ${provider}?`)) return;
    try {
      await invoke("delete_api_key", { provider });
      await loadKeys();
    } catch (err: any) {
      alert(`Error: ${err}`);
    }
  };

  const getMaskedKey = (provider: string) => {
    return keys.find(k => k.provider === provider)?.masked_key;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">API Keys</h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Configura tus propias API keys para servicios de transcripcion e investigacion.
        </p>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-3 items-start text-xs text-indigo-800 dark:text-indigo-200">
        <Shield size={18} className="shrink-0 mt-0.5" />
        <p>
          <strong>Privacidad:</strong> Tus API keys se cifran con AES-256-GCM y solo se descifran en tu equipo. NeuroScribe nunca las transmite a servidores externos.
        </p>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-indigo-600 rounded-full" />
          Transcripcion
        </h2>
        <div className="space-y-4">
          {TRANSCRIPTION_PROVIDERS.filter(p => p.key !== "offline").map((provider) => {
            const existing = getMaskedKey(provider.key);
            return (
              <div key={provider.key} className={cn(
                "bg-white dark:bg-zinc-900 rounded-2xl border p-6",
                existing ? "border-emerald-100 dark:border-emerald-900/30" : "border-zinc-200 dark:border-zinc-800"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{provider.label}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                    {existing && (
                      <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> {revealed[provider.key] ? existing : existing}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {existing && (
                      <button
                        onClick={() => handleDelete(provider.key)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    type={revealed[provider.key] ? "text" : "password"}
                    placeholder={existing ? "Nueva clave (reemplaza la actual)" : `API key de ${provider.label}`}
                    value={formValues[provider.key] || ""}
                    onChange={(e) => setFormValues(prev => ({ ...prev, [provider.key]: e.target.value }))}
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                  {existing && (
                    <button
                      onClick={() => setRevealed(prev => ({ ...prev, [provider.key]: !prev[provider.key] }))}
                      className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      {revealed[provider.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(provider.key)}
                    disabled={saving === provider.key || !formValues[provider.key]?.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {saving === provider.key ? <Loader2 size={14} className="animate-spin" /> : saved === provider.key ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {saved === provider.key ? "Guardado" : "Guardar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-emerald-600 rounded-full" />
          Investigacion
        </h2>
        <div className="space-y-4">
          {RESEARCH_API_PROVIDERS.map((provider) => {
            const existing = getMaskedKey(provider.key);
            return (
              <div key={provider.key} className={cn(
                "bg-white dark:bg-zinc-900 rounded-2xl border p-6",
                existing ? "border-emerald-100 dark:border-emerald-900/30" : "border-zinc-200 dark:border-zinc-800"
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{provider.label}</h3>
                    <p className="text-xs text-zinc-500 mt-1">{provider.description}</p>
                    {existing && (
                      <p className="text-xs text-emerald-600 font-medium mt-2 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Configurado
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {existing && (
                      <button
                        onClick={() => handleDelete(provider.key)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    type={revealed[provider.key] ? "text" : "password"}
                    placeholder={provider.key === "crossref" ? "tu-email@example.com" : `API key de ${provider.label}`}
                    value={formValues[provider.key] || ""}
                    onChange={(e) => setFormValues(prev => ({ ...prev, [provider.key]: e.target.value }))}
                    className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  />
                  {existing && (
                    <button
                      onClick={() => setRevealed(prev => ({ ...prev, [provider.key]: !prev[provider.key] }))}
                      className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      {revealed[provider.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(provider.key)}
                    disabled={saving === provider.key || !formValues[provider.key]?.trim()}
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {saving === provider.key ? <Loader2 size={14} className="animate-spin" /> : saved === provider.key ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {saved === provider.key ? "Guardado" : "Guardar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
