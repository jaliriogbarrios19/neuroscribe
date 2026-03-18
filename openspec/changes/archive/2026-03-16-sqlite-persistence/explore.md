## Exploration: sqlite-persistence

### Current State
El sistema utiliza Supabase para la persistencia de datos (perfiles, carpetas y documentos). La lógica de acceso a datos está encapsulada en Server Actions (`src/app/actions/backup/*.ts`), las cuales fueron mockeadas temporalmente para permitir la exportación estática de Next.js. El esquema de base de datos está definido en `supabase_schema.sql` y utiliza UUIDs y Row Level Security (RLS).

### Affected Areas
- `src-tauri/Cargo.toml` — Añadir el plugin de Tauri SQL (`tauri-plugin-sql`).
- `src-tauri/src/lib.rs` — Registrar el plugin SQL y configurar la base de datos SQLite.
- `src/app/actions/*.ts` — Reemplazar los mocks actuales con llamadas a los comandos de Tauri (`invoke`) o usar el plugin SQL directamente desde el frontend si se permite (aunque se recomienda centralizar en Rust por seguridad y lógica de negocio).
- `src/lib/db.ts` (Nuevo) — Capa de abstracción para interactuar con la base de datos local.
- `src-tauri/migrations/` (Nuevo) — Scripts SQL para inicializar las tablas en SQLite.

### Approaches
1. **Tauri Plugin SQL (Directo en Frontend)** — Usar la librería de JavaScript del plugin oficial para ejecutar queries SQL directamente desde los componentes/acciones.
   - Pros: Implementación rápida, similar a usar un SDK de base de datos en web.
   - Cons: Menos control sobre la lógica de negocio en el backend (Rust). Mezcla lógica de persistencia con UI.
   - Effort: Low

2. **Capa de Abstracción en Rust (Recomendado)** — Definir comandos de Tauri en Rust que manejen la base de datos (usando `sqlx` o el plugin SQL internamente) y exponer funciones de alto nivel al frontend (ej. `get_folders`, `save_document`).
   - Pros: Mejor separación de responsabilidades. La lógica compleja (como el cifrado de documentos mencionado en el blueprint) se puede manejar en Rust.
   - Cons: Requiere escribir más código en Rust.
   - Effort: Medium

### Recommendation
Se recomienda el **Enfoque 2 (Capa de Abstracción en Rust)**. Esto permite cumplir con el requisito de "privacidad extrema" y cifrado de documentos en disco mencionado en el `blueprint_agente.md`. Además, centraliza la lógica de negocio en el backend de la aplicación desktop, dejando el frontend solo para la presentación.

### Risks
- **Migración de UUID:** SQLite no tiene un tipo UUID nativo (se usan strings). Debemos asegurar que los IDs generados sean consistentes.
- **Relaciones y FK:** SQLite soporta Foreign Keys, pero deben habilitarse explícitamente (`PRAGMA foreign_keys = ON`).
- **Sincronización:** Si en el futuro se vuelve a habilitar la nube, la sincronización entre SQLite y Supabase será compleja.

### Ready for Proposal
Yes — El esquema de base de datos está claro y la integración con Tauri mediante el plugin oficial es el estándar de la industria.
