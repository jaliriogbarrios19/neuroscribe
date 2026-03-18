# Delta for UI

## MODIFIED Requirements

### Requirement: Audio Uploader (Local Flow)

El componente Audio Uploader DEBE permitir la carga o grabación de audios y procesarlos mediante el orquestador local en lugar de una API externa.
(Anteriormente: El componente permitía la subida a Supabase y procesamiento vía `/api/transcribe`).

#### Scenario: Transcribing from the UI
- GIVEN the user is in the `AudioUploader` component.
- WHEN the user uploads or records an audio file.
- THEN the system MUST save the file temporarily in the application data folder.
- AND it MUST call the local `transcribe_audio` command via Tauri IPC.
- AND it MUST display the transcription progress and final result in the editor.

#### Scenario: Visual feedback during local processing
- GIVEN a transcription is in progress.
- WHEN the sidecar is executing in the backend.
- THEN the system MUST show a loading state with descriptive text (e.g., "Procesando audio localmente...").
