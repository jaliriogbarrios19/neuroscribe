# NeuroScribe

**NeuroScribe** es una aplicación de escritorio Local-First para profesionales de la salud, construida con [Next.js](https://nextjs.org) + [Tauri 2](https://tauri.app) + Rust. Permite transcribir audio, generar resúmenes clínicos y sintetizar investigación académica completamente offline, sin enviar datos a ningún servidor externo.

## Características principales

- 🎙️ **Transcripción offline** con Whisper v3 (GGML)
- 🧠 **Análisis clínico** con LLaMA 3 8B y BioMedLM 2.7B locales
- 📚 **Búsqueda académica** integrada con PubMed y OpenAlex
- 📄 **Generación de papers** en formato APA 7 con citaciones verificadas
- 🔐 **100% Local-First** — todos los datos se almacenan en SQLite local

## Requisitos previos

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| Rust | 1.77.2 | `rustup toolchain install stable` |
| Tauri CLI | 2.x | `npm install -g @tauri-apps/cli` |

## Inicio rápido (desarrollo)

```bash
# 1. Instalar dependencias de Node
npm install

# 2. Iniciar el entorno de desarrollo Tauri (frontend + backend)
npm run tauri:dev
```

> En Windows, puedes ejecutar `npm run setup:local` para configurar el entorno automáticamente.

## Construcción para producción

```bash
npm run tauri:build
```

El instalador se generará en `src-tauri/target/release/bundle/`.

## Modelos de IA

Los modelos no se incluyen en el repositorio por su tamaño. Se descargan desde la aplicación en **Ajustes → Modelos**:

| Modelo | Uso | Tamaño aprox. |
|--------|-----|---------------|
| `ggml-large-v3-turbo.bin` | Transcripción de audio | ~1.5 GB |
| `llama-3-8b-instruct.gguf` | Síntesis y papers | ~4.5 GB |
| `biomedlm-2.7b.gguf` | Análisis clínico | ~2.0 GB |

## Estructura del proyecto

```
neuroscribe/
├── src/                   # Aplicación Next.js (frontend)
│   ├── app/               # Rutas (App Router)
│   │   ├── (dashboard)/   # Layout principal y páginas
│   │   └── actions/       # Funciones que invocan comandos Tauri
│   ├── components/        # Componentes React reutilizables
│   ├── hooks/             # Hooks personalizados
│   ├── lib/utils/         # Utilidades (cn, citation, verify)
│   └── types/             # Tipos TypeScript globales
├── src-tauri/             # Backend Rust (Tauri)
│   ├── src/lib.rs         # Comandos Tauri (DB, IA, descarga)
│   ├── migrations/        # Esquemas SQL de SQLite
│   ├── bin/               # Sidecars (whisper-cli, llama-cli)
│   └── tauri.conf.json    # Configuración de Tauri
└── openspec/              # Especificaciones del proyecto (SDD)
```

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Solo frontend Next.js en `localhost:3000` |
| `npm run tauri:dev` | Frontend + backend Tauri en modo desarrollo |
| `npm run tauri:build` | Construye el instalador de producción |
| `npm run lint` | Ejecuta ESLint sobre el código TypeScript |

## Licencia

Propietario — © NeuroScribe. Todos los derechos reservados.
