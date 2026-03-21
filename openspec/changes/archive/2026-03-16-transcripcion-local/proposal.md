# Proposal: transcripcion-local

## Intent

Implementar el orquestador de transcripción local en el backend de Rust para permitir que NeuroScribe procese audios clínicos de forma 100% offline. Esto implica conectar el componente `AudioUploader` del frontend con el sidecar `whisper-cli` mediante comandos de Tauri, garantizando la privacidad absoluta de los datos del paciente y eliminando la dependencia de APIs de terceros.

## Scope

### In Scope
- **Comando de Rust `transcribe_audio`:** Implementar la lógica para invocar el sidecar de Whisper pasando la ruta del archivo de audio y el modelo correspondiente.
- **Gestión de Archivos Temporales:** Lógica para guardar audios grabados en el frontend en una carpeta temporal segura antes de procesarlos.
- **Puente IPC:** Actualizar `src/app/actions/ia.ts` con la función `transcribeAudio` para facilitar la llamada desde React.
- **Actualización de UI:** Modificar `AudioUploader.tsx` para utilizar el flujo local en lugar del endpoint `/api/transcribe`.

### Out of Scope
- **Conversión Automática de Audio:** El soporte para formatos no-WAV (MP3/M4A) mediante FFmpeg se realizará en una iteración posterior.
- **Análisis Clínico Local (Llama):** La integración del LLM para el resumen se tratará como un cambio separado tras validar la transcripción.

## Approach

Se utilizará el módulo `tauri::process::Command` para ejecutar el binario `whisper-cli-x86_64-pc-windows-msvc.exe`. El flujo será:
1. El frontend recibe el audio (subido o grabado).
2. Se guarda el audio en el directorio `appCache` del usuario mediante el plugin de FS de Tauri.
3. Se invoca `invoke('transcribe_audio', { path: ... })`.
4. Rust ejecuta el sidecar, captura el `stdout` y devuelve el texto transcrito.
5. El frontend recibe el texto y lo inyecta en el editor TipTap.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modified | Nuevo comando `transcribe_audio` y lógica de ejecución de sidecar. |
| `src/app/actions/ia.ts` | Modified | Inclusión de la función `transcribeAudioLocal`. |
| `src/components/transcription/AudioUploader.tsx` | Modified | Reemplazo de `fetch` por `invoke`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Bloqueo del hilo principal | Medium | Ejecutar el sidecar en una tarea asíncrona de Rust para no congelar la UI de Tauri. |
| Formato de audio incompatible | High | Forzar grabación en WAV desde el frontend o mostrar advertencia clara al usuario. |
| Rutas con espacios en Windows | Low | Asegurar el entrecomillado correcto de los argumentos del comando. |

## Rollback Plan

Revertir a los mocks de IA establecidos en fases anteriores.

## Dependencies

- **Whisper Sidecar:** Ya posicionado en `src-tauri/bin/whisper/`.
- **Tauri Plugin FS:** Necesario para guardar el audio temporal.

## Success Criteria

- [ ] Un archivo WAV de prueba se transcribe correctamente al invocar el comando desde el frontend.
- [ ] La barra de progreso en `AudioUploader` refleja el estado del proceso local.
- [ ] El texto resultante aparece en el editor TipTap sin errores de red.
