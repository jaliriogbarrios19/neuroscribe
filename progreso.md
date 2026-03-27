# MEMORIA DE PROGRESO: NEUROSCRIBE

## [ESTADO ACTUAL]
- **Fase Actual:** `Sprint 2` (Transcripción offline + Acciones de Editor IA).
- La fase de `setup-inicial` y el `Sprint 1 (UI & Infra)` han concluido exitosamente.
- **Sprint 2:** En Progreso.
- Los Sprints subsiguientes aún no han comenzado.

## [LOGROS FINALIZADOS]
- ✅ **Setup Inicial Completo:** Transición a Local-First (Tauri + SQLite), eliminación de Supabase, UI de Licencias, e integración de conectores de Modelos Locales verificados.
- ✅ **Fundación Frontend:** Next.js 16 (App Router) y Tiptap básico integrado.
- ✅ **Decisión Arquitectónica:** Transición oficial acordada a **Local-First (Tauri + SQLite)**.
- ✅ **Refactor de Layout:** Movidos elementos globales al Route Group `(dashboard)` y `DashboardShell`.
- ✅ **Sanear Páginas:** Eliminadas rutas de `auth` (`auth-code-error`) y rastros de Supabase.
- ✅ **Gestor de Modelos (Sprint 1):** Creada la UI en `/settings/models` con sistema de descarga Multisource (Mirror propio -> HF Fallback) y comandos Rust para health-checks y borrado.
- ✅ **Auto-Detección:** Implementado banner global interactivo en el inicio que detecta la ausencia de modelos.
- ✅ **Coding Standards (Fase 1):** Configuración de Prettier, ESLint, Husky, commitlint y CODING_STANDARDS.md como fuente de verdad para todas las IAs.
- ✅ **Sincronización de Estados Globales (Sprint 2):** Creado `ModelProvider` (React Context en `src/hooks/useModels.tsx`) para centralizar estado de descarga. `IAStatus` y `ModelsManagerPage` ahora comparten el mismo estado reactivo — una descarga iniciada en cualquier pantalla se refleja en ambos componentes simultáneamente.
- ✅ **Acciones Inline del Editor (Sprint 2):** Implementado `EditorBubbleMenu` con TipTap `BubbleMenu`. Al seleccionar texto en el editor aparece un menú flotante con 3 acciones IA: **Explicar**, **Resumir** y **Continuar** — todas offline vía `process_text_local` en Rust.

## [TAREAS PENDIENTES INMEDIATAS (NEXT STEPS)]
- ⏳ **Sprint 2 - Flujo de Transcripción Completo:** Conectar la transcripción con el panel de asignación de hablantes (Speaker 1 → Doctor, Speaker 2 → Paciente) y selección de plantilla clínica antes de pasar al LLM.
- ⏳ **Sprint 3 - Módulo Científico:** Integrar flujo completo de Protocolo 50-to-10 con verificación DOI. El sidebar de investigación (`ResearchSidebar`) ya existe pero el generador de paper APA-7 completo falta.
- ⏳ **Sprint 3 - Gestión de Documentos:** Conectar la Sidebar de carpetas (ya implementada en Rust y frontend) con el editor para abrir/editar documentos guardados en SQLite.

## [NOTAS TÉCNICAS ACTUALIZADAS]
- **Stack Confirmado:** Next.js 16 (Static Export), Tauri 2, Rust, SQLite.
- **Ecosistema de Inferencia:** Llama 3.1 8B (Principal unificado) y Phi-3.5-mini (Fallback <8GB RAM).
- **Workflow:** SDD (Spec-Driven Development) activado para evitar desincronizaciones entre código y memoria.
- **Estado Global de Modelos:** `useModels()` hook disponible en cualquier componente del dashboard.
- **Acciones IA en Editor:** `processEditorAction(text, 'explain' | 'summarize' | 'continue')` disponible en `src/app/actions/ia.ts`.
