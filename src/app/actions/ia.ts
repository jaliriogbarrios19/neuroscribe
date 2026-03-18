import { invoke } from '@tauri-apps/api/core';

export interface HardwareInfo {
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_cores: number;
  recommended_model: string;
}

export interface ModelStatus {
  whisper_ready: boolean;
  llama_ready: boolean;
  biomed_ready: boolean;
  models_path: string;
}

/**
 * Obtiene información del hardware del usuario.
 */
export async function getHardwareInfo(): Promise<HardwareInfo | null> {
  try {
    return await invoke<HardwareInfo>('get_hardware_info');
  } catch (err) {
    console.error("Error fetching hardware info:", err);
    return null;
  }
}

/**
 * Verifica si los modelos necesarios están descargados.
 */
export async function checkModelStatus(): Promise<ModelStatus | null> {
  try {
    return await invoke<ModelStatus>('check_models');
  } catch (err) {
    console.error("Error checking models status:", err);
    return null;
  }
}

/**
 * Inicia la descarga de un modelo.
 */
export async function downloadModel(modelName: string): Promise<string> {
  try {
    return await invoke<string>('download_model', { modelName });
  } catch (err) {
    console.error("Error starting download:", err);
    throw err;
  }
}

/**
 * Invoca el orquestador de transcripción local.
 * @param audioPath Ruta absoluta del archivo en disco.
 */
export async function transcribeAudioLocal(audioPath: string): Promise<string> {
  try {
    return await invoke<string>('transcribe_audio_local', { audioPath });
  } catch (err) {
    console.error("Error in local transcription:", err);
    throw new Error(typeof err === 'string' ? err : "Fallo en la transcripción offline.");
  }
}

/**
 * Invoca el orquestador de LLM local para resúmenes o análisis.
 * @param text Texto a procesar (transcripción).
 * @param task Tipo de tarea ('summary' | 'paper').
 */
export async function generateSummaryLocal(text: string, task: 'summary' | 'paper' = 'summary'): Promise<string> {
  try {
    return await invoke<string>('process_text_local', { text, task });
  } catch (err) {
    console.error("Error in local LLM inference:", err);
    throw new Error(typeof err === 'string' ? err : "Fallo en el análisis clínico offline.");
  }
}
