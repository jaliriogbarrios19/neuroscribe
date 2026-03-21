# Design: ia-local-setup

## Technical Approach

La estrategia consiste en transformar el backend de Rust en un orquestador de recursos locales. Utilizaremos el crate `sysinfo` para perfilar el hardware del usuario al inicio de la aplicación. Basándonos en la RAM disponible, el sistema seleccionará y descargará (si es necesario) los modelos GGUF optimizados. La ejecución de la IA se realizará mediante el patrón **Sidecar** de Tauri, invocando binarios pre-compilados de `whisper.cpp` y `llama.cpp`. Esto garantiza que NeuroScribe aproveche al máximo las optimizaciones nativas de CPU/GPU sin las complicaciones de compilación cruzada de librerías C++ complejas dentro de Rust.

## Architecture Decisions

### Decision: Detección de Hardware con `sysinfo`
**Choice**: Usar `sysinfo` para leer RAM y CPU.
**Rationale**: Es el estándar en Rust para introspección del sistema. Permite tomar decisiones inteligentes sobre qué modelo descargar para asegurar que la app no colapse el sistema del usuario.

### Decision: Patrón Sidecar para Motores de IA
**Choice**: Empaquetar `whisper.cpp` y `llama.cpp` como sidecars.
**Alternatives considered**: Bindings nativos (`whisper-rs`).
**Rationale**: Los sidecars permiten actualizar los motores de IA independientemente de la lógica de la app y facilitan la depuración al poder ejecutar los binarios por separado. Además, evitan conflictos de enlazado de C++ en diferentes versiones de Windows/Mac.

### Decision: Almacenamiento de Modelos en `AppData`
**Choice**: Guardar archivos `.bin` y `.gguf` en la carpeta de datos de la aplicación definida por el OS.
**Rationale**: Cumple con las guías de estilo de los sistemas operativos, asegura que los modelos persistan entre actualizaciones y no ensucia la carpeta de instalación.

## Data Flow

`Frontend ──→ invoke('get_hardware_info') ──→ Rust (sysinfo)`
`Frontend ──→ invoke('start_transcription') ──→ Rust (Command Sidecar) ──→ Whisper Sidecar ──→ Output File ──→ Rust ──→ Frontend`

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/Cargo.toml` | Modify | Añadir `sysinfo` y `reqwest` (con feature `stream`). |
| `src-tauri/src/lib.rs` | Modify | Implementar comandos `get_hardware_info`, `check_models` y `download_model`. |
| `src-tauri/tauri.conf.json` | Modify | Configurar la sección `bundle > externalBin` para incluir los sidecars. |
| `src/app/actions/ia.ts` | Create | Nueva capa de acciones frontend para interactuar con la orquestación local. |

## Interfaces / Contracts

### Hardware Info Contract
```typescript
interface HardwareInfo {
  total_ram_gb: number;
  available_ram_gb: number;
  cpu_cores: number;
  has_gpu: boolean;
  recommended_model: 'llama-3-8b' | 'phi-3.5-mini';
}
```

### Model Check Contract
```typescript
interface ModelStatus {
  whisper_ready: boolean;
  llm_ready: boolean;
  models_path: string;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Hardware Detection | Verificar que `sysinfo` reporta valores coherentes en el entorno de desarrollo. |
| Integration | Sidecar Execution | Invocar un comando de ayuda (`--help`) del sidecar desde Rust y capturar el stdout. |
| Integration | Model Download | Simular una descarga y verificar el hash SHA-256 del archivo resultante. |

## Migration / Rollout

Se introducirá una **Pantalla de Configuración Inicial** (Onboarding) que ejecutará la detección de hardware y guiará al usuario en la descarga de los modelos antes de permitir el acceso al dashboard.

## Open Questions

- [ ] ¿Cómo manejaremos la actualización de modelos existentes si sale una versión mejorada?
- [ ] ¿Es necesario implementar un límite de ancho de banda para las descargas de modelos?
