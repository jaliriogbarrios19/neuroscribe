# Tasks: migracion-tauri

## Phase 1: Foundation (Next.js Config)

- [x] 1.1 Modificar `next.config.ts` para añadir `output: 'export'` y `images.unoptimized: true`.
- [x] 1.2 Desactivar `src/middleware.ts` (renombrar a `src/middleware.ts.old` o comentar el contenido).
- [x] 1.3 Verificar que `npm run build` genera la carpeta `out/` sin errores de servidor.

## Phase 2: Tauri Initialization

- [x] 2.1 Instalar dependencias de desarrollo: `npm install -D @tauri-apps/cli @tauri-apps/api`.
- [x] 2.2 Ejecutar `npx tauri init` con los parámetros adecuados.
- [x] 2.3 Actualizar `package.json` con los scripts: `tauri:dev` y `tauri:build`.

## Phase 3: Rust Bridge & Implementation

- [x] 3.1 Añadir el comando `greet` en Rust backend.
- [x] 3.2 Registrar el comando `greet` en el builder de Tauri.
- [x] 3.3 Crear un componente o script de prueba en el frontend que invoque `greet` y muestre el resultado en la consola.

## Phase 4: Verification & Cleanup

- [ ] 4.1 Ejecutar `npm run tauri:dev` y confirmar que la aplicación carga en la ventana nativa.
- [ ] 4.2 Verificar en la consola de la ventana (DevTools) que el comando `greet` devuelve el mensaje esperado desde Rust.
- [ ] 4.3 Documentar cualquier cambio necesario en el flujo de autenticación (debido a la falta de middleware) en un nuevo issue o nota técnica.
