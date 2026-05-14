import { invoke } from '@tauri-apps/api/core';
import type { TranscriptionResult } from '@/types/transcription';
import type { ApiKeyEntry } from '@/types/apiKeys';

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
 * Obtiene informacion del hardware del usuario.
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
 * Verifica si los modelos necesarios estan descargados.
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
 * Invoca el orquestador de transcripcion local.
 * @param audio_path Ruta absoluta del archivo en disco.
 */
export async function transcribeAudioLocal(audio_path: string): Promise<string> {
  try {
    return await invoke<string>('transcribe_audio_local', { audio_path });
  } catch (err) {
    console.error("Error in local transcription:", err);
    throw new Error(typeof err === 'string' ? err : "Fallo en la transcripcion offline.");
  }
}

/**
 * Invoca el orquestador de LLM local para resumenes o analisis.
 * @param text Texto a procesar (transcripcion).
 * @param task Tipo de tarea ('summary' | 'paper').
 */
export async function generateSummaryLocal(text: string, task: 'summary' | 'paper' = 'summary'): Promise<string> {
  try {
    return await invoke<string>('process_text_local', { text, task });
  } catch (err) {
    console.error("Error in local LLM inference:", err);
    throw new Error(typeof err === 'string' ? err : "Fallo en el analisis clinico offline.");
  }
}

// --- API Keys ---

export async function saveApiKey(provider: string, key: string): Promise<ApiKeyEntry> {
  return invoke<ApiKeyEntry>('save_api_key', { provider, key });
}

export async function getApiKeys(): Promise<ApiKeyEntry[]> {
  return invoke<ApiKeyEntry[]>('get_api_keys');
}

export async function deleteApiKey(provider: string): Promise<boolean> {
  return invoke<boolean>('delete_api_key', { provider });
}

// --- Transcription Cloud ---

export async function transcribeWithProvider(audioPath: string, provider: string): Promise<TranscriptionResult> {
  return invoke<TranscriptionResult>('transcribe_with_provider', { audioPath, provider });
}

export async function transcribeWithProviderOffline(audioPath: string, provider: string): Promise<TranscriptionResult> {
  return invoke<TranscriptionResult>('transcribe_with_provider_offline', { audioPath, provider });
}

export async function updateSpeakerLabel(speakerId: string, newLabel: string): Promise<boolean> {
  return invoke<boolean>('update_speaker_label', { speakerId, newLabel });
}

// --- LLM Cloud Providers ---

export async function llmGenerate(provider: string, prompt: string, model?: string): Promise<string> {
  return invoke<string>('llm_generate', { provider, prompt, model });
}
