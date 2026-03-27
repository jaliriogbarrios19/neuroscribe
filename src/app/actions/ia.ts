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
 * Obtiene informaciÃ³n del hardware del usuario.
 */
export async function getHardwareInfo(): Promise<HardwareInfo | null> {
  try {
    return await invoke<HardwareInfo>('get_hardware_info');
  } catch (err) {
    console.error('Error fetching hardware info:', err);
    return null;
  }
}

/**
 * Verifica si los modelos necesarios estÃ¡n descargados.
 */
export async function checkModelStatus(): Promise<ModelStatus | null> {
  try {
    return await invoke<ModelStatus>('check_models');
  } catch (err) {
    console.error('Error checking models status:', err);
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
    console.error('Error starting download:', err);
    throw err;
  }
}

/**
 * Invoca el orquestador de transcripciÃ³n local.
 * @param audio_path Ruta absoluta del archivo en disco.
 */
export async function transcribeAudioLocal(
  audio_path: string
): Promise<string> {
  try {
    return await invoke<string>('transcribe_audio_local', { audio_path });
  } catch (err) {
    console.error('Error in local transcription:', err);
    throw new Error(
      typeof err === 'string' ? err : 'Fallo en la transcripciÃ³n offline.'
    );
  }
}

/**
 * Invoca el orquestador de LLM local para resÃºmenes o anÃ¡lisis.
 * @param text Texto a procesar (transcripciÃ³n).
 * @param task Tipo de tarea ('summary' | 'paper').
 */
export async function generateSummaryLocal(
  text: string,
  task: 'summary' | 'paper' = 'summary'
): Promise<string> {
  try {
    return await invoke<string>('process_text_local', { text, task });
  } catch (err) {
    console.error('Error in local LLM inference:', err);
    throw new Error(
      typeof err === 'string' ? err : 'Fallo en el anÃ¡lisis clÃ­nico offline.'
    );
  }
}

/** Prompts de sistema para acciones inline del editor (Spanish). */
const EDITOR_ACTION_PROMPTS: Record<
  'explain' | 'summarize' | 'continue',
  string
> = {
  explain:
    'Explica el siguiente texto de forma clara y concisa en español, como si se lo explicaras a un colega de salud.',
  summarize:
    'Resume el siguiente texto de forma breve y estructurada en español, extrayendo los puntos clave.',
  continue:
    'Continúa escribiendo coherentemente a partir del siguiente fragmento, manteniendo el estilo, tono y registro clínico.',
};

/**
 * Invoca el LLM local para una acción inline dentro del editor TipTap.
 * @param text Texto seleccionado en el editor.
 * @param action Tipo de acción: 'explain' | 'summarize' | 'continue'.
 */
export async function processEditorAction(
  text: string,
  action: 'explain' | 'summarize' | 'continue'
): Promise<string> {
  try {
    const systemPrompt = EDITOR_ACTION_PROMPTS[action];
    return await invoke<string>('process_text_local', {
      text,
      task: systemPrompt,
    });
  } catch (err) {
    console.error('Error in editor inline action:', err);
    throw new Error(
      typeof err === 'string' ? err : 'Fallo en la acción de editor offline.'
    );
  }
}
