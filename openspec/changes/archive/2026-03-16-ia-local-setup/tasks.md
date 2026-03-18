# Tasks: ia-local-setup

## Phase 1: Infrastructure (Rust Dependencies)

- [x] 1.1 Añadir `sysinfo` y `reqwest` (features `stream`, `rustls-tls`) al `src-tauri/Cargo.toml`.
- [x] 1.2 Configurar `tauri.conf.json` para permitir el acceso a `appData` y definir los permisos necesarios para sidecars.
- [x] 1.3 Crear la estructura de carpetas para modelos dentro de `src-tauri/`.

## Phase 2: Core Implementation (Rust Backend)

- [x] 2.1 Implementar comando `get_hardware_info` usando `sysinfo` (RAM total, núcleos CPU).
- [x] 2.2 Implementar lógica de recomendación de modelo basada en la RAM detectada.
- [x] 2.3 Implementar comando `check_models` para verificar la existencia de archivos.
- [x] 2.4 Implementar esqueleto de comando `download_model` usando `reqwest`.

## Phase 3: Integration (Frontend Onboarding)

- [x] 3.1 Crear `src/app/actions/ia.ts` con funciones `getHardwareInfo()` y `checkModelStatus()` que invoquen al backend.
- [x] 3.2 Crear un componente simple de Onboarding/Estado de IA para mostrar la capacidad del sistema y los modelos detectados.
- [x] 3.3 Integrar el chequeo de hardware al inicio de la aplicación en el layout principal.

## Phase 4: Verification & Sidecar Config

- [x] 4.1 Añadir placeholders para los binarios sidecar en `src-tauri/bin/` para validar la configuración de `tauri.conf.json`.
- [ ] 4.2 Probar que el comando `get_hardware_info` devuelve datos correctos en el frontend (Manual).
- [ ] 4.3 Validar que el evento de progreso de descarga se recibe correctamente en la UI (Manual).
