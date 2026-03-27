'use client';

import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Loader2,
} from 'lucide-react';
import { useModels } from '@/hooks/useModels';

const IAStatus = () => {
  const { hwInfo, modelStatus, loading, downloading, progress, startDownload } =
    useModels();

  if (loading)
    return (
      <div className="p-4 flex items-center gap-2 text-zinc-500 text-xs font-medium">
        <Loader2 size={14} className="animate-spin text-indigo-500" />{' '}
        Analizando hardware...
      </div>
    );

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
          <Cpu size={14} className="text-indigo-500" /> Estado IA Local
        </h3>
        <span
          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${hwInfo && hwInfo.total_ram_gb >= 15 ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}
        >
          {hwInfo?.recommended_model === 'llama-3-8b'
            ? 'Modo Pro'
            : 'Modo Lite'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 bg-white dark:bg-zinc-800/50 p-2 rounded-md border border-zinc-100 dark:border-zinc-800">
        <div className="space-y-0.5">
          <p className="text-[9px] text-zinc-400 font-bold uppercase">RAM</p>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {hwInfo?.total_ram_gb} GB
          </p>
        </div>
        <div className="space-y-0.5 border-l border-zinc-100 dark:border-zinc-800 pl-3">
          <p className="text-[9px] text-zinc-400 font-bold uppercase">CPU</p>
          <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
            {hwInfo?.cpu_cores} Cores
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        {/* Whisper Status */}
        <ModelRow
          label="Whisper (Audio)"
          modelId="whisper"
          ready={!!modelStatus?.whisper_ready}
          downloading={downloading}
          progress={progress}
          onDownload={startDownload}
        />

        {/* Llama-3 Status */}
        <ModelRow
          label="Llama-3 (Psicología)"
          modelId="llama-3-8b"
          ready={!!modelStatus?.llama_ready}
          downloading={downloading}
          progress={progress}
          onDownload={startDownload}
        />

        {/* BioMedLM Status */}
        <ModelRow
          label="BioMedLM (Medicina)"
          modelId="biomedlm-2.7b.gguf"
          ready={!!modelStatus?.biomed_ready}
          downloading={downloading}
          progress={progress}
          onDownload={startDownload}
        />
      </div>

      {!modelStatus?.whisper_ready && !downloading && (
        <div className="flex gap-2.5 p-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-md border border-amber-100 dark:border-amber-900/20 mt-2">
          <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-800 dark:text-amber-400 leading-normal font-medium">
            Se requiere descargar los modelos para habilitar el procesamiento
            offline médico.
          </p>
        </div>
      )}
    </div>
  );
};

interface ModelRowProps {
  label: string;
  modelId: string;
  ready: boolean;
  downloading: string | null;
  progress: number;
  onDownload: (id: string) => Promise<void>;
}

const ModelRow = ({
  label,
  modelId,
  ready,
  downloading,
  progress,
  onDownload,
}: ModelRowProps) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-center gap-2">
      <div
        className={`p-1 rounded ${ready ? 'bg-green-50 dark:bg-green-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}
      >
        <Database
          size={12}
          className={ready ? 'text-green-600' : 'text-zinc-400'}
        />
      </div>
      <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
        {label}
      </span>
    </div>
    {ready ? (
      <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
        <span>Listo</span>
        <CheckCircle2
          size={14}
          fill="currentColor"
          className="text-white dark:text-zinc-900"
        />
      </div>
    ) : downloading === modelId ? (
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px]">
          <Loader2 size={12} className="animate-spin" />
          <span>{progress}%</span>
        </div>
        <div className="w-16 h-1 bg-zinc-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    ) : (
      <button
        onClick={() => onDownload(modelId)}
        disabled={!!downloading}
        className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 font-bold border border-indigo-100"
      >
        <Download size={10} /> Instalar
      </button>
    )}
  </div>
);

export default IAStatus;
