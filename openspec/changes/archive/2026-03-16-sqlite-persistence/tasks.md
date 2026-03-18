# Tasks: sqlite-persistence

## Phase 1: Foundation (Infrastructure)

- [x] 1.1 Añadir `tauri-plugin-sql` al archivo `src-tauri/Cargo.toml`.
- [x] 1.2 Crear el directorio `src-tauri/migrations/` y añadir el archivo `01_initial_schema.sql` con el esquema de tablas (profiles, folders, documents).
- [x] 1.3 Configurar y registrar el plugin SQL en `src-tauri/src/lib.rs`.

## Phase 2: Core Implementation (Rust Backend)

- [x] 2.1 Definir structs en Rust que representen las entidades `Folder` y `Document` con soporte para Serde.
- [x] 2.2 Implementar comandos `db_get_folders` y `db_create_folder` en `src-tauri/src/lib.rs`.
- [x] 2.3 Implementar comandos `db_get_documents` y `db_save_document` en `src-tauri/src/lib.rs`.
- [x] 2.4 Implementar comando `db_get_profile` para manejar el perfil de usuario local por defecto.

## Phase 3: Integration (Frontend)

- [x] 3.1 Actualizar `src/app/actions/folders.ts` para usar `invoke('db_get_folders')` y `invoke('db_create_folder')`.
- [x] 3.2 Actualizar `src/app/actions/documents.ts` para usar `invoke('db_get_documents')` y `invoke('db_save_document')`.
- [x] 3.3 Actualizar `src/app/actions/profiles.ts` para usar `invoke('db_get_profile')`.

## Phase 4: Verification & Cleanup

- [x] 4.1 Verificar la creación automática del archivo `neuroscribe.db` y las tablas al iniciar.
- [x] 4.2 Probar el flujo completo de creación de carpeta y guardado de documento desde la UI.
- [x] 4.3 Eliminar definitivamente la carpeta `src/app/actions/backup/` (parcialmente, manteniendo research.ts).
