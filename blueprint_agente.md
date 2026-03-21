# MASTER BLUEPRINT: PROYECTO NEUROSCRIBE (Nombre en Clave)

> **Instrucción para el Nuevo Agente (Cursor / Kilocode / Cline):** 
> Eres un Ingeniero de Software Senior y Arquitecto de Sistemas. Estás a cargo de construir una aplicación SaaS desde cero. Debes leer detenidamente este documento, ya que es tu única fuente de verdad. No asumas cosas que no estén aquí. Sigue las reglas de "Gentle AI" (pasos atómicos, validación constante, código modular).

## 1. REGLAS ESTRICTAS DEL AGENTE (Desarrollo Anti-Amnesia)
1. **Modularidad Extrema:** Ningún archivo de interfaz (UI) o controlador de lógica debe superar las 300 líneas. Si un componente crece, divídelo en hooks o subcomponentes.
2. **Documentación Inline:** Todo el código complejo debe estar comentado. Usa JSDoc para funciones clave.
3. **Paso a Paso:** No intentes implementar todo de una vez. Trabaja en sprints de 1 característica (Feature Branching). Solicita permiso al humano antes de crear grandes ramas de código.
4. **Tipado Estricto:** Usa TypeScript siempre. No uses `any`. Define interfaces para cada respuesta de API externa.
5. **Logs y Errores:** Evita logs silenciados. Implementa un sistema de manejo de errores global (Error Boundaries en el Frontend y capa de manejo de excepciones en el Backend).
6. **Autonomía Total por Tarea:** Una vez aprobada una tarea o Sprint, el agente tiene autorización para ejecutar todos los sub-pasos técnica y lógicamente necesarios de forma autónoma. No debe solicitar permiso para comandos individuales salvo en casos de error bloqueante o dudas de diseño críticas no documentadas aquí.

## 2. STACK TECNOLÓGICO SELECCIONADO (Arquitectura Desktop Local)
*(Justificación: Migración a aplicación de escritorio para garantizar privacidad absoluta (HIPAA local), costos operativos $0 y funcionamiento sin internet en Venezuela. Todo rastro de Supabase SSR o dependencias Cloud ha quedado obsoleto).*

* **Frontend:** Next.js 16+ (App Router con Exportación Estática), React, TailwindCSS, TipTap.
* **Core Desktop / Backend:** Tauri (Rust). Extremadamente ligero. Usaremos SQLite local para base de datos de expedientes médicos.
* **Instalador Inteligente:** El instalador solicitará permisos para escanear el hardware (RAM, VRAM, CPU) y descargará automáticamente el modelo GGUF/GGML adecuado a la capacidad de la PC del usuario.
* **IA Textual Local:** `llama.cpp` empaquetado. 
  - *Modelo Principal Unificado (Medicina y Psicología juntas):* Llama-3.1-8B-Instruct (GGUF 4-bit) para equipos > 8GB RAM.
  - *Modelo Fallback:* Microsoft Phi-3.5-mini (GGUF) para equipos <= 8GB RAM.
* **IA Audio Local:** `whisper.cpp` ejecutando el modelo `ggml-large-v3-turbo.bin` para transcripción y diarización 100% offline.
* **Módulo Ciencia (Híbrido Efímero):** Búsqueda en Semantic Scholar / OpenAlex / PubMed. Descarga el paper, la IA lee y genera el documento, y **los archivos descargados se ELIMINAN de forma segura (wiped) inmediatamente después** por privacidad extrema.

## 3. ESQUEMA DE BASE DE DATOS LOCAL (SQLite en Tauri)
* `users` / `license`: license_key, trial_start_date, is_activated, hardware_profile.
* `folders` (Pacientes/Proyectos): id, name, created_at, local_path.
* `documents` (Transcripciones/Resúmenes/Papers): id, folder_id, title, content (HTML para TipTap), type (transcript, summary, paper). Todo se guarda cifrado en el disco del usuario.

## 4. MÓDULO 1: TRANSCRIPCIÓN Y RESUMEN CLÍNICO
**Flujo Objetivo:**
1. El usuario (Psicólogo, Médico) sube un audio o graba desde el navegador. (El lado del cliente comprime el audio antes de subir para proteger los megas del usuario en VE).
2. Se procesa de forma **100% Offline** utilizando `whisper.cpp` (modelo ggml-large-v3-turbo). Se descartan los audios post-transcripción.
3. Se muestra un panel donde el usuario asocia "Speaker 1 -> Doctor", "Speaker 2 -> Paciente".
4. El usuario selecciona una plantilla predefinida o ingresa un prompt personalizado.
5. El modelo local LLM (Llama-3 o Phi-3) genera la respuesta clínica en la máquina del usuario (0 riesgo de fuga HIPAA).
6. La respuesta se inyecta en **TipTap (Editor WYSIWYG colaborativo).**
   - *Nota de Arquitectura:* A diferencia del Markdown plano, TipTap permite que el humano modifique negritas, tablas, fuentes y guarde el documento exactamente como lo ve.
7. Botones de Acción: "Exportar PDF", "Exportar Word (.docx)", "Guardar en Carpeta del Paciente".
8. **Chat RAG:** Dentro de la carpeta, un panel lateral de IA permite preguntar cosas como: *"¿Cuándo fue la última vez que el paciente mencionó insomnio según las 3 transcripciones pasadas?"*

## 5. MÓDULO 2: INVESTIGACIÓN CIENTÍFICA
**Flujo Objetivo:**
* **Búsqueda Simple:** El usuario hace una pregunta. La app se conecta a Semantic Scholar y baja los datos. El modelo local redacta la respuesta.
* **Generación de Paper Completo APA-7:**
  1. Aparece un **Menú Guiado**: Fechas, Propósito, Público.
  2. **Protocolo 50-to-10:** La app busca de manera distribuida 50 artículos de bases Q1/Q2 y realiza un screening analítico para retener solo los 10 mejores.
  3. Recupera los Abstracts y PDFs temporalmente a una bóveda local (RAM o temp).
  4. Diferenciación de ejecución de Inferencia (Agentes MedRAGent):
     - *Llama 3.1:* Consolida y analiza en lotes amplios.
     - *Phi-3:* Analiza de manera secuencial y fragmentada (chunked, sección por sección) para conservar RAM.
  5. La IA redacta el Paper garantizando **Normas APA 7ma Edición**:
     - Título bilingüe, Resumen, Abstract, Palabras Clave.
     - Desarrollo con citas parafraseadas y textuales.
     - Referencias en estilo sangría francesa.
  6. **Verificación DOI Externa:** Paso final en circuito cerrado en el cual se extraen las citas generadas y se hace un request de verificación ("Revisión de Hechos") contra PubMed/Crossref para constatar que existan y no sean alucinaciones.
## 6. ECONOMÍA Y MODELO DE NEGOCIO (Micro-Suscripción Local)
* **Modalidad de Venta:** Suscripción de bajo costo después de 30 días de prueba gratuita.
* **Precio Target:** **$1 Mensual / $10 Anual**.
* **Ausencia de Saldos:** Al correr en local, el usuario tiene uso ILIMITADO de transcripciones y resúmenes.
* **Verificación de Licencias:** Al abrir la App, verifica la llave de licencia contra un servidor ligero de licencias.
* **Pasarelas de Pago:** Integración de checkout web con Binance Pay, Zinli y Pago Móvil. La llave de activación se envía al correo automáticamente (ej. vía Make).

## 7. HITOS DE EJECUCIÓN DEL AGENTE
* **Sprint 1 (Día 1-3):** Reestructuración de Next.js a Desktop local empaquetado con **Tauri**. Perfilado de detector de Hardware.
* **Sprint 2 (Día 4-7):** Integración de `whisper.cpp` para transcripción de audio nativa offline + Diarización.
* **Sprint 3 (Día 8-11):** Integración del LLM local (`llama.cpp` con Phi-3 o Llama 3 8B) para resúmenes. SQLite local para DB de expedientes. Editor TipTap.
* **Sprint 4 (Día 12-15):** Módulo Científico API Semantic Scholar. Constructor de APA 7. Borrado automático de PDFs descargados por seguridad.
* **Sprint 5 (Día 16-18):** Sistema de Licenciamiento, 30-Day Trial y empaquetado final para Windows (.exe) y Mac (.dmg).

---

