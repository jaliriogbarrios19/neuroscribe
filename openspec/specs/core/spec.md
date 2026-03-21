# Core Specification

## Requirements

### Requirement: Modular Directory Structure

The project MUST follow a modular and scalable folder structure, separating application logic (Next.js App Router) from UI components and system utilities.

#### Scenario: Navigating the project folders
- GIVEN the standard folder structure.
- WHEN a developer looks for the `cn` utility.
- THEN it MUST be found in `src/lib/utils/`.
- AND the application routes MUST be contained within `src/app/`.

### Requirement: Static Export Compatibility

El sistema DEBE ser compatible con la exportación estática de Next.js (`output: 'export'`) para permitir su ejecución dentro del contenedor de Tauri sin un servidor de Node.js en tiempo de ejecución.

#### Scenario: Running next build
- GIVEN the project configuration in `next.config.ts`.
- WHEN the command `next build` is executed.
- THEN it MUST generate a standalone `out/` directory containing all static assets.
- AND it MUST NOT require a Node.js server to serve the application.

### Requirement: Next.js 16 Standards (Static Context)

El sistema DEBE adherirse a los estándares de Next.js 16, pero priorizando el uso de componentes de cliente (`use client`) o componentes de servidor que puedan ser pre-renderizados estáticamente.

#### Scenario: Pre-rendering pages
- GIVEN a page in the App Router.
- WHEN the build process starts.
- THEN the system MUST pre-render the page to HTML/JSON during build time.
- AND it MUST NOT rely on dynamic server-side rendering (SSR) at runtime.
