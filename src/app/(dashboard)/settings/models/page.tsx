'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HardDrive,
  Cpu,
  Zap,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useModels } from '@/hooks/useModels';

export default function ModelsManagerPage() {
  const {
    modelStatus: status,
    hwInfo,
    loading,
    downloading,
    progress,
    refreshStatus,
    startDownload,
  } = useModels();

  const [mirrorOnline, setMirrorOnline] = useState<boolean | null>(null);

  useEffect(() => {
    invoke<boolean>('check_mirror_health')
      .then(setMirrorOnline)
      .catch(() => setMirrorOnline(false));
  }, []);

  const handleDownload = async (modelName: string) => {
    try {
      await startDownload(modelName);
    } catch (error) {
      alert(`Error al descargar: ${error}`);
    }
  };

  const handleRemoveModel = async (modelId: string) => {
    if (
      !confirm(
        '¿Estás seguro de que quieres eliminar este modelo? Deberás descargarlo de nuevo para usar sus funciones.'
      )
    )
      return;

    try {
      await invoke('db_delete_model', { modelName: modelId });
      await refreshStatus();
    } catch (error) {
      alert(`Error al eliminar: ${error}`);
    }
  };

  if (loading && !status) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  const models = [
    {
      id: 'whisper',
      name: 'Whisper Large v3 Turbo',
      description: 'Motor de transcripción de audio a texto de alta fidelidad.',
      size: '1.6 GB',
      ready: status?.whisper_ready,
      recommended: true,
    },
    {
      id: 'llama-3-8b',
      name: 'Llama 3.1 8B (Instruct)',
      description:
        'Cerebro principal para redacción científica y análisis complejo.',
      size: '4.9 GB',
      ready: status?.llama_ready,
      recommended: hwInfo ? hwInfo.total_ram_gb >= 11 : false,
    },
    {
      id: 'biomed-2.7b',
      name: 'Phi-3.5 Mini (Biomed)',
      description:
        'Modelo optimizado para equipos con poca RAM o tareas rápidas.',
      size: '2.3 GB',
      ready: status?.biomed_ready,
      recommended: hwInfo ? hwInfo.total_ram_gb < 11 : false,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Gestor de Modelos IA
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            Administra los &quot;cerebros&quot; locales de NeuroScribe para
            trabajar 100% offline.
          </p>
        </div>
        <button
          onClick={refreshStatus}
          className="p-2 hover:bg-zinc-100 rounded-lg dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw size={20} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Hardware Info Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
            <HardDrive size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">
              RAM Total
            </p>
            <p className="text-sm font-bold">{hwInfo?.total_ram_gb} GB</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
            <Cpu size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">
              Núcleos CPU
            </p>
            <p className="text-sm font-bold">{hwInfo?.cpu_cores} Cores</p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div
            className={cn(
              'p-2 rounded-lg',
              mirrorOnline
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20'
                : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20'
            )}
          >
            <Zap size={20} />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">
              Estado Espejo
            </p>
            <p className="text-sm font-bold">
              {mirrorOnline ? 'Online (Rápido)' : 'Offline (HuggingFace)'}
            </p>
          </div>
        </div>
      </div>

      {/* Models List */}
      <div className="space-y-4">
        {models.map(model => (
          <div
            key={model.id}
            className={cn(
              'bg-white dark:bg-zinc-900 rounded-2xl border p-6 transition-all',
              model.ready
                ? 'border-emerald-100 dark:border-emerald-900/30'
                : 'border-zinc-200 dark:border-zinc-800'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg">{model.name}</h3>
                  {model.recommended && (
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full dark:bg-indigo-900/40 dark:text-indigo-400">
                      RECOMENDADO
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  {model.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <HardDrive size={12} /> {model.size}
                  </span>
                  {model.ready && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 size={12} /> Listo para usar
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-[140px]">
                {model.ready ? (
                  <button
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    onClick={() => handleRemoveModel(model.id)}
                  >
                    <Trash2 size={14} /> Eliminar
                  </button>
                ) : (
                  <button
                    disabled={!!downloading}
                    onClick={() => handleDownload(model.id)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100 dark:shadow-none"
                  >
                    {downloading === model.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {downloading === model.id ? 'Descargando...' : 'Descargar'}
                  </button>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {downloading === model.id && (
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span>Descargando...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex gap-3 items-start text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
        <AlertCircle size={18} className="shrink-0 mt-0.5" />
        <p>
          <strong>Nota Importante:</strong> La descarga de modelos puede tardar
          varios minutos dependiendo de tu conexión a internet. No cierres la
          aplicación hasta que la barra de progreso finalice. Los modelos se
          guardan en tu carpeta de datos local para máxima privacidad.
        </p>
      </div>
    </div>
  );
}
