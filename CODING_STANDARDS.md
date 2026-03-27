# NeuroScribe — Coding Standards

> Este archivo es el contrato de escritura del proyecto.
> Cualquier desarrollador humano o modelo de IA que trabaje en este repositorio
> **debe** seguir estas convenciones para mantener coherencia y legibilidad.

---

## 📦 Tech Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 (strict mode) |
| UI | React 19 + Tailwind CSS 4 |
| Editor enriquecido | TipTap 3 |
| Desktop | Tauri 2 (Rust) |
| Base de datos | SQLite (via tauri-plugin-sql) |
| Package manager | npm |

---

## 🏗️ Estructura de directorios

```
src/
  app/
    (dashboard)/        ← rutas del dashboard (App Router)
    actions/            ← Server Actions por dominio
    layout.tsx
    globals.css
  components/
    editor/             ← componentes del editor TipTap
    research/           ← sidebar de investigación académica
    transcription/      ← grabación y transcripción de audio
    shared/             ← Header, Sidebar, DashboardShell, IAStatus
  hooks/                ← hooks personalizados de React
  lib/
    utils/              ← utilidades puras (cn.ts, citation.ts, verify.ts)
  types/                ← interfaces y tipos TypeScript globales
src-tauri/
  src/
    lib.rs              ← backend Rust (hardware, modelos, Whisper, Llama)
```

---

## ✏️ Convenciones de nombres

### Archivos y carpetas

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componente React | PascalCase + `.tsx` | `ResearchSidebar.tsx` |
| Hook personalizado | camelCase prefijo `use` + `.ts` | `useResearch.ts` |
| Server Action | camelCase + `.ts` en `actions/` | `research.ts` |
| Tipos/Interfaces | PascalCase + `.ts` en `types/` | `research.ts` |
| Utilidades puras | camelCase + `.ts` en `lib/utils/` | `cn.ts` |
| Carpetas | kebab-case | `research/`, `shared/` |

### Variables y funciones

```typescript
// ✅ Variables: camelCase
const isResearchOpen = false;
const documentTitle = 'Mi documento';

// ✅ Funciones y handlers: camelCase, verbos descriptivos
function handleSearch() { ... }
async function getAcademicData() { ... }

// ✅ Constantes globales: SCREAMING_SNAKE_CASE
const MAX_DOCUMENT_LENGTH = 50_000;
const DEFAULT_MODEL_PATH = '/models/llama';

// ✅ Interfaces de componentes: PascalCase + "Props"
interface ResearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ✅ Interfaces de datos: PascalCase + "Type" o solo PascalCase
interface Document {
  id: string;
  title: string;
  content: string;
}
```

---

## 🧩 Componentes React

### Estructura obligatoria

```typescript
'use client' // o 'use server' — SIEMPRE declarar

// 1. Imports externos (librería)
import { useState } from 'react';
import { Search } from 'lucide-react';

// 2. Imports internos (proyecto)
import { cn } from '@/lib/utils/cn';
import type { ResearchResult } from '@/types/research';

// 3. Interface de props (siempre con interface, no type alias)
interface MiComponenteProps {
  title: string;
  isVisible?: boolean;
  onAction: () => void;
}

// 4. Componente
const MiComponente = ({ title, isVisible = true, onAction }: MiComponenteProps) => {
  // 4a. Estado local
  const [isLoading, setIsLoading] = useState(false);

  // 4b. Handlers
  const handleClick = () => {
    onAction();
  };

  // 4c. Render
  return (
    <div className={cn('base-class', { 'hidden': !isVisible })}>
      {title}
    </div>
  );
};

export default MiComponente;
```

### Reglas de componentes

- ✅ Máximo **200 líneas** por componente — si crece, dividir
- ✅ **Siempre** usar `interface` para props (no `type`)
- ✅ **Siempre** usar `cn()` para clases Tailwind condicionales
- ✅ **Siempre** usar imports absolutos con `@/`
- ✅ Props opcionales con valor por defecto en los parámetros
- ❌ No poner lógica de negocio directamente en componentes UI
- ❌ No usar `any` — usar `unknown` con type guards si el tipo es incierto

---

## 🔁 Server Actions

```typescript
'use server'

// Cada server action en su propio archivo por dominio
// src/app/actions/research.ts

export async function getAcademicData(
  query: string,
  highPrecision: boolean
): Promise<ResearchResult[]> {
  // Validar entradas al inicio
  if (!query.trim()) return [];

  // Lógica...
}
```

### Reglas de server actions

- ✅ Un archivo por dominio: `ia.ts`, `research.ts`, `documents.ts`, etc.
- ✅ Siempre tipado el retorno (`Promise<T>`)
- ✅ Validar parámetros al inicio de la función
- ❌ No mezclar lógica de presentación con lógica de servidor

---

## 🪝 Hooks personalizados

```typescript
// src/hooks/useResearch.ts
'use client'

import { useState, useCallback } from 'react';
import { getAcademicData } from '@/app/actions/research';

export function useResearch() {
  const [results, setResults] = useState<ResearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const data = await getAcademicData(query, false);
      setResults(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { results, isLoading, search };
}
```

### Reglas de hooks

- ✅ Prefijo `use` obligatorio
- ✅ Siempre retornar objeto con nombres descriptivos
- ✅ Extraer a hook cuando la lógica se repite en 2+ componentes
- ✅ Manejar estados de carga y error

---

## 🎨 Tailwind CSS

```typescript
// ✅ Usar cn() para clases condicionales
className={cn(
  'flex items-center gap-2 px-4 py-2 rounded-md',
  isActive && 'bg-blue-500 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}

// ❌ No concatenar strings directamente
className={`flex ${isActive ? 'bg-blue-500' : ''}`}
```

---

## 📝 Tipos TypeScript

```typescript
// src/types/research.ts

// ✅ Usar interface para objetos
export interface ResearchResult {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  year: number;
  doi?: string;
}

// ✅ Usar type para uniones y alias simples
export type ResearchStatus = 'idle' | 'loading' | 'success' | 'error';

// ✅ Usar enum para conjuntos de valores relacionados
export enum ModelProvider {
  Llama = 'llama',
  Whisper = 'whisper',
}
```

---

## 🔧 Herramientas de calidad

### Pre-commit (automático vía Husky + lint-staged)

Al hacer `git commit`, se ejecuta automáticamente:
- **Prettier** — formatea todos los archivos `src/**/*.{ts,tsx,css}`
- **commitlint** — valida el mensaje de commit (Conventional Commits)

### Comandos manuales

```bash
npm run format        # Aplica Prettier a todo src/
npm run format:check  # Verifica formato sin modificar (útil en CI)
npm run lint          # Ejecuta ESLint (detecta errores de código)
npm run typecheck     # Verifica tipos TypeScript sin compilar
```

> **Nota sobre ESLint:** ESLint se ejecuta manualmente o en CI, no en el pre-commit.
> Esto evita bloquear commits por errores pre-existentes mientras se refactoriza el código.
> El objetivo es ir reduciendo los errores de ESLint progresivamente con cada PR.

---



**Formato:** `tipo(alcance): descripción en minúsculas`

| Tipo | Cuándo usarlo |
|------|--------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio de código sin bug ni feature |
| `chore` | Mantenimiento, deps, config |
| `docs` | Solo documentación |
| `test` | Agregar o corregir tests |
| `style` | Formato, espacios (sin cambio de lógica) |
| `ci` | Cambios en CI/CD |
| `perf` | Mejora de rendimiento |

**Ejemplos válidos:**
```
feat(editor): add APA7 citation export button
fix(research): handle empty query response gracefully
refactor(hooks): extract useResearch from ResearchSidebar
chore(deps): update tiptap to 3.20.1
docs: add CODING_STANDARDS.md
ci: add lint and typecheck to release workflow
```

**Ejemplos inválidos:**
```
❌ Update stuff
❌ fix bug
❌ WIP
❌ feat: Add New Button  (mayúsculas)
```

---

## 🚫 Prohibiciones globales

| Prohibido | Alternativa |
|-----------|------------|
| `any` | `unknown` + type guard |
| `console.log` en producción | Logger de Tauri (`tauri-plugin-log`) |
| Strings hardcodeados de UI en componentes | Constantes o variables |
| Componentes > 200 líneas | Dividir en subcomponentes |
| Lógica de negocio en JSX | Extraer a función o hook |
| Imports relativos largos (`../../../`) | Imports absolutos con `@/` |

---

## 🤖 Guía para IAs (Copilot, Cursor, Claude, GPT, etc.)

Cuando generes código para este proyecto:

1. **Consulta este archivo primero** — es la fuente de verdad del estilo
2. Usa siempre `'use client'` o `'use server'` según corresponda
3. Las props de componentes van en `interface`, no `type`
4. Usa `cn()` para Tailwind condicional
5. Imports siempre con `@/`
6. No uses `any` bajo ninguna circunstancia
7. Los mensajes de commit deben seguir Conventional Commits
8. Divide en múltiples archivos si un componente supera 200 líneas
9. La lógica de servidor va en `src/app/actions/`, no en componentes
10. Los tipos compartidos van en `src/types/`

---

> *"El código que escribimos hoy es el legado que el equipo hereda mañana."*
> — Filosofía Gentleman Programming
