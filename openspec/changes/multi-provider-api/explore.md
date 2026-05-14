## Exploration: multi-provider-api

### Current State

**Transcripción**: NeuroScribe solo tiene transcripción offline vía whisper.cpp (`transcribe_audio_local` en `lib.rs`). No existe ninguna integración con APIs de transcripción cloud. El resultado es texto plano, sin diarización ni segmentos por hablante.

**API Keys**: No existe ninguna tabla ni comando para almacenar API keys. El módulo de investigación usa valores hardcodeados:
- PubMed: sin API key (usa `eutils.ncbi.nlm.nih.gov` sin autenticación)
- OpenAlex: email hardcodeado `hola@neuroscribe.app`
- Crossref: email hardcodeado `hola@neuroscribe.app`

**UI de Transcripción**: `AudioUploader.tsx` tiene 3 modos (Subir, Grabar, Reunión) pero todos terminan llamando a `transcribeAudioLocal`. No hay selector de provider. El resultado se inyecta como HTML en el editor TipTap, sin distinción de hablantes.

**Estructura de la App**: Next.js 16 App Router con route groups. La navegación usa `DashboardShell` + `Sidebar`. Ya existe `/settings/models` y `/settings/license`.

### APIs a Integrar

| Provider | Endpoint | Auth | Diarización | Formato Respuesta |
|----------|----------|------|-------------|-------------------|
| **Gladia** | `POST https://api.gladia.io/v2/transcription` | `x-gladia-key` header | Nativa (`diarization: true`) | JSON con `utterances` (speaker, start, end, text) |
| **DeepGram** | `POST https://api.deepgram.com/v1/listen` | `Authorization: Token` header | Nativa (`diarize: true`) | JSON con `alternatives[0].words` + speaker |
| **AssemblyAI** | `POST https://api.assemblyai.com/v2/transcript` | `Authorization` header | Nativa (`speaker_labels: true`) | JSON con `utterances` (speaker, start, end, text). Requiere polling. |

### Affected Areas
- `src-tauri/src/lib.rs` — Agregar comandos: `save_api_key`, `get_api_keys`, `delete_api_key`, `transcribe_gladia`, `transcribe_deepgram`, `transcribe_assemblyai`, `transcribe_with_provider`, `update_speaker_label`.
- `src-tauri/Cargo.toml` — Agregar `aes-gcm`, `base64`, `rand`.
- `src/app/actions/ia.ts` — Agregar funciones `transcribeWithProvider`, `saveApiKey`, `getApiKeys`, `deleteApiKey`, `updateSpeakerLabel`.
- `src/app/actions/research.ts` — Modificar para usar API keys del usuario.
- `src/components/transcription/AudioUploader.tsx` — Agregar provider selector y mostrar segmentos con hablantes.
- `src/components/transcription/SpeakerView.tsx` — Nuevo componente para renombrar hablantes.
- `src/app/(dashboard)/settings/api-keys/` — Nueva página de configuración.
- `src/types/transcription.ts` — Nuevos tipos TypeScript.
- SQLite — Nueva tabla `api_keys`, migración.

### Approaches

#### 1. Provider Adapter Pattern (Recomendado)
Crear una capa de abstracción en Rust donde cada provider implementa un trait común `TranscriptionProvider`. El comando `transcribe_with_provider` recibe el nombre del provider y despacha al adapter correspondiente.

- Pros: Extensible, cada provider aislado, fácil testear.
- Cons: Más código inicial.

#### 2. Comando por Provider
Un comando Tauri separado por cada provider (`transcribe_gladia`, `transcribe_deepgram`, `transcribe_assemblyai`). El frontend decide a cuál llamar.

- Pros: Simple, cada comando independiente.
- Cons: Lógica duplicada en el frontend, difícil agregar providers nuevos.

### Recommendation
**Approach 2 (Comando por Provider)** para empezar rápido, con un comando unificado `transcribe_with_provider` como fachada. Si crece, refactorizamos al Adapter Pattern.

### Encryption Strategy
- Derivar una clave de cifrado a partir del `hardware_id` + un salt fijo usando PBKDF2.
- Cifrar cada API key con AES-256-GCM antes de guardar en SQLite.
- La clave de cifrado nunca se persiste; se deriva on-the-fly.

### Risks
- **AssemblyAI**: Es el único provider que requiere polling (submit → wait → fetch). Necesitamos un loop de polling con timeout.
- **DeepGram**: Soporta streaming WebSocket, pero para MVP usamos HTTP POST con archivo completo.
- **Cifrado**: Si el usuario cambia de hardware, las claves no se podrán descifrar. Mostrar advertencia.

### Ready for Proposal
Yes — La arquitectura base de Tauri + SQLite está lista. Solo falta implementar los clientes HTTP, el cifrado, y la UI.
