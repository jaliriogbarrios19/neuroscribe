# Delta for UI

## MODIFIED Requirements

### Requirement: Clinical Analysis UI (Local Flow)

La interfaz de usuario DEBE permitir invocar el análisis clínico y la generación de resúmenes utilizando el orquestador LLM local.
(Anteriormente: Dependía de OpenRouter/Llama 3.1 405b externo).

#### Scenario: Requesting a summary from the editor
- GIVEN a transcript is present in the editor.
- WHEN the user clicks on "Generar Resumen Clínico".
- THEN the system MUST call the local `process_text_local` command via Tauri IPC.
- AND it MUST show a non-blocking loading indicator until the LLM sidecar finishes.
- AND it MUST replace or append the result in the editor.
