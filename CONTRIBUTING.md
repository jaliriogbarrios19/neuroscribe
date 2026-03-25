# Guía de Contribución — NeuroScribe

Gracias por tu interés en contribuir a NeuroScribe. Sigue estas pautas para mantener la calidad y coherencia del proyecto.

## Configuración del entorno de desarrollo

### 1. Prerrequisitos

- **Node.js** ≥ 20 LTS
- **Rust** ≥ 1.77.2 (`rustup toolchain install stable`)
- **Tauri CLI** v2 (`npm install -g @tauri-apps/cli`)
- **Git**

### 2. Clonar e instalar

```bash
git clone https://github.com/jaliriogbarrios19/neuroscribe.git
cd neuroscribe
npm install
```

### 3. Iniciar en modo desarrollo

```bash
npm run tauri:dev
```

El frontend estará disponible en `http://localhost:3000` y el backend Rust se compilará automáticamente.

## Flujo de trabajo

1. Crea una rama desde `main` con un nombre descriptivo:
   ```bash
   git checkout -b feat/nombre-de-la-funcionalidad
   ```
2. Realiza tus cambios siguiendo las convenciones de código descritas abajo.
3. Asegúrate de que el linter pase: `npm run lint`
4. Abre un Pull Request hacia `main` con una descripción clara del cambio.

## Convenciones de código

### TypeScript / React

- **Sin `any`**: usa tipos concretos o `unknown` + type guard.
- **Componentes**: archivos `.tsx` en `PascalCase`, exportados como `default`.
- **Acciones Tauri**: en `src/app/actions/`, cada archivo agrupa comandos relacionados.
- **Hooks**: prefijo `use`, archivos en `src/hooks/`.

### Rust

- Usa `log::info!` / `log::error!` en lugar de `println!` para mensajes de diagnóstico.
- Evita `.unwrap()` en código de producción; usa `?` o manejo explícito de errores.
- Valida siempre los inputs de comandos Tauri antes de ejecutar lógica de negocio.

## Estructura de commits

Sigue el formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(ámbito): descripción corta en español

Ejemplos:
feat(editor): añadir soporte para exportación PDF
fix(rust): corregir panic en db_create_folder con nombre vacío
docs(readme): actualizar instrucciones de instalación
```

## Pruebas

Actualmente el proyecto no tiene una suite de tests completa. Al añadir lógica nueva:

- Para utilidades TypeScript (`src/lib/utils/`), añade pruebas en `src/__tests__/`.
- Para comandos Rust en `src-tauri/src/lib.rs`, añade pruebas unitarias dentro del mismo archivo en un bloque `#[cfg(test)]`.

## Reportar problemas

Abre un [Issue](https://github.com/jaliriogbarrios19/neuroscribe/issues) con:

- **Descripción clara** del problema.
- **Pasos para reproducirlo**.
- **Sistema operativo** y versión de NeuroScribe.
- **Logs relevantes** de la consola de la app.
