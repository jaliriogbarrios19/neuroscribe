# MEMORIA DE PROGRESO: NEUROSCRIBE

## [ESTADO ACTUAL]
- **Sprint 1 (UI & Infra):** 100% Completado.
- **Sprint 2 (Persistencia):** 100% Completado.
- **Sprint 3 (Transcripción Real):** 100% Completado.
- **Sprint 4 (Módulo Científico):** 0% (Pendiente).

## [LOGROS DE HOY (13/03/2026)]
- **Orquestación Híbrida Cripto-Ready:** Implementación de pipeline con Fal.ai (Whisper-v3) y OpenRouter (Llama 3.1 405b).
- **Grabación Multicanal:** Soporte nativo para subida de archivos, grabación de micrófono y captura de reuniones virtuales (Zoom/Meet/Teams) mediante `getDisplayMedia`.
- **Persistencia en Tiempo Real:** Sidebar dinámico conectado a Supabase para gestión de carpetas, pacientes y documentos.
- **Sistema de Saldo:** Visualización de balances de "Minutos" y "Cupones Ciencia (CC)" integrada en la UI.
- **Editor Profesional:** TipTap configurado para recibir y editar transcripciones orquestadas por IA.

## [TAREA PENDIENTE (MAÑANA)]
- **Inicio Sprint 4:** Implementar el Agente Investigador utilizando la API de Semantic Scholar / OpenAlex.
- **Constructor APA 7:** Desarrollar la lógica de generación de papers con citas automáticas y referencias en sangría francesa.

## [NOTAS TÉCNICAS]
- Se requiere configurar `FAL_AI_API_KEY` y `OPENROUTER_API_KEY` en el entorno local para producción.
- El bucket `audios` en Supabase Storage debe estar configurado como público/privado según la política de limpieza implementada.
