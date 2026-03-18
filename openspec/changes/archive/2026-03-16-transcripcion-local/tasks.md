# Tasks: transcripcion-local

## Phase 1: Infrastructure (Rust Backend)

- [x] 1.1 Implementar el comando `transcribe_audio_local` en `src-tauri/src/lib.rs` que utilice `tauri::process::Command::new_sidecar`.
- [x] 1.2 Configurar el comando para generar salida JSON y capturar la ruta del archivo resultante.
- [x] 1.3 Implementar lógica de parseo del JSON de Whisper y retorno de texto limpio al frontend.
- [x] 1.4 Añadir limpieza de archivos temporales (audio y json) tras la ejecución exitosa o fallida.

## Phase 2: Integration (Frontend Actions)

- [x] 2.1 Actualizar `src/app/actions/ia.ts` con la función `transcribeAudioLocal(filePath: string)`.
- [x] 2.2 Asegurar que el tipado de retorno coincida con la estructura devuelta por Rust.

## Phase 3: UI Update (Audio Uploader)

- [x] 3.1 Modificar `handleUpload` en `src/components/transcription/AudioUploader.tsx`:
    - Reemplazar la llamada a `fetch('/api/transcribe')` por una secuencia que guarde el archivo en el sistema de archivos local.
    - Invocar `transcribeAudioLocal` con la ruta del archivo guardado.
- [x] 3.2 Actualizar los mensajes de estado en la UI para reflejar el proceso local (ej. "Transcribiendo offline...").

## Phase 4: Verification & Cleanup

- [ ] 4.1 Validar con un archivo WAV real que la transcripción local se inyecta en el editor. (Manual)
- [ ] 4.2 Probar el comportamiento cuando no hay conexión a internet. (Manual)
- [ ] 4.3 Verificar que no queden archivos huérfanos en la carpeta de caché tras múltiples transcripciones. (Manual)
