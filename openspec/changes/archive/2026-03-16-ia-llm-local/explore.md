## Exploration: ia-llm-local

### Current State
NeuroScribe ya cuenta con transcripción local (Whisper) y persistencia local (SQLite). Sin embargo, la lógica de "Análisis Clínico" y "Generación de Papers" (que antes dependía de OpenRouter/Llama 3.1 405b) está desactivada o mockeada. Tenemos el binario de `llama-cli` configurado como sidecar, pero no existe el comando en Rust para enviarle prompts y recibir respuestas.

### Affected Areas
- `src-tauri/src/lib.rs` — Implementar el comando `process_text_local` que orqueste la ejecución de `llama-cli`.
- `src/app/actions/ia.ts` — Añadir la función `processTextLocal(prompt: string, modelType: 'llama' | 'phi')`.
- `src/app/(dashboard)/page.tsx` — Actualizar el flujo tras la transcripción para invocar el análisis clínico local automáticamente.

### Approaches
1. **Invocación por Prompt Directo (One-Shot)** — Enviar el texto transcrito junto con un system prompt al sidecar y esperar la respuesta completa.
   - Pros: Implementación sencilla.
   - Cons: No hay streaming de respuesta; el usuario debe esperar a que el modelo termine de procesar todo el texto.
   - Effort: Low

2. **Flujo con Streaming (Server-Sent Events / Tauri Events)** — Capturar la salida del sidecar palabra por palabra y enviarla al frontend en tiempo real.
   - Pros: Mejor experiencia de usuario (UX "viva").
   - Cons: Requiere una gestión de hilos y eventos de Tauri más compleja en Rust.
   - Effort: Medium

### Recommendation
Se recomienda el **Enfoque 1 (One-Shot)** para la fase inicial de validación del "Cerebro Local", asegurando que los prompts clínicos funcionen correctamente con modelos más pequeños (8B o 3B). Una vez validada la calidad, se migrará al streaming. El backend de Rust seleccionará automáticamente el binario de modelo descargado (`.gguf`) basándose en la recomendación de hardware previa.

### Risks
- **Latencia:** En hardware de gama baja (8GB RAM), el modelo Phi-3.5 puede tardar varios segundos en generar un resumen clínico largo.
- **Context Window:** Debemos asegurar que el prompt (transcripción + instrucciones) no exceda el límite del modelo (típicamente 4k o 8k tokens en versiones ligeras).

### Ready for Proposal
Yes — La infraestructura de sidecars está lista y el flujo de datos entre la transcripción y el análisis está claro.
