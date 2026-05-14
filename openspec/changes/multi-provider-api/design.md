# Design: multi-provider-api

## Technical Approach

Se implementarán clientes HTTP en Rust para cada provider de transcripción (Gladia, DeepGram, AssemblyAI), clientes para LLM providers (OpenRouter, DeepSeek, OpenAI, Anthropic, Gemini, X.AI, Z.ai y otros), un sistema de cifrado de API keys en SQLite, páginas de configuración en el frontend con panel dinámico para agregar múltiples providers, y un componente de visualización de hablantes con renombrado inline.

La arquitectura sigue el patrón existente de NeuroScribe: comandos Tauri en Rust → acciones TypeScript → componentes React.

## Architecture Decisions

### Decision: API Keys gestionadas por el usuario
**Choice**: Las API keys las ingresa el usuario en `/settings/api-keys`, se cifran con AES-256-GCM y se persisten en SQLite.
**Rationale**: El usuario mantiene control total sobre sus propias claves y costos. NeuroScribe no actúa como proxy ni almacena claves de la empresa.

### Decision: Cifrado de API Keys
**Choice**: Derivar clave de cifrado con PBKDF2 (`hardware_id` + salt), cifrar cada key con AES-256-GCM, guardar (provider, iv, ciphertext) en tabla `api_keys`.
**Rationale**: Si alguien accede al archivo SQLite, las keys son ilegibles sin el hardware original.

### Decision: Formato de Transcripción Unificado
**Choice**: Todos los providers devuelven un `TranscriptionResult` común:
```rust
struct TranscriptionResult {
    full_text: String,
    segments: Vec<TranscriptionSegment>,
    speakers: Vec<SpeakerInfo>,
}
struct TranscriptionSegment {
    speaker_id: String,
    speaker_label: String,
    text: String,
    start_ms: i64,
    end_ms: i64,
    confidence: f64,
}
struct SpeakerInfo {
    id: String,
    label: String,
    color: String,
}
```
**Rationale**: El frontend recibe siempre la misma estructura sin importar el provider.

### Decision: AssemblyAI Polling
**Choice**: Submit → esperar `processing` → poll cada 2s hasta `completed` o `error`, con timeout de 5 minutos.
**Rationale**: AssemblyAI es el único provider asíncrono. El polling se maneja completamente en Rust.

### Decision: Provider Selector en UI
**Choice**: Dropdown en `AudioUploader` que lista los providers configurados (con API key guardada). Si no hay keys configuradas, solo aparece "Offline (Whisper)".
**Rationale**: Solo mostrar providers que el usuario puede usar efectivamente.

### Decision: Panel Dinámico para LLM Providers
**Choice**: Un panel en `/settings/llm-providers` donde el usuario selecciona un provider de un dropdown (OpenRouter, DeepSeek, OpenAI, Anthropic, Gemini, X.AI, Z.ai, etc.), ingresa su API key, y puede agregar filas adicionales con un botón "Incluir otro provider".
**Rationale**: El usuario puede configurar múltiples LLM providers simultáneamente y elegir cuál usar para investigación. El panel crece dinámicamente sin límite de providers.

### Decision: OpenAI-compatible como formato base
**Choice**: Para providers con API OpenAI-compatible (OpenRouter, DeepSeek, X.AI, Z.ai), usar un cliente genérico que solo cambia el endpoint URL. Anthropic y Gemini tienen clientes específicos.
**Rationale**: Reduce código duplicado. La mayoría de providers modernos usan el formato OpenAI.

## Data Flow

### Transcripción con Provider Cloud
```
Frontend (AudioUploader)
  → Selecciona provider del dropdown
  → Guarda audio en cache dir
  → invoke('transcribe_with_provider', { audioPath, provider })
  
Rust (lib.rs)
  → Lee API key de SQLite (descifrada)
  → match provider:
      "gladia"    → POST audio a Gladia API
      "deepgram"  → POST audio a DeepGram API  
      "assemblyai"→ POST audio, poll hasta completar
  → Normaliza respuesta a TranscriptionResult
  → Retorna al frontend

Frontend (SpeakerView)
  → Muestra segmentos coloreados por speaker
  → Usuario hace clic en label → inline edit
  → invoke('update_speaker_label', { speakerId, newLabel })
```

### Configuración de API Keys
```
Frontend (/settings/api-keys)
  → Formulario con campos para cada provider
  → invoke('save_api_key', { provider, key })
  
Rust (lib.rs)
  → Deriva encryption key de hardware_id + salt
  → Cifra API key con AES-256-GCM
  → Guarda (provider, iv, ciphertext) en SQLite
  → invoke('get_api_keys') → devuelve providers configurados (keys enmascaradas)
```

### Generación con LLM Provider (Investigación)
```
Frontend (ResearchSidebar / Editor)
  → Selecciona LLM provider del dropdown
  → invoke('llm_generate', { provider, prompt, model? })
  
Rust (lib.rs)
  → Lee API key de SQLite (descifrada)
  → match provider:
      "openai"       → POST a https://api.openai.com/v1/chat/completions
      "openrouter"   → POST a https://openrouter.ai/api/v1/chat/completions
      "deepseek"     → POST a https://api.deepseek.com/v1/chat/completions
      "xai"          → POST a https://api.x.ai/v1/chat/completions
      "zai"          → POST a https://api.z.ai/v1/chat/completions
      "anthropic"    → POST a https://api.anthropic.com/v1/messages
      "gemini"       → POST a https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
  → Retorna texto generado al frontend
```

### Panel Dinámico LLM Providers
```
Frontend (/settings/llm-providers)
  → Lista de providers configurados (provider + masked key + remove button)
  → Botón "Incluir otro provider"
  → Al hacer clic: aparece nueva fila con dropdown + input + save
  → invoke('save_api_key', { provider, key })
```

## Database Changes

### Nueva Tabla: `api_keys`
```sql
CREATE TABLE api_keys (
  provider TEXT PRIMARY KEY,    -- 'gladia', 'deepgram', 'assemblyai', 'pubmed', 'semantic_scholar', 'crossref'
                                -- LLM providers: 'openai', 'openrouter', 'deepseek', 'anthropic', 'gemini', 'xai', 'zai', etc.
  iv BLOB NOT NULL,             -- Initialization vector para AES-GCM
  ciphertext BLOB NOT NULL,     -- API key cifrada
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modify | Comandos: `save_api_key`, `get_api_keys`, `delete_api_key`, `transcribe_gladia`, `transcribe_deepgram`, `transcribe_assemblyai`, `transcribe_with_provider`, `update_speaker_label`, `llm_generate`. Structs: `TranscriptionResult`, `TranscriptionSegment`, `SpeakerInfo`. |
| `src-tauri/src/crypto.rs` | New | Funciones `derive_key`, `encrypt`, `decrypt` con AES-256-GCM. |
| `src-tauri/src/llm.rs` | New | Cliente genérico OpenAI-compatible + clientes específicos Anthropic, Gemini. |
| `src-tauri/Cargo.toml` | Modify | Dependencias: `aes-gcm`, `base64` (ya tiene `rand` implícito). |
| `src-tauri/migrations/` | New | `03_api_keys.sql` — creación de tabla `api_keys`. |
| `src/app/actions/ia.ts` | Modify | `transcribeWithProvider`, `saveApiKey`, `getApiKeys`, `deleteApiKey`, `updateSpeakerLabel`, `llmGenerate`. |
| `src/app/actions/research.ts` | Modify | Leer API keys del usuario para PubMed, Semantic Scholar y LLM provider. |
| `src/app/(dashboard)/settings/api-keys/page.tsx` | New | Página de configuración de API keys de transcripción e investigación. |
| `src/app/(dashboard)/settings/llm-providers/page.tsx` | New | Panel dinámico de LLM providers con dropdown, input y botón "Incluir otro provider". |
| `src/components/transcription/SpeakerView.tsx` | New | Visualización de segmentos con hablantes y renombrado inline. |
| `src/components/transcription/ProviderSelector.tsx` | New | Dropdown para elegir provider de transcripción. |
| `src/components/transcription/AudioUploader.tsx` | Modify | Integrar `ProviderSelector` y `SpeakerView`. |
| `src/types/transcription.ts` | New | Tipos: `TranscriptionResult`, `TranscriptionSegment`, `SpeakerInfo`, `ApiProvider`. |
| `src/types/apiKeys.ts` | New | Tipos: `ApiKeyEntry`, `ProviderType`, `LlmProvider`. |

## Provider API Contracts

### Gladia
```
POST https://api.gladia.io/v2/transcription
Headers: x-gladia-key: <api_key>
Body: multipart/form-data { audio: <file>, diarization: true }
Response: { result: { transcription: { utterances: [{ speaker, start, end, text }] } } }
```

### DeepGram
```
POST https://api.deepgram.com/v1/listen?diarize=true
Headers: Authorization: Token <api_key>
Body: audio binary (WAV/MP3)
Response: { results: { channels: [{ alternatives: [{ words: [{ word, start, end, speaker }] }] }] } }
```

### AssemblyAI
```
POST https://api.assemblyai.com/v2/transcript
Headers: Authorization: <api_key>
Body: { audio_url: <url>, speaker_labels: true }
Response: { id: <transcript_id>, status: "processing" }
→ Poll GET https://api.assemblyai.com/v2/transcript/<id>
Response: { status: "completed", utterances: [{ speaker, start, end, text }] }
```
Nota: AssemblyAI requiere URL pública o upload previo. Usaremos el endpoint de upload:
```
POST https://api.assemblyai.com/v2/upload (binary audio)
→ { upload_url: "..." }
→ POST transcript con upload_url
```

### LLM Providers (OpenAI-compatible)
Estos providers comparten el mismo formato de API que OpenAI:
```
POST {base_url}/v1/chat/completions
Headers: Authorization: Bearer <api_key>
Body: { model: "<model>", messages: [{ role: "user", content: "<prompt>" }] }
Response: { choices: [{ message: { content: "<response>" } }] }
```

| Provider | Base URL | Default Model |
|----------|----------|---------------|
| OpenAI | `https://api.openai.com` | `gpt-4o` |
| OpenRouter | `https://openrouter.ai/api` | `openai/gpt-4o` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| X.AI (Grok) | `https://api.x.ai` | `grok-2` |
| Z.ai | `https://api.z.ai` | `glm-4` |

### Anthropic
```
POST https://api.anthropic.com/v1/messages
Headers: x-api-key: <api_key>, anthropic-version: 2023-06-01
Body: { model: "claude-sonnet-4-20250514", max_tokens: 4096, messages: [{ role: "user", content: "<prompt>" }] }
Response: { content: [{ text: "<response>" }] }
```

### Google Gemini
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=<api_key>
Headers: Content-Type: application/json
Body: { contents: [{ parts: [{ text: "<prompt>" }] }] }
Response: { candidates: [{ content: { parts: [{ text: "<response>" }] } }] }
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (Rust) | Cifrado/descifrado de API keys | Test con clave de ejemplo, verificar roundtrip. |
| Unit (Rust) | Normalización de respuestas de cada provider | Mock HTTP, verificar `TranscriptionResult` generado. |
| Integration | Flujo completo Gladia | Audio de prueba → transcripción con key real → segmentos con hablantes. |
| Integration | Flujo completo AssemblyAI | Subir audio → poll → verificar utterances. |
| E2E | UI de API Keys | Guardar key → verificar que aparece enmascarada → usar en transcripción. |
| E2E | Renombrar hablante | Transcripción → clic en label → renombrar → verificar persistencia. |

## Migration / Rollout

1. Migración SQLite: crear tabla `api_keys` (no destructiva).
2. El modo offline (whisper.cpp) no se modifica — es el fallback por defecto.
3. Las APIs de investigación usan keys del usuario si existen; si no, usan modo sin autenticación (rate limit bajo) como fallback.
