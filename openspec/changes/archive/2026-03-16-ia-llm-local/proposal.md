# Proposal: ia-llm-local

## Intent

Cerrar el ciclo de IA local en NeuroScribe mediante la implementación del orquestador de LLM (Llama/Phi). Esto permitirá que el texto transcrito localmente por Whisper sea procesado (resumido, analizado clínicamente o convertido en paper) de forma 100% offline mediante el sidecar `llama-cli`, garantizando la privacidad del paciente y eliminando los costos de OpenRouter/OpenAI.

## Scope

### In Scope
- **Comando de Rust `process_text_local`:** Implementar la lógica para invocar el sidecar de Llama pasando el prompt, el modelo adecuado (según hardware) y los parámetros de generación (temp, top-p, etc.).
- **Gestión de Prompts Clínicos:** Implementar un sistema básico en Rust para inyectar system prompts médicos a la consulta del usuario.
- **Puente IPC Generativo:** Actualizar `src/app/actions/ia.ts` con la función `generateSummaryLocal`.
- **Integración Onboarding IA:** Mostrar en la UI cuándo el modelo LLM está listo para su uso.

### Out of Scope
- **Streaming de Respuesta:** La salida se entregará en un solo bloque (one-shot) para simplificar la primera versión del orquestador.
- **Entrenamiento/Fine-tuning Local:** El sistema solo utilizará modelos base pre-descargados (GGUF).
- **IA de Imagen local:** La generación de diagramas médicos se mantiene fuera de este sprint.

## Approach

Se utilizará el módulo `tauri::process::Command` para ejecutar el binario `llama-cli-x86_64-pc-windows-msvc.exe`. El flujo será:
1. El frontend envía el texto transcrito y el tipo de reporte deseado.
2. Rust selecciona el archivo `.gguf` correcto (Llama-3-8B si RAM > 15GB, de lo contrario Phi-3.5).
3. Rust construye un prompt estructurado (System Prompt Médico + Texto Transcrito).
4. Se ejecuta el sidecar capturando el `stdout`.
5. El resultado se devuelve al frontend y se inyecta en el editor TipTap.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modified | Nuevo comando `process_text_local` y lógica de selección de modelo LLM. |
| `src/app/actions/ia.ts` | Modified | Función `generateSummaryLocal` para conectar con el backend. |
| `src/app/(dashboard)/page.tsx` | Modified | Actualización de los botones de "Generar Resumen" para usar el flujo local. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Alto tiempo de inferencia | High | Mostrar una barra de carga "indeterminada" con mensajes alentadores y optimizar el número de threads. |
| Alucinaciones con modelos pequeños | Medium | Ajustar los system prompts para ser muy restrictivos ("Usa solo la información proporcionada"). |
| Falta de memoria (OOM) | Medium | Validar la RAM disponible antes de cargar el modelo en el sidecar. |

## Rollback Plan

Mantener activos los mocks establecidos en fases previas si la generación local falla críticamente.

## Dependencies

- **Llama Sidecar:** Ya posicionado en `src-tauri/bin/llama/`.
- **Modelos GGUF:** Deben estar descargados en la carpeta de AppData.

## Success Criteria

- [ ] Un prompt de prueba genera un resumen clínico coherente en menos de 30 segundos (en hardware recomendado).
- [ ] El sistema elige automáticamente Phi-3.5 si detecta menos de 15GB de RAM.
- [ ] El resultado se visualiza correctamente en el editor TipTap sin errores de red.
