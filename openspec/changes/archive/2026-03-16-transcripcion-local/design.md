# Design: transcripcion-local

## Technical Approach

La transcripción local se implementará como una orquestación asíncrona en el backend de Rust. Cuando el usuario sube o graba un audio, el frontend lo guardará en el directorio de caché de la aplicación. Luego, invocará el comando `transcribe_audio_local`, el cual ejecutará el sidecar `whisper-cli` con los argumentos necesarios (modelo, ruta de audio y formato de salida). Capturaremos el `stdout` del proceso para obtener el texto y devolverlo al frontend. Se implementará un mecanismo de reporte de progreso básico basado en la salida por consola del sidecar si es posible, o mediante estados discretos.

## Architecture Decisions

### Decision: Ejecución Asíncrona del Sidecar
**Choice**: Usar `tauri::async_runtime::spawn` y `tauri::process::Command` para ejecutar el binario.
**Rationale**: El proceso de transcripción es intensivo en CPU y puede durar varios segundos o minutos. Ejecutarlo de forma asíncrona evita que la ventana principal de la aplicación se congele.

### Decision: Formato de Intercambio (JSON)
**Choice**: Solicitar a `whisper-cli` que genere una salida en formato JSON (`--output-json`).
**Rationale**: Es mucho más robusto parsear un archivo JSON generado por el motor que intentar capturar y limpiar el `stdout` de texto plano, el cual puede contener metadatos de carga del modelo.

### Decision: Ubicación de Archivos Temporales
**Choice**: Directorio `app_cache_dir` de Tauri.
**Rationale**: Sigue las convenciones del OS para archivos temporales que pueden ser borrados de forma segura y no necesitan persistencia a largo plazo.

## Data Flow

`Frontend (Audio File) ──→ Save to Disk (Cache Dir) ──→ invoke('transcribe_audio_local')`
`Rust ──→ Command::new_sidecar('whisper-cli') ──→ Exec process ──→ Read JSON result ──→ Rust ──→ Return String to Frontend`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modify | Implementar el comando `transcribe_audio_local` y lógica de ejecución. |
| `src/app/actions/ia.ts` | Modify | Añadir `transcribeAudioLocal(filePath: string)` para IPC. |
| `src/components/transcription/AudioUploader.tsx` | Modify | Actualizar `handleUpload` para guardar el archivo y llamar al comando local. |

## Interfaces / Contracts

### Command Argument Structure (Rust)
```rust
let command = Command::new_sidecar("whisper-cli")
    .args([
        "-m", &model_path,
        "-f", &audio_path,
        "-oj", // Output JSON
        "-of", &output_path_prefix,
        "-l", "auto" // Auto-detect language
    ]);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Sidecar Flow | Ejecutar el comando con un audio corto de 5 segundos y verificar que devuelve texto coherente. |
| Integration | Error Handling | Simular un archivo de audio corrupto y verificar que el backend devuelve un error descriptivo. |
| E2E | UI to Rust | Subir un archivo desde el componente `AudioUploader` y verificar que el texto llega al editor. |

## Migration / Rollout

No requiere migración de datos. El nuevo flujo reemplaza completamente las llamadas a `fetch('/api/transcribe')`.

## Open Questions

- [ ] ¿Cómo manejaremos audios muy pesados (>100MB)? (Podríamos necesitar un streaming de progreso más granular).
- [ ] ¿Deberíamos borrar el audio temporal inmediatamente después de la transcripción exitosa? (Sí, por privacidad).
