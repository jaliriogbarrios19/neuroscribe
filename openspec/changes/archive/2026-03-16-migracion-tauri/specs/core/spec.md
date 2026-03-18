# Delta for Core

## ADDED Requirements

### Requirement: Static Export Compatibility

El sistema DEBE ser compatible con la exportación estática de Next.js (`output: 'export'`) para permitir su ejecución dentro del contenedor de Tauri sin un servidor de Node.js en tiempo de ejecución.

#### Scenario: Running next build
- GIVEN the project configuration in `next.config.ts`.
- WHEN the command `next build` is executed.
- THEN it MUST generate a standalone `out/` directory containing all static assets.
- AND it MUST NOT require a Node.js server to serve the application.

## MODIFIED Requirements

### Requirement: Next.js 16 Standards (Static Context)

El sistema DEBE adherirse a los estándares de Next.js 16, pero priorizando el uso de componentes de cliente (`use client`) o componentes de servidor que puedan ser pre-renderizados estáticamente.
(Anteriormente: El sistema DEBE adherirse a los estándares de Next.js 16 App Router, incluyendo el uso de componentes de servidor por defecto).

#### Scenario: Pre-rendering pages
- GIVEN a page in the App Router.
- WHEN the build process starts.
- THEN the system MUST pre-render the page to HTML/JSON during build time.
- AND it MUST NOT rely on dynamic server-side rendering (SSR) at runtime.
