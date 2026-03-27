# MEMORIA DE PROGRESO: NEUROSCRIBE

## [ESTADO ACTUAL]
- **Fase Actual:** `Sprint 3` (Flujo Clínico Completo + Gestión de Documentos).
- Sprints 1 y 2 completados exitosamente.
- **Sprint 3:** En Progreso.

## [LOGROS FINALIZADOS]
- ✅ **Setup Inicial Completo:** Transición a Local-First (Tauri + SQLite), eliminación de Supabase, UI de Licencias, e integración de conectores de Modelos Locales verificados.
- ✅ **Fundación Frontend:** Next.js 16 (App Router) y Tiptap básico integrado.
- ✅ **Decisión Arquitectónica:** Transición oficial acordada a **Local-First (Tauri + SQLite)**.
- ✅ **Refactor de Layout:** Movidos elementos globales al Route Group `(dashboard)` y `DashboardShell`.
- ✅ **Sanear Páginas:** Eliminadas rutas de `auth` y rastros de Supabase.
- ✅ **Gestor de Modelos (Sprint 1):** UI en `/settings/models` con descarga Multisource y comandos Rust.
- ✅ **Auto-Detección:** Banner global que detecta ausencia de modelos.
- ✅ **Coding Standards (Fase 1):** Prettier, ESLint, Husky, commitlint, CODING_STANDARDS.md.
- ✅ **Sincronización de Estados Globales (Sprint 2):** `ModelProvider` centraliza estado de descarga — `IAStatus` y `ModelsManagerPage` comparten estado reactivo.
- ✅ **Acciones Inline del Editor (Sprint 2):** `EditorBubbleMenu` con 3 acciones IA offline (Explicar, Resumir, Continuar).
- ✅ **Flujo de Transcripción Completo (Sprint 3):** Implementado paso a paso en dos modales:
  - **Paso 1:** `AudioUploader` — el usuario sube o graba el audio.
  - **Paso 2:** `SpeakerPanel` — asigna roles a los hablantes detectados (Doctor, Paciente, Otro) y elige plantilla clínica (Nota de Sesión, Consulta Médica, Historia Clínica, Seguimiento, Solo Limpiar). El LLM local genera la nota y la inyecta en el editor.
- ✅ **Gestión de Documentos (Sprint 3):**
  - `FolderView`: modal que lista todos los documentos de una carpeta con tipo, fecha y botón eliminar.
  - `Sidebar`: carpetas clickeables — click abre `FolderView`. Búsqueda en tiempo real. Carpeta activa visualmente resaltada.
  - `DashboardPage`: al abrir un documento desde `FolderView` se carga en el editor. El guardado incluye la carpeta activa como `folder_id`. Feedback visual "¡Guardado!" sin `alert()`.
  - `db_delete_document` en Rust + frontend para eliminar registros desde el explorador.

## [TAREAS PENDIENTES INMEDIATAS (NEXT STEPS)]
- ⏳ **Sprint 3 - Módulo Científico (Paper APA-7):** El sidebar de investigación ya existe. Falta conectar el modo "Paper Completo" con el protocolo 50-to-10 real, verificación DOI, y formateo APA-7 estructurado.
- ⏳ **Sprint 4 - Exportación:** Implementar "Exportar PDF" y "Exportar Word (.docx)" desde el editor.
- ⏳ **Sprint 5 - Sistema de Licenciamiento Online:** Verificación de license key contra servidor externo + flujo de 30 días trial.

## [NOTAS TÉCNICAS ACTUALIZADAS]
- **Stack Confirmado:** Next.js 16 (Static Export), Tauri 2, Rust, SQLite.
- **Ecosistema de Inferencia:** Llama 3.1 8B (Principal unificado) y Phi-3.5-mini (Fallback <8GB RAM).
- **Workflow:** SDD (Spec-Driven Development) activado.
- **Estado Global de Modelos:** `useModels()` hook.
- **Estado Global de UI:** `useUI()` hook — incluye `activeFolder`, `activeDocument`, `openDocument()`.
- **Acciones IA en Editor:** `processEditorAction(text, 'explain' | 'summarize' | 'continue')`.
- **Flujo de Transcripción:** AudioUploader → SpeakerPanel → Editor (inyección vía `injectTranscriptionContent`).
- **Gestión Documental:** Sidebar → FolderView → `openDocument()` → DashboardPage carga en editor.
