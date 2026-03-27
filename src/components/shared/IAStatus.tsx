'use client';

import { useState, useEffect } from 'react';
import {
  getHardwareInfo,
  checkModelStatus,
  HardwareInfo,
  ModelStatus,
  downloadModel,
} from '@/app/actions/ia';
import {
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
} from 'lucide-react';
import { listen } from '@tauri-apps/api/event';

const IAStatus = () => {
  const [hwInfo, setHwInfo] = useState<HardwareInfo | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    init();

    // Escuchar progreso desde Rust
    const unlisten = listen<number>('download-progress', event => {
      setProgress(event.payload);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const init = async () => {
    setLoading(true);
    const [hw, status] = await Promise.all([
      getHardwareInfo(),
      checkModelStatus(),
    ]);
    setHwInfo(hw);
    setModelStatus(status);
    setLoading(false);
  };

  const handleDownload = async (name: string) => {
    setDownloading(name);
    setProgress(0);
    try {
      const result = await downloadModel(name);
      console.log(result);
      // Una vez terminada la descarga, actualizamos el estado visual
      const status = await checkModelStatus();
      setModelStatus(status);
      setDownloading(null);
      setProgress(0);
    } catch (err) {
      alert(`Error en la descarga: ${err}`);
      setDownloading(null);
      setProgress(0);
    }
  };

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
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded ${modelStatus?.whisper_ready ? 'bg-green-50 dark:bg-green-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              <Database
                size={12}
                className={
                  modelStatus?.whisper_ready
                    ? 'text-green-600'
                    : 'text-zinc-400'
                }
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Whisper (Audio)
            </span>
          </div>
          {modelStatus?.whisper_ready ? (
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
              <span>Listo</span>
              <CheckCircle2
                size={14}
                fill="currentColor"
                className="text-white dark:text-zinc-900"
              />
            </div>
          ) : downloading === 'whisper' ? (
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
              onClick={() => handleDownload('whisper')}
              disabled={!!downloading}
              className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 font-bold border border-indigo-100"
            >
              <Download size={10} /> Instalar
            </button>
          )}
        </div>

        {/* Llama-3 Status */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded ${modelStatus?.llama_ready ? 'bg-green-50 dark:bg-green-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              <Database
                size={12}
                className={
                  modelStatus?.llama_ready ? 'text-green-600' : 'text-zinc-400'
                }
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              Llama-3 (Psicología)
            </span>
          </div>
          {modelStatus?.llama_ready ? (
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
              <span>Listo</span>
              <CheckCircle2
                size={14}
                fill="currentColor"
                className="text-white dark:text-zinc-900"
              />
            </div>
          ) : downloading === 'llama-3-8b' ? (
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
              onClick={() => handleDownload('llama-3-8b')}
              disabled={!!downloading}
              className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 font-bold border border-indigo-100"
            >
              <Download size={10} /> Instalar
            </button>
          )}
        </div>

        {/* BioMedLM Status */}
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2">
            <div
              className={`p-1 rounded ${modelStatus?.biomed_ready ? 'bg-green-50 dark:bg-green-900/20' : 'bg-zinc-100 dark:bg-zinc-800'}`}
            >
              <Database
                size={12}
                className={
                  modelStatus?.biomed_ready ? 'text-green-600' : 'text-zinc-400'
                }
              />
            </div>
            <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
              BioMedLM (Medicina)
            </span>
          </div>
          {modelStatus?.biomed_ready ? (
            <div className="flex items-center gap-1.5 text-green-600 font-bold text-[10px]">
              <span>Listo</span>
              <CheckCircle2
                size={14}
                fill="currentColor"
                className="text-white dark:text-zinc-900"
              />
            </div>
          ) : downloading === 'biomedlm-2.7b.gguf' ? (
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
              onClick={() => handleDownload('biomedlm-2.7b.gguf')}
              disabled={!!downloading}
              className="text-[10px] bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-1.5 font-bold border border-indigo-100"
            >
              <Download size={10} /> Instalar
            </button>
          )}
        </div>
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

export default IAStatus;
