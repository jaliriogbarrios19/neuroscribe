# Proposal: migracion-tauri

## Intent

Migrar la arquitectura actual de NeuroScribe de una aplicación SaaS basada en Next.js y Supabase a una aplicación de escritorio nativa utilizando Tauri 2 y Rust. Este cambio es fundamental para cumplir con los objetivos de privacidad absoluta (procesamiento offline), eliminar costos operativos de nube y garantizar el funcionamiento en entornos con conectividad limitada.

## Scope

### In Scope
- **Inicialización de Tauri:** Configuración del entorno de Rust y Tauri v2 en la raíz del proyecto.
- **Configuración de Static Export:** Ajustar `next.config.ts` para soportar `output: 'export'`.
- **Scripts de NPM:** Actualización de `package.json` para incluir comandos de desarrollo y construcción de Tauri (`tauri:dev`, `tauri:build`).
- **Comando de Prueba Rust:** Implementación de un comando "Hello World" en Rust invocado desde el frontend para validar la comunicación.
- **Desbloqueo de Protocolos:** Configuración de `tauri.conf.json` para permitir el acceso a recursos locales necesarios.

### Out of Scope
- **Migración de Base de Datos:** El reemplazo de Supabase por SQLite se realizará en un sprint posterior.
- **Integración de Modelos IA:** La carga de Whisper y Llama en Rust es parte de futuros hitos.
- **Empaquetado Final:** La creación de instaladores (.exe, .dmg) se posterga hasta tener una versión funcional mínima.

## Approach

Se utilizará el **Enfoque de Inicialización In-situ**. Esto implica ejecutar `@tauri-apps/cli init` directamente en el repositorio actual para mantener la coherencia del proyecto. Next.js se configurará para generar una exportación estática en la carpeta `out/`, la cual será consumida por Tauri para renderizar la interfaz de usuario.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `package.json` | Modified | Inclusión de `@tauri-apps/api` y `@tauri-apps/cli`. Nuevos scripts de tauri. |
| `next.config.ts` | Modified | Configuración de `output: 'export'` y `images.unoptimized: true`. |
| `src-tauri/` | New | Directorio raíz para la lógica de backend en Rust y configuración de Tauri. |
| `src/app/` | Modified | Los layouts y páginas deberán ser compatibles con exportación estática (sin `getServerSideProps` o hooks de servidor). |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Incompatibilidad de Server Actions | High | Documentar y planear la migración de cada Server Action a comandos de Tauri (`invoke`). |
| Configuración de Rust en Windows | Medium | Verificar pre-requisitos (Build Tools, Rustup) antes de la inicialización. |
| Fallos en Static Export | Low | Validar el build de Next.js antes de intentar correr Tauri. |

## Rollback Plan

Revertir los cambios en `package.json` y `next.config.ts`. Eliminar la carpeta `src-tauri/`. El proyecto volverá a ser una aplicación Next.js web estándar.

## Dependencies

- **Rust:** Instalado en el sistema (rustc, cargo).
- **Tauri CLI:** `@tauri-apps/cli`.
- **Node.js:** v20+.

## Success Criteria

- [ ] `npm run tauri:dev` abre una ventana de escritorio con la UI de NeuroScribe.
- [ ] La consola del frontend muestra el mensaje de éxito del comando "Hello World" desde Rust.
- [ ] `next build` genera correctamente la carpeta `out/` sin errores de servidor.
