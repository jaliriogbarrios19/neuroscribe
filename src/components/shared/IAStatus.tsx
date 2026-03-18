'use client'

import { useState, useEffect } from 'react';
import { getHardwareInfo, checkModelStatus, HardwareInfo, ModelStatus, downloadModel } from '@/app/actions/ia';
import { Cpu, Database, CheckCircle2, AlertCircle, Download, Loader2 } from 'lucide-react';

const IAStatus = () => {
  const [hwInfo, setHwInfo] = useState<HardwareInfo | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    const [hw, status] = await Promise.all([
      getHardwareInfo(),
      checkModelStatus()
    ]);
    setHwInfo(hw);
    setModelStatus(status);
    setLoading(false);
  };

  const handleDownload = async (name: string) => {
    setDownloading(name);
    try {
      await downloadModel(name);
      // En una implementación real, esperaríamos al evento de progreso
      alert(`La descarga de ${name} ha comenzado en segundo plano.`);
    } catch (err) {
      alert("Error al iniciar la descarga.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) return <div className="p-4 flex items-center gap-2 text-zinc-500 text-xs"><Loader2 size={14} className="animate-spin" /> Analizando hardware...</div>;

  return (
    <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <Cpu size={14} /> Estado del Motor IA Local
        </h3>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${hwInfo && hwInfo.total_ram_gb >= 15 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {hwInfo?.recommended_model === 'llama-3-8b' ? 'High-End' : 'Standard'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500">Memoria RAM</p>
          <p className="text-xs font-medium">{hwInfo?.total_ram_gb} GB</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-500">Núcleos CPU</p>
          <p className="text-xs font-medium">{hwInfo?.cpu_cores} Cores</p>
        </div>
      </div>

      <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-zinc-400" />
            <span className="text-[11px] font-medium">Whisper (Transcripción)</span>
          </div>
          {modelStatus?.whisper_ready ? (
            <CheckCircle2 size={14} className="text-green-500" />
          ) : (
            <button 
              onClick={() => handleDownload('whisper')}
              disabled={!!downloading}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
            >
              {downloading === 'whisper' ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />} Descargar
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database size={12} className="text-zinc-400" />
            <span className="text-[11px] font-medium">BioMedLM / Llama-3 (Resumen)</span>
          </div>
          {modelStatus?.llama_ready || modelStatus?.biomed_ready ? (
            <CheckCircle2 size={14} className="text-green-500" />
          ) : (
            <button 
              onClick={() => handleDownload(hwInfo?.recommended_model || 'llama-3-8b-q4')}
              disabled={!!downloading}
              className="text-[10px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-bold"
            >
              {downloading && downloading !== 'whisper' ? <Loader2 size={10} className="animate-spin" /> : <Download size={10} />} Descargar
            </button>
          )}
        </div>
      </div>

      {!modelStatus?.whisper_ready && (
        <div className="flex gap-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-100 dark:border-amber-900/30">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
            Se requiere descargar los modelos para habilitar el procesamiento offline.
          </p>
        </div>
      )}
    </div>
  );
};

export default IAStatus;
