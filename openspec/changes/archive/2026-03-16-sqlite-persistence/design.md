# Design: sqlite-persistence

## Technical Approach

La implementación se basa en integrar el plugin oficial `tauri-plugin-sql` en el backend de Rust para gestionar una base de datos SQLite local. Utilizaremos el sistema de migraciones del plugin para inicializar el esquema de tablas. En lugar de exponer el plugin directamente al frontend (que permitiría ejecutar cualquier SQL desde JS), implementaremos comandos de Tauri específicos en Rust que actúen como una capa de servicio, validando y estructurando los datos antes de persistirlos.

## Architecture Decisions

### Decision: Migraciones de Base de Datos
**Choice**: Usar el sistema de migraciones integrado de `tauri-plugin-sql`.
**Rationale**: Permite evolucionar el esquema de forma controlada y asegura que todos los usuarios tengan la misma estructura de tablas al iniciar la aplicación.

### Decision: Capa de Servicio en Rust
**Choice**: Exponer comandos específicos (`db_get_folders`, `db_save_document`, etc.) en lugar de permitir SQL arbitrario desde el frontend.
**Rationale**: Proporciona una mejor seguridad y permite añadir lógica de negocio (como validaciones o post-procesamiento) en el backend. Facilita el mantenimiento al tener un contrato claro entre frontend y backend.

### Decision: Manejo de IDs (UUID)
**Choice**: Generar UUIDs v4 en Rust antes de insertar en SQLite.
**Rationale**: SQLite no tiene un tipo UUID nativo, por lo que almacenaremos los IDs como TEXT. Generarlos en el backend asegura consistencia y evita colisiones.

## Data Flow

`UI Component ──→ Next.js Action (Mock/Proxy) ──→ Tauri Invoke ──→ Rust Command ──→ SQLite`

El flujo es síncrono desde la perspectiva del comando de Tauri, pero asíncrono en el frontend mediante `invoke`.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src-tauri/Cargo.toml` | Modify | Añadir `tauri-plugin-sql` con el feature `sqlite`. |
| `src-tauri/src/lib.rs` | Modify | Registrar el plugin SQL y definir los nuevos comandos de base de datos. |
| `src-tauri/migrations/01_initial_schema.sql` | Create | Script SQL inicial para crear las tablas de perfiles, carpetas y documentos. |
| `src/app/actions/*.ts` | Modify | Reemplazar la lógica de los archivos en `src/app/actions/` para usar `invoke`. |

## Interfaces / Contracts

### Comandos de Rust (Ejemplo)

```rust
#[tauri::command]
async fn db_get_folders(db: tauri::State<'_, MyDatabase>) -> Result<Vec<Folder>, String> { ... }

#[tauri::command]
async fn db_create_folder(name: &str, db: tauri::State<'_, MyDatabase>) -> Result<Folder, String> { ... }
```

### Tipos de Datos (TypeScript)

Se mantendrán las interfaces actuales para minimizar el impacto en la UI, pero se asegurará que coincidan con la estructura retornada por Rust.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Integration | Migraciones | Verificar que las tablas se crean correctamente al iniciar la app (usando un archivo de db temporal para tests). |
| Integration | CRUD de Carpetas | Invocar `db_create_folder` y luego `db_get_folders` para verificar la persistencia. |
| E2E | Flujo de Usuario | Crear una carpeta desde la UI y verificar que aparece en el sidebar tras reiniciar. |

## Migration / Rollout

No se requiere migración de datos de Supabase a SQLite para este sprint. La base de datos se inicializará vacía.

## Open Questions

- [ ] ¿Debemos implementar un sistema de backup local automático (ej. copiar el archivo `.db` a una carpeta de respaldos)?
- [ ] ¿Cómo manejaremos la sesión del "usuario" local dado que ya no hay Supabase Auth? (Probablemente un perfil por defecto "Local User" por ahora).
