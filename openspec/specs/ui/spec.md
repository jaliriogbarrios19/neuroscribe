# UI Specification

## Requirements

### Requirement: Dashboard Layout Group

The system MUST organize authenticated routes within a `(dashboard)` route group to share common layout components (Sidebar, Navbar) without affecting the root path structure.

#### Scenario: Navigating to the home page (dashboard)
- GIVEN the user is authenticated.
- WHEN they navigate to `/`.
- THEN the system MUST render the `src/app/(dashboard)/layout.tsx`.
- AND it MUST display the shared sidebar and the dashboard content.

### Requirement: Utility `cn` for Tailwind Classes

The system MUST provide a central utility `cn` to merge Tailwind CSS classes conditionally, ensuring that conflicting classes are resolved correctly.

#### Scenario: Merging tailwind classes conditionally
- GIVEN a component that needs conditional styling.
- WHEN the `cn` function is called with a mix of static classes and conditional objects.
- THEN it MUST return a single string with all valid classes.
- AND it MUST prioritize the last class in case of Tailwind conflicts (e.g., `p-2` and `p-4`).

### Requirement: Research Sidebar

El sistema DEBE proporcionar una barra lateral o panel interactivo para realizar búsquedas académicas sin salir del editor principal.

#### Scenario: Opening the Research Sidebar
- GIVEN the user is in the main dashboard workspace.
- WHEN the user clicks on the "Investigación" button.
- THEN the system MUST display the Research Sidebar on the right side of the screen.
- AND it MUST contain a search input and a results area.

#### Scenario: Displaying academic results
- GIVEN the Research Sidebar is open.
- WHEN the user enters a search query and submits.
- THEN the system MUST display a list of articles with their titles and abstracts.
- AND each article MUST have a "Citar" or "Sintetizar" button.

### Requirement: Audio Uploader (Local Flow)

El componente Audio Uploader DEBE permitir la carga o grabación de audios y procesarlos mediante el orquestador local en lugar de una API externa.

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
