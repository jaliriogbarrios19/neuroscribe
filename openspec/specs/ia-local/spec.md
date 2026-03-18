# IA-Local Specification (v2)

## Purpose
Este dominio define el comportamiento y los requisitos para la ejecución de modelos de IA de forma local, incluyendo la detección de capacidades del sistema y la orquestación de modelos especializados (BioMedLM, Llama 3.1) para tareas clínicas y científicas.

## Requirements

### Requirement: Hardware Capabilities Detection (Research v2)
El sistema DEBE detectar la RAM total para optimizar la carga de modelos. Se establece una base superior para soportar la lectura de documentos completos.
- **Recomendado**: 12GB+ RAM.
- **Mínimo**: 8GB RAM (requiere cuantización extrema e IQ4_XS para evitar swaps de disco).

#### Scenario: High-RAM environment
- GIVEN a system with 16GB of RAM.
- WHEN the application starts.
- THEN it MUST enable the "Full-Context" mode for Agent One/Two.

### Requirement: Domain-Specific Model Selection
El sistema DEBE seleccionar el motor de inferencia basándose en el dominio de la investigación:

- **Medicina / Psiquiatría / Neuropsicología**:
    - **Generador Core (Agentes One/Two)**: `BioMedLM 2.7B (q4)`.
    - **Post-Editor / Refinador de Estilo**: `Meta-Llama-3.1-8B-Instruct`.
- **Psicología / General**:
    - **Orquestación Completa (Investigador, One, Two)**: `Meta-Llama-3.1-8B-Instruct`.

#### Scenario: Medicine domain pipeline
- GIVEN a research query about "Pharmacology of antidepressants".
- WHEN the paper generation starts.
- THEN Agent One/Two MUST use `BioMedLM` for technical synthesis.
- AND `Llama-3.1` MUST be used at the end to polish style and flow.

### Requirement: Context Management for Research
Para leer 10 artículos completos en 8GB-12GB de RAM, el sistema DEBE implementar una gestión dinámica de contexto ("Summarization Chains") para que ningún modelo exceda los 16k tokens activos simultáneos.

### Requirement: Model Lifecycle (BioMedLM & Llama 3.1)
El sistema DEBE incluir `BioMedLM 2.7B` y `Meta-Llama-3.1-8B-Instruct` en la lista de modelos descargables. **Se descarta definitivamente el uso de Phi-3.5-mini.**

### Requirement: Offline Transcription Execution
El sistema DEBE ejecutar la transcripción de audio de forma 100% offline utilizando el motor Whisper.

#### Scenario: Successful local transcription
- GIVEN a valid audio file.
- AND the Whisper model is loaded.
- WHEN the user starts the transcription.
- THEN the system MUST execute the local sidecar.
- AND it MUST return the transcribed text to the editor without internet connection.
