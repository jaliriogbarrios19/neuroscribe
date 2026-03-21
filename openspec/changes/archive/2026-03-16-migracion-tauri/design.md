# Design: migracion-tauri

## Technical Approach

La migración se basa en convertir el proyecto Next.js actual en un conjunto de activos estáticos (HTML/CSS/JS) que Tauri pueda servir localmente. Esto requiere configurar Next.js para el modo `output: 'export'` y crear un backend en Rust que actúe como el nuevo motor de la aplicación, reemplazando gradualmente las funciones que antes dependían de un servidor Node.js o Supabase SSR.

## Architecture Decisions

### Decision: Static Export Mode
**Choice**: `output: 'export'` en `next.config.ts`.
**Alternatives considered**: Usar un servidor local de Node.js empaquetado (Sidecar).
**Rationale**: El modo estático es más ligero, seguro y es el estándar recomendado para aplicaciones Tauri. Elimina la necesidad de gestionar procesos de Node.js en segundo plano en la máquina del usuario.

### Decision: Desactivación de Middleware
**Choice**: Eliminar o comentar `src/middleware.ts`.
**Alternatives considered**: Intentar emular el middleware en el cliente.
**Rationale**: Next.js Middleware requiere el runtime de Edge/Node.js, el cual no está disponible en exportaciones estáticas. La lógica de sesión deberá moverse a hooks de React o ser manejada por Rust en el futuro.

### Decision: Tauri v2
**Choice**: Usar la última versión estable de Tauri v2.
**Rationale**: Tauri 2 ofrece una mejor API para plugins y soporte multiplataforma (incluyendo móvil en el futuro), lo cual es coherente con la visión de NeuroScribe de 2026.

## Data Flow

Actualmente, el flujo es:
`Browser ──→ Next.js Server (SSR/Actions) ──→ Supabase`

Con esta migración, el flujo inicial será:
`Tauri WebView ──→ Static Files (out/)`
`Tauri WebView ──→ Tauri IPC (invoke) ──→ Rust Backend`

En este sprint, validaremos el flujo de IPC con un comando simple.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `next.config.ts` | Modify | Activar `output: 'export'` y `images.unoptimized: true`. |
| `package.json` | Modify | Añadir dependencias de Tauri y scripts de construcción. |
| `src-tauri/` | Create | Inicializar el proyecto Rust (Cargo.toml, main.rs, tauri.conf.json). |
| `src/middleware.ts` | Delete/Disable | Desactivar ya que no es compatible con exportación estática. |
| `src/app/layout.tsx` | Modify | Asegurar que no use funciones de servidor incompatibles. |

## Interfaces / Contracts

Se definirá un comando de prueba en Rust:

```rust
#[tauri::command]
fn greet(name: &str) -> String {
    format!("¡Hola, {}! NeuroScribe ahora corre en Tauri.", name)
}
```

Invocación desde TypeScript:

```typescript
import { invoke } from '@tauri-apps/api/core';

const response = await invoke('greet', { name: 'Usuario' });
console.log(response);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Static Build | Ejecutar `next build` y verificar que la carpeta `out/` existe. |
| Integration | Tauri Dev | Ejecutar `tauri dev` y confirmar que la ventana se abre. |
| Integration | Rust Bridge | Invocar el comando `greet` desde la consola de la app y verificar la respuesta. |

## Migration / Rollout

No se requiere migración de datos en este sprint, ya que solo estamos cambiando el contenedor de la aplicación. Se recomienda limpiar la carpeta `.next` y `node_modules` antes de la primera construcción de Tauri para evitar conflictos.

## Open Questions

- [ ] ¿Cómo manejaremos el ruteo de Supabase Auth sin middleware en el corto plazo? (Probablemente mediante un High-Order Component de protección de rutas en el cliente).
