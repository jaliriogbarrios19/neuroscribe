# Tauri Specification

## Purpose

Este dominio define los requisitos para la inicialización y el funcionamiento del entorno de escritorio de NeuroScribe utilizando Tauri 2 y Rust.

## Requirements

### Requirement: Tauri Runtime Initialization

El sistema DEBE ser capaz de inicializar una ventana nativa de escritorio que contenga la interfaz de usuario de Next.js.

#### Scenario: Running the desktop application
- GIVEN the Tauri environment is configured.
- WHEN the command `npm run tauri:dev` is executed.
- THEN it MUST open a native window.
- AND it MUST render the Next.js application at the configured URL.

### Requirement: Rust Command Bridge (Invoke)

El sistema DEBE permitir la comunicación bidireccional entre el frontend de JavaScript/TypeScript y el backend de Rust mediante el comando `invoke`.

#### Scenario: Calling a Rust command from JS
- GIVEN a command `greet` is defined in Rust.
- WHEN the frontend calls `invoke('greet', { name: 'Neuro' })`.
- THEN the system MUST execute the Rust logic.
- AND it MUST return the response correctly to the JavaScript side.

### Requirement: Script Compatibility

El proyecto DEBE incluir scripts estandarizados en `package.json` para facilitar el flujo de desarrollo y construcción con Tauri.

#### Scenario: Running the tauri development server
- GIVEN the `package.json` file.
- WHEN a developer runs `npm run tauri:dev`.
- THEN it MUST launch both the Next.js development server and the Tauri window simultaneously.
