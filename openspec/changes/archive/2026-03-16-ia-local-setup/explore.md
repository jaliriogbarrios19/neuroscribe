## Exploration: ia-local-setup

### Current State
Actualmente, la aplicación utiliza una arquitectura de exportación estática con un backend en Rust (Tauri). La persistencia es local (SQLite). Sin embargo, la lógica de transcripción e IA (antes en `src/app/api/transcribe/route.ts`) dependía de APIs externas como Fal.ai y OpenRouter. Esta lógica ha sido desactivada para la migración. No existe un mecanismo para detectar el hardware del usuario ni para ejecutar modelos GGUF/GGML localmente.

### Affected Areas
- `src-tauri/Cargo.toml` — Añadir dependencias: `sysinfo` (detección de hardware), `whisper-rs` (transcripción local) y `reqwest` (descarga de modelos).
- `src-tauri/src/lib.rs` — Implementar comandos para:
    - `get_hardware_info`: Retorna RAM y disponibilidad de GPU.
    - `download_model`: Gestiona la descarga de modelos Whisper/Llama si no existen.
    - `transcribe_local`: Invoca a whisper-rs para procesar audio.
- `src/components/transcription/AudioUploader.tsx` — Actualizar para llamar al comando local de Tauri en lugar de la API de Next.js.

### Approaches
1. **Sidecar (Binarios Pre-compilados)** — Empaquetar los ejecutables de `whisper.cpp` y `llama.cpp` como sidecars de Tauri.
   - Pros: Máximo rendimiento, utiliza las optimizaciones específicas de cada proyecto.
   - Cons: Aumenta significativamente el tamaño del instalador. Gestión compleja de procesos externos.
   - Effort: Medium

2. **Librerías Nativas (Rust Bindings)** — Usar `whisper-rs` y `llama-cpp-rs` (o similar) integrados directamente en el binario de Rust.
   - Pros: Mejor integración con el flujo de Tauri. Menor sobrecarga de procesos.
   - Cons: Compilación más lenta y potencialmente más compleja en Windows (requiere dependencias de C++).
   - Effort: High

### Recommendation
Se recomienda el **Enfoque 1 (Sidecar)** para una implementación inicial rápida y robusta. `whisper.cpp` y `llama.cpp` son extremadamente estables como binarios independientes. Tauri tiene soporte nativo para sidecars, lo que facilita invocar estos procesos con los argumentos correctos según el hardware detectado.

### Risks
- **Instalación de Dependencias:** En Windows, la aceleración por GPU (CUDA/Vulkan) puede requerir drivers específicos que el usuario podría no tener.
- **Espacio en Disco:** Los modelos (GGUF) pesan entre 2GB y 5GB. Debemos asegurar que el usuario tenga espacio suficiente y una conexión estable para la descarga inicial.

### Ready for Proposal
Yes — Tenemos claro qué herramientas usar (`sysinfo` para hardware y `sidecars` para IA) y cómo conectar el frontend.
