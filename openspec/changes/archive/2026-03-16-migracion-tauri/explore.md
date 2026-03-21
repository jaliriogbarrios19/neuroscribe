## Exploration: migracion-tauri

### Current State
El proyecto es una aplicación Next.js 16 (App Router) diseñada para funcionar con Supabase (SaaS). Se utiliza Tailwind CSS 4 y TipTap para el editor. Actualmente, no hay soporte nativo para escritorio ni integración con Rust/Tauri. El flujo de autenticación y persistencia depende de Supabase SSR.

### Affected Areas
- `package.json` — Se deben añadir dependencias de Tauri (`@tauri-apps/api`, `@tauri-apps/cli`).
- `next.config.ts` — Se requiere `output: 'export'` y desactivar `images.unoptimized` para compatibilidad con Tauri.
- `src-tauri/` — Nueva carpeta para el backend de Rust, configuración de Tauri e iconos.
- `src/lib/supabase/*` — Los clientes de Supabase deberán ser reemplazados o complementados por SQLite local en Rust/Tauri.
- `src/app/actions/*` — Las Server Actions no funcionarán en exportación estática; deberán migrarse a comandos de Tauri (`invoke`) o lógica del lado del cliente.

### Approaches
1. **Inicialización in-situ con Tauri CLI** — Ejecutar `npx tauri init` en la raíz del proyecto actual. Configurar Next.js para `output: 'export'`.
   - Pros: Mantiene el historial de Git y la estructura actual. Es el camino estándar para migrar Next.js a Tauri.
   - Cons: Requiere una limpieza profunda de lógica de servidor (Next.js SSR/Actions) que no es compatible con el modo estático.
   - Effort: Medium

2. **Nuevo Proyecto Tauri + Migración de Componentes** — Crear un nuevo proyecto Tauri desde cero (`cargo tauri init` o similar) y mover gradualmente los componentes de UI de `src/`.
   - Pros: Permite una arquitectura limpia desde el inicio, separando claramente lo que es compatible con escritorio.
   - Cons: Duplicación de trabajo inicial y riesgo de perder configuraciones de Tailwind/Next.js ya establecidas.
   - Effort: High

### Recommendation
Se recomienda el **Enfoque 1 (Inicialización in-situ)**. Next.js 15/16 ya tiene un soporte excelente para exportación estática, y Tauri está diseñado para envolver proyectos existentes. La mayor parte del esfuerzo se centrará en mover la lógica de Server Actions a comandos de Rust invocados desde el frontend.

### Risks
- **Incompatibilidad de Server Actions:** Todo lo que use `use server` dejará de funcionar al cambiar a `output: 'export'`.
- **Dependencias de Node.js:** Librerías que dependan de APIs nativas de Node.js (como `fs` o `path`) en el lado del cliente fallarán; deberán ser sustituidas por APIs de Tauri en Rust.
- **Supabase SSR:** La autenticación por cookies de Supabase SSR no es ideal para apps de escritorio locales; se debe considerar migrar a almacenamiento local o una estrategia de tokens manejada por Rust.

### Ready for Proposal
Yes — El camino técnico está claro: inicializar Tauri, configurar exportación estática en Next.js y comenzar el desacoplamiento de la lógica de servidor.
