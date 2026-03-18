# IA-Local Specification

## Purpose

Este dominio define el comportamiento y los requisitos para la ejecución de modelos de IA de forma local, incluyendo la detección de capacidades del sistema y la gestión del ciclo de vida de los modelos (descarga, verificación y ejecución).

## Requirements

### Requirement: Hardware Capabilities Detection

El sistema DEBE ser capaz de detectar la cantidad de memoria RAM total y la disponibilidad de aceleración por hardware (GPU) para determinar el modelo de IA óptimo.

#### Scenario: Detecting high-end hardware
- GIVEN a system with 32GB of RAM.
- WHEN the application starts.
- THEN the system MUST identify the hardware as "High-End".
- AND it MUST recommend the usage of Llama-3-8B.

#### Scenario: Detecting entry-level hardware
- GIVEN a system with 8GB of RAM.
- WHEN the application starts.
- THEN the system MUST identify the hardware as "Entry-Level".
- AND it MUST recommend the usage of Phi-3.5-mini.

### Requirement: Model Lifecycle Management

El sistema DEBE verificar la presencia de los modelos necesarios en el disco local y gestionar su descarga segura si no están presentes.

#### Scenario: Model is missing
- GIVEN the required model `whisper-v3-turbo.bin` is not in the application data folder.
- WHEN the user attempts to start a transcription.
- THEN the system MUST prompt the user to download the model.
- AND it MUST display the download progress.

#### Scenario: Secure model verification
- GIVEN a downloaded model file.
- WHEN the download completes.
- THEN the system MUST verify the file integrity using a SHA-256 hash.

### Requirement: Offline Transcription Execution

El sistema DEBE ejecutar la transcripción de audio de forma 100% offline utilizando el motor Whisper.

#### Scenario: Successful local transcription
- GIVEN a valid audio file.
- AND the Whisper model is loaded.
- WHEN the user starts the transcription.
- THEN the system MUST execute the local sidecar.
- AND it MUST return the transcribed text to the editor without internet connection.
