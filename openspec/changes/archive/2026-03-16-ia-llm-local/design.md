# Design: ia-llm-local

## Technical Approach

La orquestación del LLM local se basará en el mismo patrón de sidecars utilizado para la transcripción. Implementaremos un comando en Rust (`process_text_local`) que recibirá el prompt y el tipo de tarea (ej. "resumen clínico"). Rust seleccionará automáticamente el modelo GGUF adecuado (Llama-3-8B o Phi-3.5) basado en la RAM disponible detectada previamente. El backend construirá un prompt estructurado inyectando instrucciones de sistema para asegurar el rigor médico, ejecutará el sidecar `llama-cli` y capturará la salida generada para enviarla al frontend de una sola vez (one-shot).

## Architecture Decisions

### Decision: Inyección de Prompts en el Backend (Rust)
**Choice**: Los system prompts médicos residirán en el código de Rust.
**Rationale**: Centralizar los prompts en el backend asegura consistencia en todas las peticiones y evita que el frontend tenga que manejar strings de instrucciones complejos y sensibles. Facilita la actualización de la lógica de análisis sin tocar la UI.

### Decision: Selección Automática de Modelo
**Choice**: Rust decide entre `llama-3-8b-instruct.gguf` y `phi-3.5-mini.gguf`.
**Rationale**: El usuario no debe preocuparse por los detalles técnicos. El sistema debe elegir la mejor opción que el hardware pueda soportar de forma fluida.

### Decision: Ejecución Bloqueante del Sidecar (dentro de un Thread)
**Choice**: Usar el método `.output()` de `tauri::process::Command` dentro de un hilo asíncrono.
**Rationale**: Para esta fase inicial, esperar la respuesta completa simplifica el flujo de datos. Capturar el `stdout` del proceso una vez finalizado garantiza que recibamos el texto completo antes de actualizar la UI.

## Data Flow

`UI (Text + Action) ──→ invoke('process_text_local')`
`Rust (Select Model + Build Prompt) ──→ Sidecar (llama-cli) ──→ Capture Stdout ──→ Rust (Clean output) ──→ UI (TipTap)`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modify | Implementar el comando `process_text_local` y el diccionario de prompts médicos. |
| `src/app/actions/ia.ts` | Modify | Añadir la función `generateSummaryLocal(text: string)`. |
| `src/app/(dashboard)/page.tsx` | Modify | Actualizar los manejadores de eventos para invocar la IA local tras una transcripción. |

## Interfaces / Contracts

### Prompt Types (Rust Enum)
```rust
enum ClinicalTask {
    Summary,
    ResearchPaper,
    DiagnosticAnalysis
}
```

### IPC Argument Structure
```typescript
{
  text: string,
  task: 'summary' | 'paper'
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | LLM Flow | Enviar un texto médico simple y verificar que el sidecar devuelve un resumen en formato de texto plano. |
| Integration | Hardware Switch | Simular valores de RAM bajos/altos para asegurar que se carga el modelo correcto. |
| E2E | Full Pipeline | Transcribir un audio corto y luego generar un resumen clínico, verificando que el flujo completo funciona offline. |

## Migration / Rollout

Este cambio elimina las últimas referencias a APIs externas en el flujo principal de trabajo de NeuroScribe.

## Open Questions

- [ ] ¿Cómo manejaremos los casos donde el LLM genere una respuesta demasiado corta o falle en seguir las instrucciones? (Necesitaremos validación de salida básica en Rust).
- [ ] ¿Debemos implementar un sistema de cancelación de peticiones si el usuario cierra el documento mientras el LLM procesa?
