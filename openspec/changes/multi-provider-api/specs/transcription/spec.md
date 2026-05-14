# Delta for Transcription

## Purpose

Define el comportamiento del sistema de transcripcion multi-proveedor, diarizacion de hablantes, y renombrado de hablantes.

## ADDED Requirements

### Requirement: Multi-Provider Transcription

El sistema DEBE ser capaz de transcribir audio usando Gladia, DeepGram o AssemblyAI, ademas del modo offline existente (Whisper).

#### Scenario: Transcribe with Gladia
- GIVEN an audio file and the user selects Gladia as provider.
- WHEN transcription starts.
- THEN the system MUST POST the audio to the Gladia API with diarization enabled.
- AND the response MUST be parsed into TranscriptionResult with speaker-labeled segments.

#### Scenario: Transcribe with DeepGram
- GIVEN an audio file and the user selects DeepGram as provider.
- WHEN transcription starts.
- THEN the system MUST POST the audio to the DeepGram API with diarize=true.
- AND the response MUST be parsed into TranscriptionResult with speaker-labeled segments.

#### Scenario: Transcribe with AssemblyAI
- GIVEN an audio file and the user selects AssemblyAI as provider.
- WHEN transcription starts.
- THEN the system MUST upload the audio, submit for transcription, and poll until complete.
- AND the response MUST be parsed into TranscriptionResult with speaker-labeled segments.

#### Scenario: API key missing for selected provider
- GIVEN the user selects a cloud provider but has not configured its API key.
- WHEN transcription is attempted.
- THEN the system MUST return an error indicating the key is missing.
- AND MUST suggest navigating to Settings > APIs.

#### Scenario: Provider returns an error
- GIVEN any cloud provider returns a 4xx or 5xx error.
- WHEN the error occurs.
- THEN the system MUST return a descriptive error with HTTP status and provider name.
- AND the UI MUST show the error with a Retry button.

### Requirement: Speaker Diarization

El sistema DEBE identificar hablantes en el audio y mostrar segmentos con etiquetas de hablante.

#### Scenario: Display speaker segments
- GIVEN a completed transcription with diarization.
- WHEN the result is displayed.
- THEN each segment MUST show speaker label with distinct color, timestamp (MM:SS), and text.
- AND consecutive segments from the same speaker MUST be visually grouped.

#### Scenario: Speaker colors
- GIVEN a transcription with N speakers.
- WHEN the result is displayed.
- THEN each speaker MUST be assigned a distinct, readable color from a predefined palette.
- AND the color MUST be consistent for the same speaker across the entire transcription.

### Requirement: Speaker Renaming

El usuario DEBE poder renombrar las etiquetas de hablante generadas automaticamente.

#### Scenario: Rename a speaker inline
- GIVEN a transcription with speaker label Speaker 1.
- WHEN the user clicks on the speaker label.
- THEN the label MUST become an editable text input.
- AND the user can type a new name.
- AND pressing Enter or clicking outside MUST save the new name.
- AND all segments from that speaker MUST update to show the new name.

#### Scenario: Persist renamed speaker
- GIVEN a speaker has been renamed to Dr. Garcia.
- WHEN the transcription is saved or reloaded.
- THEN the custom name MUST be preserved.
- AND the is_user_defined flag MUST be set to true.

### Requirement: Unified Transcription Result

Todos los providers DEBEN devolver una estructura de datos unificada.

#### Scenario: Normalized response structure
- GIVEN a transcription completes with any provider.
- WHEN the result is returned to the frontend.
- THEN the response MUST include: full_text, segments array, and speakers array.
- AND each segment MUST have: speaker_id, speaker_label, text, start_ms, end_ms, confidence.
- AND each speaker MUST have: id, label, color.
