# MEMORIA DE PROGRESO: NEUROSCRIBE

## [ESTADO ACTUAL]
- **Fase Actual:** `Sprint 1` (UI & Infra).
- La fase de `setup-inicial` ha concluido exitosamente.
- **Sprint 1 (UI & Infra):** En Progreso.
- Los Sprints subsiguientes aún no han comenzado.

## [LOGROS FINALIZADOS]
- ✅ **Setup Inicial Completo:** Transición a Local-First (Tauri + SQLite), eliminación de Supabase, UI de Licencias, e integración de conectores de Modelos Locales verificados.
- ✅ **Fundación Frontend:** Next.js 16 (App Router) y Tiptap básico integrado.
- ✅ **Decisión Arquitectónica:** Transición oficial acordada a **Local-First (Tauri + SQLite)**.
- ✅ **Refactor de Layout:** Movidos elementos globales al Route Group `(dashboard)` y `DashboardShell`.
- ✅ **Sanear Páginas:** Eliminadas rutas de `auth` (`auth-code-error`) y rastros de Supabase.
- ✅ **Gestor de Modelos (Sprint 1):** Creada la UI en `/settings/models` con sistema de descarga Multisource (Mirror propio -> HF Fallback) y comandos Rust para health-checks y borrado.
- ✅ **Auto-Detección:** Implementado banner global interactivo en el inicio que detecta la ausencia de modelos.

## [TAREAS PENDIENTES INMEDIATAS (NEXT STEPS)]
- ⏳ **Sincronización de Estados Globales:** Hacer que `IAStatus` sea consciente de las descargas en segundo plano del Gestor de Modelos.
- ⏳ **Acciones Inline del Editor:** Retomar la implementación de las opciones emergentes (explicar texto, resumir) usando la IA Local ya integrada.
## [NOTAS TÉCNICAS ACTUALIZADAS]
- **Stack Confirmado:** Next.js 16 (Static Export), Tauri 2, Rust, SQLite.
- **Ecosistema de Inferencia:** Llama 3.1 8B (Principal unificado) y Phi-3.5-mini (Fallback <8GB RAM).
- **Workflow:** SDD (Spec-Driven Development) activado para evitar desincronizaciones entre código y memoria.
