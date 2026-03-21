# Proposal: ia-local-setup

## Intent

Establecer la infraestructura base para la ejecución de IA 100% offline en NeuroScribe. Esto implica implementar un sistema de detección de hardware (RAM/GPU) para seleccionar los modelos adecuados y preparar el backend de Rust para orquestar la transcripción local (Whisper) y el procesamiento de texto (Llama) mediante binarios pre-compilados (Sidecars).

## Scope

### In Scope
- **Detección de Hardware:** Implementar comando en Rust (`get_hardware_info`) usando `sysinfo` para leer RAM total y detectar GPU.
- **Gestor de Modelos:** Lógica para verificar la existencia de archivos GGUF/GGML en el disco local y comando para gestionar descargas iniciales.
- **Configuración de Sidecars:** Preparar `tauri.conf.json` para soportar binarios externos de `whisper.cpp` y `llama.cpp`.
- **Integración de Frontend:** Actualizar la UI para mostrar el estado del hardware y el progreso de descarga de modelos.

### Out of Scope
- **Implementación del Agente de Diarización:** El soporte multicanal avanzado se posterga para el siguiente sprint.
- **Optimización de Cuantización:** Solo se utilizarán modelos estándar (4-bit) en esta fase inicial.
- **Integración de RAG Local:** La base de datos de vectores local se implementará en el sprint del Módulo Científico Local.

## Approach

Se utilizará el **Enfoque de Sidecar** con binarios pre-compilados para Windows/Mac. El backend de Rust actuará como un orquestador que:
1. Detecta la capacidad de la PC al iniciar.
2. Descarga el modelo óptimo (`Llama-3-8B` para >15GB RAM, `Phi-3.5` para <=8GB RAM).
3. Invoca a `whisper.cpp` pasando la ruta del audio y el modelo descargado.
4. Captura la salida de texto y la envía al frontend.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src-tauri/Cargo.toml` | Modified | Adición de `sysinfo` y `reqwest`. |
| `src-tauri/src/lib.rs` | Modified | Nuevos comandos de orquestación de IA y detección de sistema. |
| `src-tauri/tauri.conf.json` | Modified | Definición de permisos y configuración de sidecars. |
| `src/components/transcription/AudioUploader.tsx` | Modified | Conexión con el nuevo flujo local de Tauri. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de Sidecars | Medium | Probar binarios estáticos que no dependan de librerías dinámicas del sistema. |
| Fallos en descarga de modelos | High | Implementar sistema de reintento y validación de hash (SHA-256) para los modelos descargados. |
| Consumo excesivo de recursos | Medium | Limitar el número de hilos (threads) utilizados por la IA según el número de núcleos de la CPU. |

## Rollback Plan

Mantener la lógica de "Mock" actual para que la interfaz siga funcionando mientras se depura el backend de Rust.

## Dependencies

- **sysinfo:** Crate para detección de hardware.
- **reqwest:** Para la descarga de modelos desde Hugging Face / CDN.
- **whisper.cpp / llama.cpp binarios:** Deben estar disponibles en la carpeta de sidecars.

## Success Criteria

- [ ] El comando `get_hardware_info` retorna la cantidad exacta de RAM disponible.
- [ ] La aplicación detecta si el modelo Whisper `ggml-large-v3-turbo.bin` está presente en el disco.
- [ ] Se inicia la descarga del modelo correcto según la RAM detectada (8GB vs 16GB).
- [ ] Un audio corto puede ser procesado localmente y el texto devuelto a la consola.
