# Delta for UI

## MODIFIED Requirements

### Requirement: Audio Uploader with Provider Selection

El componente AudioUploader DEBE incluir un selector de provider y mostrar resultados con hablantes diferenciados.
(Anteriormente: Solo soportaba transcripcion offline sin distincion de hablantes.)

#### Scenario: Provider selector in upload flow
- GIVEN the user opens the AudioUploader component.
- WHEN the component renders.
- THEN a provider dropdown MUST be visible before starting transcription.
- AND the dropdown MUST list Offline (Whisper) as default plus any configured cloud providers.

#### Scenario: Display transcription with speakers
- GIVEN a transcription completes with diarization data.
- WHEN the result is displayed.
- THEN segments MUST be shown grouped by speaker with colored labels.
- AND each segment MUST display timestamp and text.
- AND the raw full_text MUST still be injected into the TipTap editor.

#### Scenario: Inline speaker rename
- GIVEN speaker segments are displayed.
- WHEN the user clicks on a speaker label.
- THEN the label MUST switch to an editable input field.
- AND saving the new name MUST update all segments for that speaker.
- AND the new name MUST be sent to the backend for persistence.

### Requirement: API Keys Settings Page

El sistema DEBE tener una pagina dedicada para que el usuario configure sus API keys.

#### Scenario: API keys settings page
- GIVEN the user navigates to Settings.
- WHEN they click on API Keys in the sidebar.
- THEN a form MUST display fields for each provider: Gladia, DeepGram, AssemblyAI, PubMed, Semantic Scholar, Crossref.
- AND each field MUST have a label, description, masked input, and Save/Delete buttons.

#### Scenario: Save an API key from settings
- GIVEN the user enters a key and clicks Save.
- WHEN the key is saved successfully.
- THEN a success indicator MUST appear.
- AND the input MUST show the masked key.

#### Scenario: Masked key with reveal toggle
- GIVEN a saved API key is displayed.
- WHEN the user clicks the eye icon.
- THEN the full key MUST be revealed temporarily.
- AND clicking again MUST re-mask it.

### Requirement: Research APIs using user keys

Las APIs de investigacion DEBEN usar las claves configuradas por el usuario en lugar de valores hardcodeados.

#### Scenario: PubMed with user API key
- GIVEN the user has configured a PubMed API key.
- WHEN the research module searches PubMed.
- THEN the request MUST include api_key parameter with the user's key.

#### Scenario: PubMed without API key (fallback)
- GIVEN the user has NOT configured a PubMed API key.
- WHEN the research module searches PubMed.
- THEN the request MUST proceed without authentication (E-utilities default rate limit).

#### Scenario: Research with configured email
- GIVEN the user has configured a Crossref email.
- WHEN verifying a DOI.
- THEN the mailto parameter MUST use the configured email instead of the hardcoded one.
