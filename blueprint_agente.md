# MASTER BLUEPRINT: PROYECTO NEUROSCRIBE (Nombre en Clave)

> **Instrucción para el Nuevo Agente (Cursor / Kilocode / Cline):** 
> Eres un Ingeniero de Software Senior y Arquitecto de Sistemas. Estás a cargo de construir una aplicación SaaS desde cero. Debes leer detenidamente este documento, ya que es tu única fuente de verdad. No asumas cosas que no estén aquí. Sigue las reglas de "Gentle AI" (pasos atómicos, validación constante, código modular).

## 1. REGLAS ESTRICTAS DEL AGENTE (Desarrollo Anti-Amnesia)
1. **Modularidad Extrema:** Ningún archivo de interfaz (UI) o controlador de lógica debe superar las 300 líneas. Si un componente crece, divídelo en hooks o subcomponentes.
2. **Documentación Inline:** Todo el código complejo debe estar comentado. Usa JSDoc para funciones clave.
3. **Paso a Paso:** No intentes implementar todo de una vez. Trabaja en sprints de 1 característica (Feature Branching). Solicita permiso al humano antes de crear grandes ramas de código.
4. **Tipado Estricto:** Usa TypeScript siempre. No uses `any`. Define interfaces para cada respuesta de API externa.
5. **Logs y Errores:** Evita logs silenciados. Implementa un sistema de manejo de errores global (Error Boundaries en el Frontend y capa de manejo de excepciones en el Backend).

## 2. STACK TECNOLÓGICO SELECCIONADO
*(Justificación: Se elige un stack monolito-fullstack para máxima velocidad de desarrollo, compatibilidad total con TypeScript y resiliencia ante bloqueos de internet en Venezuela).*

* **Frontend y Backend API:** Next.js 14+ (App Router), React, TailwindCSS, TipTap (Editor de texto enriquecido tipo Google Docs). Next.js permite tener frontend y backend en un solo repositorio, simplificando el mantenimiento.
* **Base de Datos & Auth:** Supabase (PostgreSQL, PgVector para RAG, Supabase Auth, Storage para audios/documentos). Es robusto y soporta RAG nativamente.
* **Hosting:** Railway (Sin bloqueos en VE, despliegues automáticos rápidos desde GitHub y entornos Main/Staging ilimitados).
* **IA Textual:** OpenRouter API (Modelo Principal: `meta-llama/llama-3.1-405b-instruct`, Secundario: `mistralai/mistral-large`).
* **IA Audio y Ciencia:** 
  - *Audio:* Recomiendo usar una API dedicada a voz como Groq (gratuita/rápida) o un proveedor como Fal.ai / RunPod que acepte Crypto, ya que OpenRouter NO procesa audio.
  - *Ciencia:* Semantic Scholar API (Es la base de datos libre más potente de papers académicos) y OpenAlex.

## 3. ESQUEMA DE BASE DE DATOS E INTERFACES (Core)
* `users`: id, email, role, minutes_balance, cc_balance (Cupones Ciencia).
* `payments`: id, user_id, amount, currency (USD, VES), method (Binance, Zinli, PayPal, PagoMóvil), status (pending, approved, rejected), reference_code.
* `folders` (Pacientes/Proyectos): id, user_id, name, created_at.
* `documents` (Transcripciones/Resúmenes/Papers): id, user_id, folder_id, title, content (HTML/JSON para TipTap), type (transcript, summary, paper), tokens_used.

## 4. MÓDULO 1: TRANSCRIPCIÓN Y RESUMEN CLÍNICO
**Flujo Objetivo:**
1. El usuario (Psicólogo, Médico) sube un audio o graba desde el navegador. (El lado del cliente comprime el audio antes de subir para proteger los megas del usuario en VE).
2. Se procesa con Whisper-Large-v3 (con diarización).
3. Se muestra un panel donde el usuario asocia "Speaker 1 -> Doctor", "Speaker 2 -> Paciente".
4. El usuario selecciona una plantilla predefinida ("Evaluación Diagnóstica", "Historia Clínica") o ingresa un prompt personalizado.
5. Llama 3.1 405b genera la respuesta.
6. La respuesta se inyecta en **TipTap (Editor WYSIWYG colaborativo).**
   - *Nota de Arquitectura:* A diferencia del Markdown plano, TipTap permite que el humano modifique negritas, tablas, fuentes y guarde el documento exactamente como lo ve.
7. Botones de Acción: "Exportar PDF", "Exportar Word (.docx)", "Guardar en Carpeta del Paciente".
8. **Chat RAG:** Dentro de la carpeta, un panel lateral de IA permite preguntar cosas como: *"¿Cuándo fue la última vez que el paciente mencionó insomnio según las 3 transcripciones pasadas?"*

## 5. MÓDULO 2: INVESTIGACIÓN CIENTÍFICA (Moneda: "CC")
**Flujo Objetivo:**
* **Búsqueda Simple (Costo: 1 CC):** El usuario hace una pregunta. El backend consulta en Semantic Scholar / PubMed para 3-5 artículos, Llama 3.1 405b sintetiza y genera la respuesta con hipervínculos APA.
* **Generación de Paper Completo APA-7 (Costo: X CC):**
  1. Aparece un **Menú Guiado Guiado (Estilo Skywork)**: Fechas (1, 5, 10 años), Propósito, Público objetivo. Opcional.
  2. El Agente Backend hace scraping/búsqueda de los 10 mejores artículos de cuartiles Q1/Q2.
  3. Recupera los Abstracts o Textos Completos.
  4. La IA genera el Paper aplicando las **Normas APA 7ma Edición** meticulosamente:
     - Título bilingüe.
     - Resumen y Abstract (inglés/español) + Palabras Clave / Keywords.
     - Tabla de Contenido interactiva.
     - Desarrollo con citas parafraseadas [(Autor, 2023)](file:///tmp/verify_rag.py#10-53) y textuales [(Autor, 2023, p. 5)](file:///tmp/verify_rag.py#10-53).
     - Sección de Referencias usando el formato de sangría francesa (`text-indent: -1.5em; padding-left: 1.5em;` en CSS de TipTap).

## 6. ECONOMÍA, PLANES Y PAGOS (Optimizado para VE)
* **Precios Target:** Básico ($10), Pro ($20), Premium ($50).
* **Saldo:** Sistema de Roll-Over ilimitado y recargas sueltas. Todo se mide en "Minutos de Audio" y "Cupones de Ciencia (CC)".
* **Pasarelas y Verificación:**
  - *Internacionales:* PayPal. **El agente debe programar un margen de `+5.4% + $0.30` sobre el precio base en el checkout de PayPal para que la plataforma no absorba la comisión.**
  - *Locales/Crypto:* Binance Pay, Zinli, Bs (Pago Móvil a Tasa Binance P2P). 
  - *Lógica Backend:* El usuario introduce su N° de Referencia (`reference_code`) mediante un formulario. El estado del pago pasa a `pending`.
  - Aparece en el Panel de Administración. Al hacer clic en "Aprobar", un webhook en Supabase dispara la inserción de Minutos y CC al usuario.

## 7. HITOS DE EJECUCIÓN DEL AGENTE
* **Sprint 1 (Día 1-2):** "Hola Mundo" en Next.js. Auth de Usuarios con Supabase. Despliegue en Railway (Staging).
* **Sprint 2 (Día 3-4):** Dashboard. Base de datos de Carpetas y Documentos en blanco.
* **Sprint 3 (Día 5-7):** Módulo Editor TipTap. Subida de Audio (Whisper) y Diarización + Generar DOCX/PDF.
* **Sprint 4 (Día 8-10):** Integración de Llama 3.1 405b. Funciones de Plantillas ("Prompt Magic").
* **Sprint 5 (Día 11-13):** RAG (PgVector). Chat sobre los documentos del paciente en de la carpeta.
* **Sprint 6 (Día 14-17):** Módulo Científico API Semantic Scholar. Constructor de APA 7.
* **Sprint 7 (Día 18-20):** Panel Admin, Verificación de Pagos y Refinamiento (Launch).

---
*Fin del Blueprint. Agente, confirma tu comprensión analizando la complejidad del Sprint 3 y cómo garantizarás que el TipTap exporte un DOCX fidedigno.*
