'use client'

import { useEffect, useState } from "react";
import { Cpu, Cloud } from "lucide-react";
import { TRANSCRIPTION_PROVIDERS } from "@/types/apiKeys";
import { getApiKeys } from "@/app/actions/ia";

interface ProviderSelectorProps {
  value: string;
  onChange: (provider: string) => void;
}

export default function ProviderSelector({ value, onChange }: ProviderSelectorProps) {
  const [configuredProviders, setConfiguredProviders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfigured();
  }, []);

  const loadConfigured = async () => {
    try {
      const keys = await getApiKeys();
      const providers = new Set(keys.map(k => k.provider));
      setConfiguredProviders(providers);
    } catch {
      // Silently fail - only offline will show
    }
  };

  const availableProviders = TRANSCRIPTION_PROVIDERS.filter(p =>
    p.key === "offline" || configuredProviders.has(p.key)
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Motor:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
      >
        {availableProviders.map((p) => (
          <option key={p.key} value={p.key}>
            {p.key === "offline" ? "Offline (Whisper)" : `${p.label} Cloud`}
          </option>
        ))}
      </select>
      {availableProviders.length === 1 && (
        <span className="text-[10px] text-zinc-400">
          Configura APIs en Settings para desbloquear providers cloud
        </span>
      )}
    </div>
  );
}
