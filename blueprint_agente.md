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
*(Justificación: Migración a aplicación de escritorio para garantizar privacidad absoluta (HIPAA local), costos operativos $0 y funcionamiento sin internet en Venezuela).*

* **Frontend:** Next.js 14+ (App Router con Exportación Estática), React, TailwindCSS, TipTap.
* **Core Desktop / Backend:** Tauri (Rust). Extremadamente ligero. Reemplaza a Supabase por SQLite local para base de datos de expedientes médicos.
* **Instalador Inteligente:** El instalador solicitará permisos para escanear el hardware (RAM, VRAM, CPU) y descargará automáticamente el modelo GGUF/GGML adecuado a la capacidad de la PC del usuario.
* **IA Textual Local:** `llama.cpp` empaquetado. 
  - *Equipos gama alta (16GB+ RAM / GPU):* Llama-3-8B-Instruct (GGUF 4-bit).
  - *Equipos gama media/baja (8GB RAM):* Microsoft Phi-3.5-mini (GGUF).
* **IA Audio Local:** `whisper.cpp` ejecutando el modelo `ggml-large-v3-turbo.bin` (idéntico a Transcribbly) para transcripción y diarización 100% offline.
* **Módulo Ciencia (Híbrido Efímero):** Búsqueda en Semantic Scholar / OpenAlex. Descarga el paper, la IA lee y genera el documento, y **los archivos descargados se ELIMINAN de forma segura (wiped) inmediatamente después** por privacidad extrema.

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

## 5. MÓDULO 2: INVESTIGACIÓN CIENTÍFICA (Moneda: "CC")
**Flujo Objetivo:**
* **Búsqueda Simple:** El usuario hace una pregunta. La app se conecta 2 segundos a Semantic Scholar, baja los datos. El modelo local Llama-3 redacta la respuesta.
* **Generación de Paper Completo APA-7:**
  1. Aparece un **Menú Guiado**: Fechas, Propósito, Público.
  2. La app hace búsqueda de los mejores artículos Q1/Q2.
  3. Recupera los Abstracts y PDFs temporalmente a una bóveda local (RAM o temp).
  4. La IA genera el Paper aplicando las **Normas APA 7ma Edición** meticulosamente:
     - Título bilingüe.
     - Resumen y Abstract (inglés/español) + Palabras Clave / Keywords.
     - Tabla de Contenido interactiva.
     - Desarrollo con citas parafraseadas [(Autor, 2023)](file:///tmp/verify_rag.py#10-53) y textuales [(Autor, 2023, p. 5)](file:///tmp/verify_rag.py#10-53).
     - Sección de Referencias usando el formato de sangría francesa (`text-indent: -1.5em; padding-left: 1.5em;` en CSS de TipTap).

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
*Fin del Blueprint. Agente, confirma tu comprensión analizando la complejidad del Sprint 3 y cómo garantizarás que el TipTap exporte un DOCX fidedigno.*
