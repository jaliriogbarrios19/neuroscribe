# Tauri Specification (v2)

## Purpose
Este dominio define los requisitos para la inicialización, seguridad y empaquetado del entorno de escritorio de NeuroScribe utilizando Tauri 2 y Rust.

## Requirements

### Requirement: Professional Production Packaging
El sistema DEBE configurarse para una distribución comercial profesional.
- MUST use `app.neuroscribe.desktop` as the bundle identifier.
- MUST use "NeuroScribe" as the product name.
- MUST be versioned consistently (v1.0.0 for initial release).

### Requirement: Comprehensive Capability Manifest
El sistema DEBE seguir el principio de mínimo privilegio pero permitir explícitamente todos los comandos de Rust necesarios.
- MUST allow all database (`db_*`), IA (`transcribe_*`, `process_*`), Research (`get_academic_*`, `verify_doi_*`) and Licensing (`activate_license`) commands in production builds.

##### Scenario: Production capability check
- GIVEN a production binary.
- WHEN a user invokes an IA command.
- THEN the system MUST permit execution according to the `capabilities/default.json` manifest.

### Requirement: Static Asset Integration
El sistema DEBE integrar el frontend como un export estático completo.
- MUST use `frontendDist: "../out"` in `tauri.conf.json`.
- MUST ensure all Next.js assets are bundled within the native installer.

### Requirement: Optimized Window Experience
El sistema DEBE proporcionar una experiencia de escritorio fluida.
- MUST center the window on first launch.
- MUST enforce minimum dimensions (1024x768) for medical/academic workspace usability.
