# Tasks: multi-provider-api

## Phase 1: Backend Infrastructure (Rust)

- [ ] 1.1 Agregar dependencias `aes-gcm`, `base64`, `rand` a `Cargo.toml`.
- [ ] 1.2 Crear `src-tauri/src/crypto.rs` con funciones `derive_key()`, `encrypt()`, `decrypt()` usando AES-256-GCM + PBKDF2.
- [ ] 1.3 Crear migracion `03_api_keys.sql` para la tabla `api_keys`.
- [ ] 1.4 Implementar comando `save_api_key(provider, key)` en `lib.rs`: cifra y guarda en SQLite.
- [ ] 1.5 Implementar comando `get_api_keys()`: devuelve providers configurados con keys enmascaradas.
- [ ] 1.6 Implementar comando `delete_api_key(provider)`: elimina de SQLite.

## Phase 2: Transcription API Clients (Rust)

- [ ] 2.1 Definir structs unificados: `TranscriptionResult`, `TranscriptionSegment`, `SpeakerInfo` en `lib.rs`.
- [ ] 2.2 Implementar `transcribe_gladia(audio_path)`: llama a Gladia API, parsea utterances a `TranscriptionResult`.
- [ ] 2.3 Implementar `transcribe_deepgram(audio_path)`: llama a DeepGram API, parsea words/speakers a `TranscriptionResult`.
- [ ] 2.4 Implementar `transcribe_assemblyai(audio_path)`: upload + submit + poll, parsea utterances a `TranscriptionResult`.
- [ ] 2.5 Implementar comando fachada `transcribe_with_provider(audio_path, provider)` que despacha al cliente correcto.
- [ ] 2.6 Implementar comando `update_speaker_label(speaker_id, new_label)`.

## Phase 3: LLM Provider Clients (Rust)

- [ ] 3.1 Crear `src-tauri/src/llm.rs` con cliente generico OpenAI-compatible.
- [ ] 3.2 Implementar cliente Anthropic en `llm.rs` (formato diferente).
- [ ] 3.3 Implementar cliente Google Gemini en `llm.rs` (formato diferente).
- [ ] 3.4 Implementar comando `llm_generate(provider, prompt, model?)`: despacha al cliente correcto.

## Phase 4: Frontend Types & Actions

- [ ] 4.1 Crear `src/types/transcription.ts` con interfaces `TranscriptionResult`, `TranscriptionSegment`, `SpeakerInfo`.
- [ ] 4.2 Crear `src/types/apiKeys.ts` con interfaces `ApiKeyEntry`, `ProviderType`, `LlmProvider`.
- [ ] 4.3 Agregar a `src/app/actions/ia.ts`: `transcribeWithProvider`, `updateSpeakerLabel`, `saveApiKey`, `getApiKeys`, `deleteApiKey`, `llmGenerate`.
- [ ] 4.4 Modificar `src/app/actions/research.ts`: usar API keys del usuario para PubMed, Semantic Scholar, Crossref, y LLM provider.

## Phase 5: Settings Pages

- [ ] 5.1 Crear `src/app/(dashboard)/settings/api-keys/page.tsx` para transcripcion + investigacion.
- [ ] 5.2 Campos para Gladia, DeepGram, AssemblyAI, PubMed, Semantic Scholar, Crossref.
- [ ] 5.3 Crear `src/app/(dashboard)/settings/llm-providers/page.tsx` con panel dinamico.
- [ ] 5.4 Dropdown de providers (OpenRouter, DeepSeek, OpenAI, Anthropic, Gemini, X.AI, Z.ai).
- [ ] 5.5 Boton "Incluir otro provider" que agrega filas dinamicamente.
- [ ] 5.6 Cada fila: dropdown provider + input key + boton Save + boton Remove.
- [ ] 5.7 Agregar entradas en Sidebar: "API Keys" y "LLM Providers".

## Phase 6: Transcription UI

- [ ] 6.1 Crear `ProviderSelector.tsx`: dropdown que lista providers configurados.
- [ ] 6.2 Crear `SpeakerView.tsx`: segmentos agrupados por hablante, colores, timestamps, renombrado inline.
- [ ] 6.3 Modificar `AudioUploader.tsx`: integrar ProviderSelector y SpeakerView.

## Phase 7: Research Module Integration

- [ ] 7.1 Modificar `ResearchSidebar.tsx`: agregar selector de LLM provider.
- [ ] 7.2 Conectar generacion de respuestas con `llmGenerate` (cloud) o `generateSummaryLocal` (offline).
- [ ] 7.3 Asegurar fallback: si no hay LLM provider configurado, usar LLM local.

## Phase 8: Auditoria Integral

- [ ] 8.1 Revisar `src-tauri/src/lib.rs` por duplicacion, errores, seguridad.
- [ ] 8.2 Revisar `src-tauri/Cargo.toml` por dependencias innecesarias.
- [ ] 8.3 Revisar tipos TypeScript vs structs Rust (consistencia de contratos).
- [ ] 8.4 Revisar migraciones SQL: que no rompan datos existentes.
- [ ] 8.5 Revisar manejo de errores: todos los comandos deben retornar Result.
- [ ] 8.6 Revisar seguridad: API keys nunca en logs, cifrado verificado.
- [ ] 8.7 Verificar que el modo offline (whisper.cpp + llama.cpp) no tiene regresion.
- [ ] 8.8 Revisar imports no usados y codigo muerto.
- [ ] 8.9 Correr `cargo check` y `npm run lint`.
- [ ] 8.10 Correr `cargo build` para verificar compilacion.

## Phase 9: Release

- [ ] 9.1 Bump version en `tauri.conf.json`, `Cargo.toml`, `package.json` a 1.1.0.
- [ ] 9.2 Actualizar `progreso.md` con los cambios realizados.
- [ ] 9.3 Commit con mensaje convencional: `feat: multi-provider transcription + LLM providers + speaker diarization`.
- [ ] 9.4 Crear tag `v1.1.0`.
