## Exploration: transcripcion-local

### Current State
El componente `AudioUploader.tsx` actualmente intenta enviar audios a `/api/transcribe` (una ruta de Next.js ahora desactivada) utilizando `fetch`. La lógica de backend en Rust ya tiene registrados los binarios reales de `whisper.cpp` y `llama.cpp` como sidecars, pero no existe el comando para invocarlos con archivos de audio reales. El frontend aún no sabe cómo comunicarse con el orquestador local para procesar el audio.

### Affected Areas
- `src-tauri/src/lib.rs` — Implementar el comando `process_audio_local` que reciba una ruta de archivo y devuelva el texto.
- `src/app/actions/ia.ts` — Añadir la función `transcribeAudio(filePath: string)` para invocar el comando de Rust.
- `src/components/transcription/AudioUploader.tsx` — Cambiar el flujo de `handleUpload` para:
    1. Guardar el archivo temporalmente en disco (vía Tauri `fs`).
    2. Invocar la transcripción local pasándole la ruta.
    3. (Opcional) Invocar al LLM local para el análisis clínico.

### Approaches
1. **Flujo Directo (Audio -> Whisper)** — Pasar el archivo de audio directamente al sidecar de Whisper.
   - Pros: Simplicidad.
   - Cons: `whisper.cpp` solo acepta formatos específicos (WAV 16kHz). Si el usuario sube un MP3 o M4A, fallará.
   - Effort: Low

2. **Flujo con Pre-procesamiento (Audio -> FFmpeg -> Whisper)** — Usar un sidecar de FFmpeg (o una librería de Rust) para convertir cualquier audio a WAV 16kHz antes de pasarlo a Whisper.
   - Pros: Máxima compatibilidad con formatos de usuario.
   - Cons: Requiere otro sidecar (FFmpeg) aumentando el tamaño de la app.
   - Effort: Medium

### Recommendation
Se recomienda el **Enfoque 1 (Flujo Directo)** inicialmente para validar el orquestador, con una restricción en la UI que solicite archivos WAV/MP3 compatibles (muchos navegadores ya graban en formatos manejables). Para una fase posterior, se integrará la conversión automática. El backend de Rust usará `tauri::process::Command` para ejecutar el sidecar de `whisper-cli`.

### Risks
- **Rutas de Archivos:** Las rutas de archivos en Windows pueden tener problemas de escape si no se manejan correctamente en el paso de argumentos al sidecar.
- **Rendimiento:** La transcripción de audios largos (>30 min) puede congelar el hilo si no se ejecuta de forma asíncrona correctamente en Rust.

### Ready for Proposal
Yes — La arquitectura de sidecars está lista y solo falta el "pegamento" lógico en Rust y el cambio de invocación en el frontend.
