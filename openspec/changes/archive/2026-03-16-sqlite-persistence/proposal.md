# Proposal: sqlite-persistence

## Intent

Eliminar la dependencia de Supabase y la nube para la gestión de datos, migrando a una solución de persistencia local basada en SQLite. Esto garantiza la privacidad absoluta de los datos médicos (HIPAA local), permite el funcionamiento 100% offline y reduce los costos operativos a cero, cumpliendo con la visión de NeuroScribe 2026.

## Scope

### In Scope
- **Instalación de Tauri Plugin SQL:** Integración de la extensión oficial en el backend de Rust.
- **Esquema SQLite Local:** Creación de tablas para Perfiles, Carpetas y Documentos basadas en el esquema original de Supabase.
- **Comandos de Persistencia en Rust:** Implementación de funciones en Rust para CRUD de datos (ej. `db_get_folders`, `db_save_document`).
- **Migración de Frontend:** Actualización de las acciones en `src/app/actions/*.ts` para utilizar los nuevos comandos de Rust mediante `invoke`.
- **Scripts de Migración:** Implementación de la lógica para inicializar la base de datos en el primer arranque.

### Out of Scope
- **Sincronización con la Nube:** No se implementará respaldo en la nube en esta fase.
- **Cifrado de Base de Datos:** El cifrado AES en disco se posterga para un sprint de seguridad específico.
- **Migración de Datos Existentes:** Como el proyecto está en fase inicial, no se contempla migrar datos reales de Supabase a SQLite.

## Approach

Se utilizará el **Plugin SQL oficial de Tauri** configurado con SQLite. La lógica de acceso a datos se centralizará en el backend de Rust mediante comandos de Tauri. El frontend invocará estos comandos, permitiendo que la transición sea casi transparente para los componentes de UI. Se utilizará una carpeta local protegida dentro de los datos de aplicación del usuario para almacenar el archivo `.db`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src-tauri/Cargo.toml` | Modified | Adición de `tauri-plugin-sql`. |
| `src-tauri/src/lib.rs` | Modified | Configuración y registro del plugin y nuevos comandos de base de datos. |
| `src/app/actions/*.ts` | Modified | Reemplazo de lógica mock/supabase por `invoke('db_...')`. |
| `src-tauri/migrations/` | New | Scripts de creación de tablas. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de tipos UUID | Medium | Usar strings para IDs en SQLite y asegurar generación de UUIDs v4 en Rust o Frontend. |
| Corrupción de base de datos local | Low | Implementar cierres limpios y considerar backups automáticos en carpetas locales. |
| Curva de aprendizaje de Rust | Medium | Utilizar macros de Tauri y patrones establecidos para minimizar la complejidad. |

## Rollback Plan

Revertir a las acciones mockeadas o restaurar la conexión a Supabase (aunque esto contradice el objetivo de privacidad local).

## Dependencies

- **Tauri Plugin SQL:** `tauri-plugin-sql`.
- **Rust Toolchain:** Requerido para compilar el backend.

## Success Criteria

- [ ] La base de datos `neuroscribe.db` se crea automáticamente al iniciar la app.
- [ ] Las carpetas creadas en la UI persisten después de cerrar y abrir la aplicación.
- [ ] Los documentos se guardan y recuperan correctamente desde SQLite local.
- [ ] No existen llamadas a la red (fetch/supabase) durante el flujo de guardado/lectura.
