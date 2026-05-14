# Proposal: multi-provider-api

## Intent

Dotar a NeuroScribe de un sistema de transcripción multi-proveedor (Gladia, DeepGram, AssemblyAI) con diarización de hablantes, y una página de configuración donde el usuario ingresa sus propias API keys para servicios de transcripción e investigación. Las claves son provistas por el usuario, nunca hardcodeadas en el backend.

## Scope

### In Scope
- **Página de Configuración de APIs** (`/settings/api-keys`): Formulario para que el usuario ingrese sus API keys de:
  - Transcripción: Gladia, DeepGram, AssemblyAI
  - Investigación: PubMed, Semantic Scholar, Crossref
- **Selector de Provider de Transcripción**: Dropdown en el flujo de transcripción para elegir qué API usar (offline Whisper, Gladia, DeepGram, AssemblyAI).
- **Clientes de API en Rust**: Implementar comandos Tauri que llamen a cada API de transcripción usando la clave almacenada por el usuario.
- **Diarización**: Parsear la respuesta de cada API para extraer segmentos con speaker label, start, end, confidence.
- **Almacenamiento Seguro de API Keys**: Guardar las claves cifradas en SQLite (nueva tabla `api_keys`).
- **UI de Hablantes**: Mostrar segmentos coloreados por hablante en el resultado de transcripción, con capacidad de renombrar hablantes inline.
- **Desacoplamiento de APIs de Investigación**: Reemplazar los valores hardcodeados (`hola@neuroscribe.app`, sin API key) por las claves que el usuario configure.

### Out of Scope
- Streaming en tiempo real de transcripción (primero batch, luego streaming).
- Comparación simultánea de múltiples providers (una a la vez).
- Traducción de transcripciones.
- Soporte para otros providers de IA (OpenAI, Google Cloud, Azure) — extensible a futuro.

## Approach

1. **Backend (Rust)**: Nuevos comandos Tauri para gestionar API keys (CRUD cifrado), clientes HTTP para cada provider, y un comando unificado `transcribe_with_provider` que despacha al provider seleccionado.
2. **Base de Datos**: Nueva tabla `api_keys` con cifrado AES-256 para las claves.
3. **Frontend (Next.js)**: Nueva ruta `/settings/api-keys`, componentes de formulario, provider selector en `AudioUploader`, y componente `SpeakerView` para visualizar y renombrar hablantes.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src-tauri/src/lib.rs` | Modified | Nuevos comandos: `save_api_key`, `get_api_keys`, `delete_api_key`, `transcribe_gladia`, `transcribe_deepgram`, `transcribe_assemblyai`, `transcribe_with_provider`. |
| `src-tauri/Cargo.toml` | Modified | Agregar `aes-gcm`, `base64` para cifrado de API keys. |
| SQLite Schema | Modified | Nueva tabla `api_keys`, migración. |
| `src/app/actions/ia.ts` | Modified | Funciones para `transcribeWithProvider`, `saveApiKey`, `getApiKeys`. |
| `src/app/actions/research.ts` | Modified | Usar API keys del usuario en lugar de hardcodeadas. |
| `src/components/transcription/AudioUploader.tsx` | Modified | Agregar provider selector, mostrar segmentos con hablantes. |
| `src/app/(dashboard)/settings/` | New | Nueva página `/settings/api-keys`. |
| `src/components/transcription/SpeakerView.tsx` | New | Componente para visualizar y renombrar hablantes. |
| `src/types/` | Modified | Nuevos tipos: `TranscriptionSegment`, `Speaker`, `ApiProvider`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| API keys en texto plano en SQLite | High | Cifrar con AES-256-GCM usando una clave derivada del hardware ID. |
| Distintos formatos de respuesta entre providers | High | Capa de normalización en Rust que unifica la respuesta a un tipo común `TranscriptionResult`. |
| Rate limits de APIs gratuitas | Medium | Mostrar mensaje claro al usuario, implementar retry con backoff. |
| AssemblyAI requiere polling (async) | Medium | Implementar polling con timeout y reporte de progreso. |
| Complejidad de UI con múltiples providers | Low | Empezar con un selector simple, diseño progresivo. |

## Rollback Plan

El modo offline (whisper.cpp) permanece como fallback. Si algún provider falla, se puede revertir al modo local sin perder funcionalidad.

## Dependencies

- **reqwest**: Ya está en `Cargo.toml` para llamadas HTTP.
- **aes-gcm + base64**: Nuevas dependencias para cifrado.
- **Tauri Plugin SQL**: Ya integrado para persistencia.

## Success Criteria

- [ ] El usuario puede ingresar y guardar API keys para Gladia, DeepGram, AssemblyAI, PubMed y Semantic Scholar desde `/settings/api-keys`.
- [ ] El usuario puede seleccionar un provider de transcripción en el flujo de subida/grabación.
- [ ] La transcripción con cada provider devuelve segmentos con speaker label, start, end y texto.
- [ ] Los hablantes se muestran con colores distintivos en la UI de resultado.
- [ ] El usuario puede hacer clic en un speaker label y renombrarlo (ej. "Speaker 1" → "Dr. García").
- [ ] Las API keys de investigación se usan en las llamadas a PubMed, Semantic Scholar y Crossref.
- [ ] El modo offline (whisper.cpp) sigue funcionando como provider alternativo.
