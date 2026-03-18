# Tasks: ia-llm-local

## Phase 1: Infrastructure (Rust Backend)

- [x] 1.1 Implementar el comando `process_text_local` en `src-tauri/src/lib.rs` que utilice `tauri::process::Command::new_sidecar("llama-cli")`.
- [x] 1.2 Definir un diccionario de System Prompts (Summary, Paper, Analysis) en Rust.
- [x] 1.3 Implementar lógica de selección de modelo GGUF (Llama vs Phi) basada en la RAM detectada.
- [x] 1.4 Configurar la captura de `stdout` para limpiar metadatos de carga del modelo y devolver solo la respuesta generada.

## Phase 2: Integration (Frontend Actions)

- [x] 2.1 Actualizar `src/app/actions/ia.ts` con la función `generateSummaryLocal(transcript: string)`.
- [x] 2.2 Asegurar que la función maneje estados de error claros si el sidecar falla o el modelo no existe.

## Phase 3: UI Update (Dashboard Logic)

- [x] 3.1 Modificar el componente principal en `src/app/(dashboard)/page.tsx` para:
    - Inyectar el botón de "Generar Resumen Local".
    - Conectar el resultado de la transcripción Whisper con el orquestador Llama.
- [x] 3.2 Implementar un indicador de carga específico para el procesamiento de texto ("Analizando clínicamente...").

## Phase 4: Verification & Cleanup

- [ ] 4.1 Validar que un texto de 500 palabras se resume localmente en menos de 1 minuto. (Manual)
- [ ] 4.2 Probar el cambio automático de modelo simulando diferentes capacidades de RAM. (Manual)
- [ ] 4.3 Verificar el funcionamiento offline completo desactivando la red durante el proceso. (Manual)
