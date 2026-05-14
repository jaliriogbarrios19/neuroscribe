# MEMORIA DE PROGRESO: NEUROSCRIBE

## [ESTADO ACTUAL]
- **Fase Actual:** `Release v1.1.0` completada.
- **Último cambio:** multi-provider-api (transcripción multi-proveedor + LLM providers + diarización)

## [LOGROS FINALIZADOS]
- ✅ **Setup Inicial Completo:** Transición a Local-First (Tauri + SQLite), eliminación de Supabase, UI de Licencias.
- ✅ **Fundación Frontend:** Next.js 16 (App Router) y Tiptap básico integrado.
- ✅ **Gestor de Modelos:** UI en `/settings/models` con sistema de descarga Multisource.
- ✅ **Módulo Científico:** Búsqueda en PubMed/OpenAlex/Crossref, generación APA 7.
- ✅ **v1.1.0 - Multi-Provider API:**
  - Transcripción cloud con Gladia, DeepGram, AssemblyAI (diarización nativa)
  - LLM Providers: OpenAI, OpenRouter, DeepSeek, Anthropic, Gemini, X.AI, Z.ai
  - API Keys cifradas con AES-256-GCM
  - Página `/settings/api-keys` (transcripción + investigación)
  - Página `/settings/llm-providers` con panel dinámico "Incluir otro provider"
  - ProviderSelector con dropdown de motores de transcripción
  - SpeakerView con segmentos coloreados y renombrado inline de hablantes
  - ResearchSidebar con selector de LLM provider (cloud/offline)
  - Investigación usa API keys del usuario (PubMed, Semantic Scholar, Crossref)
  - Modo offline (whisper.cpp + llama.cpp) intacto como fallback

## [ARQUITECTURA ACTUAL]
- **Stack:** Next.js 16 (Static Export), Tauri 2, Rust, SQLite
- **IA Local:** llama.cpp (Llama 3.1 8B / Phi-3.5-mini) + whisper.cpp
- **IA Cloud:** Gladia, DeepGram, AssemblyAI (transcripción) + OpenAI-compatible, Anthropic, Gemini (LLM)
- **Tablas nuevas:** `api_keys` (claves cifradas), `speaker_labels` (renombrado de hablantes)
- **Workflow:** SDD (Spec-Driven Development)

## [PRÓXIMOS PASOS]
- Streaming de transcripción en tiempo real
- Soporte para más providers LLM
- Conversión automática de audio (FFmpeg)
- Tests automatizados
