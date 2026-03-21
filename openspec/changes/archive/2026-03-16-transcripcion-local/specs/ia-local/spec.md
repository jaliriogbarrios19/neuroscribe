# IA-Local Specification

## Purpose

Este dominio define el comportamiento y los requisitos para la ejecución de modelos de IA de forma local, incluyendo la detección de capacidades del sistema y la orquestación de motores de transcripción y procesamiento de texto.

## Requirements

### Requirement: Hardware Capabilities Detection

El sistema DEBE ser capaz de detectar la memoria RAM total y la capacidad de procesamiento para recomendar y utilizar el modelo de IA local más adecuado.

#### Scenario: System recommendation for high-end RAM
- GIVEN a system with 32GB of RAM.
- WHEN the application initializes the hardware check.
- THEN it MUST recommend the "Llama-3-8B" model.
- AND it MUST notify the user of the "High-End" capabilities.

### Requirement: Model Lifecycle Management

El sistema DEBE verificar la existencia de los modelos necesarios en el disco local y gestionar su descarga si no están presentes.

#### Scenario: Missing Whisper model
- GIVEN the application is running.
- WHEN the user attempts to transcribe an audio but the model is missing.
- THEN the system MUST provide a way to download the required Whisper model.
- AND it MUST show progress during the download.

### Requirement: Offline Transcription Orchestration

El sistema DEBE ser capaz de ejecutar el sidecar de Whisper localmente para transcribir audios sin conexión a internet.

#### Scenario: Transcribing audio file locally
- GIVEN a valid audio file in WAV format (16kHz).
- WHEN the user starts the transcription process.
- THEN the system MUST invoke the `whisper-cli` sidecar with the correct model and file path.
- AND it MUST capture the transcribed text and return it to the frontend.

#### Scenario: Handling transcription errors
- GIVEN an invalid audio file or a failed sidecar process.
- WHEN the transcription is attempted.
- THEN the system MUST return a descriptive error message.
- AND it MUST allow the user to retry or change the file.
