'use client'

import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Brain, Plus, Trash2, Save, Loader2, CheckCircle2, Shield, ChevronDown } from "lucide-react";
import { LLM_PROVIDERS, type ApiKeyEntry, type LlmProviderKey } from "@/types/apiKeys";
import { cn } from "@/lib/utils/cn";

interface ProviderRow {
  id: string;
  provider: LlmProviderKey | "";
  key: string;
  model: string;
  saved: boolean;
}

export default function LlmProvidersPage() {
  const [rows, setRows] = useState<ProviderRow[]>([]);
  const [existingKeys, setExistingKeys] = useState<ApiKeyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadExisting();
  }, []);

  const loadExisting = async () => {
    setLoading(true);
    try {
      const keys = await invoke<ApiKeyEntry[]>("get_api_keys");
      setExistingKeys(keys);

      const llmKeys = keys.filter(k =>
        LLM_PROVIDERS.some(p => p.key === k.provider)
      );

      if (llmKeys.length > 0) {
        setRows(llmKeys.map(k => ({
          id: crypto.randomUUID(),
          provider: k.provider as LlmProviderKey,
          key: "",
          model: k.model || LLM_PROVIDERS.find(p => p.key === k.provider)?.defaultModel || "",
          saved: true,
        })));
      }
    } catch (err) {
      console.error("Error loading LLM providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const addRow = () => {
    setRows(prev => [...prev, {
      id: crypto.randomUUID(),
      provider: "",
      key: "",
      model: "",
      saved: false,
    }]);
  };

  const updateRow = (id: string, field: "provider" | "key" | "model", value: string) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      // Si cambia el provider, auto-seleccionar el modelo por defecto
      if (field === "provider" && value) {
        const defaultModel = LLM_PROVIDERS.find(p => p.key === value)?.defaultModel || "";
        return { ...r, provider: value as LlmProviderKey, model: defaultModel };
      }
      return { ...r, [field]: value };
    }));
  };

  const removeRow = async (id: string) => {
    const row = rows.find(r => r.id === id);
    if (row?.saved && row.provider) {
      if (!confirm(`Eliminar la configuracion de ${LLM_PROVIDERS.find(p => p.key === row.provider)?.label}?`)) return;
      try {
        await invoke("delete_api_key", { provider: row.provider });
      } catch (err: any) {
        alert(`Error al eliminar: ${err}`);
      }
    }
    setRows(prev => prev.filter(r => r.id !== id));
    await loadExisting();
  };

  const saveRow = async (id: string) => {
    const row = rows.find(r => r.id === id);
    if (!row?.provider || !row.key.trim()) {
      return alert("Selecciona un provider e ingresa una API key.");
    }

    setSaving(id);
    try {
      await invoke("save_api_key", { provider: row.provider, key: row.key, model: row.model || null });
      setRows(prev => prev.map(r => r.id === id ? { ...r, key: "", saved: true } : r));
      await loadExisting();
    } catch (err: any) {
      alert(`Error: ${err}`);
    } finally {
      setSaving(null);
    }
  };

  const isProviderUsed = (providerKey: string, excludeId?: string) => {
    return rows.some(r => r.provider === providerKey && r.id !== excludeId);
  };

  const getMaskedKey = (provider: string) => {
    return existingKeys.find(k => k.provider === provider)?.masked_key;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">LLM Providers</h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Configura proveedores de IA para investigacion y generacion de texto.
          </p>
        </div>
        <button
          onClick={addRow}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 dark:shadow-none"
        >
          <Plus size={16} />
          Incluir otro provider
        </button>
      </div>

      <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex gap-3 items-start text-xs text-indigo-800 dark:text-indigo-200">
        <Shield size={18} className="shrink-0 mt-0.5" />
        <p>
          <strong>Privacidad:</strong> Tus API keys se cifran localmente. Podes configurar multiples providers y elegir cual usar al generar investigaciones.
        </p>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <Brain size={48} className="mx-auto text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">No hay providers configurados.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1">
            Haz clic en &ldquo;Incluir otro provider&rdquo; para agregar OpenAI, DeepSeek, Anthropic, etc.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn(
              "bg-white dark:bg-zinc-900 rounded-2xl border p-6",
              row.saved ? "border-emerald-100 dark:border-emerald-900/30" : "border-zinc-200 dark:border-zinc-800"
            )}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 space-y-3">
                <div className="relative">
                  <select
                    value={row.provider}
                    onChange={(e) => updateRow(row.id, "provider", e.target.value)}
                    disabled={row.saved}
                    className="w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 disabled:opacity-60"
                  >
                    <option value="">Seleccionar provider...</option>
                    {LLM_PROVIDERS.map((p) => (
                      <option
                        key={p.key}
                        value={p.key}
                        disabled={isProviderUsed(p.key, row.id)}
                      >
                        {p.label} {isProviderUsed(p.key, row.id) ? "(ya configurado)" : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-3.5 text-zinc-400 pointer-events-none" />
                </div>

                {row.saved ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        {getMaskedKey(row.provider)}
                      </span>
                    </div>
                    {row.model && (
                      <div className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <span className="text-zinc-400">Modelo:</span>
                        <span className="font-medium">{row.model}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="password"
                      placeholder={`API key de ${LLM_PROVIDERS.find(p => p.key === row.provider)?.label || "provider"}`}
                      value={row.key}
                      onChange={(e) => updateRow(row.id, "key", e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                    />
                    {row.provider && (
                      <div className="relative">
                        <select
                          value={row.model}
                          onChange={(e) => updateRow(row.id, "model", e.target.value)}
                          className="w-full appearance-none rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          {LLM_PROVIDERS.find(p => p.key === row.provider)?.models.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                {!row.saved && (
                  <button
                    onClick={() => saveRow(row.id)}
                    disabled={saving === row.id || !row.provider || !row.key.trim()}
                    className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {saving === row.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar
                  </button>
                )}
                <button
                  onClick={() => removeRow(row.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title={row.saved ? "Eliminar" : "Cancelar"}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {row.provider && LLM_PROVIDERS.find(p => p.key === row.provider) && (
              <div className="mt-3 text-[10px] text-zinc-400">
                Modelo: {LLM_PROVIDERS.find(p => p.key === row.provider)?.defaultModel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
