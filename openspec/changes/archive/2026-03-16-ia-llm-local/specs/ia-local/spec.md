# Delta for IA-Local

## ADDED Requirements

### Requirement: Offline LLM Text Processing

El sistema DEBE ser capaz de ejecutar el sidecar de Llama localmente para procesar textos (resúmenes, análisis clínicos) sin conexión a internet.

#### Scenario: Generating a clinical summary locally
- GIVEN a transcribed text from a clinical session.
- AND the recommended LLM model (Llama-3 or Phi-3) is present in the disk.
- WHEN the user requests a "Clinical Summary".
- THEN the system MUST invoke the `llama-cli` sidecar with the appropriate system prompt.
- AND it MUST capture the generated text and return it to the frontend.

#### Scenario: Selection of LLM model based on hardware
- GIVEN the application knows the RAM capacity.
- WHEN a text processing command is initiated.
- THEN the system MUST select the `Llama-3-8B` model if RAM >= 15GB.
- AND it MUST select the `Phi-3.5-mini` model if RAM < 15GB.

### Requirement: Clinical System Prompts

El backend DEBE inyectar automáticamente un prompt de sistema especializado para tareas médicas antes de procesar el texto con el LLM.

#### Scenario: Applying a medical persona
- GIVEN a raw transcript.
- WHEN the process starts in Rust.
- THEN the system MUST prepend instructions like "Eres un asistente médico experto. Resume la siguiente consulta..." to the LLM input.
