# Change Proposal: Setup Inicial

## Intent
Establecer la base estructural de NeuroScribe, incluyendo la orquestación de rutas, gestión de errores de autenticación y utilidades de UI fundamentales.

## Scope
- Refactorización del layout principal a un grupo de rutas `(dashboard)`.
- Implementación de una página de error de autenticación personalizada.
- Configuración de utilidades de UI (`cn` para mezcla de clases Tailwind).
- Preparación de la arquitectura para Supabase SSR en Next.js 16.

## Affected Areas
- **Auth**: Gestión de redirecciones y errores.
- **UI**: Layout de la aplicación y utilidades de estilo.
- **Core**: Estructura de carpetas y configuración base.

## Approach
1. Mover `src/app/page.tsx` y layouts relacionados a `src/app/(dashboard)/`.
2. Crear `src/app/auth/error/page.tsx`.
3. Crear `src/lib/utils/cn.ts`.
4. Asegurar que el middleware y el cliente de Supabase SSR estén correctamente configurados (si no lo están ya).
