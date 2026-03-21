# ESTRATEGIA MAESTRA PARA NEUROSCRIBE: INSIGHTS DEL CURSO DE DESARROLLO CON IA

Tras analizar los apuntes de las Clases 1, 2 y 3 del curso, he destilado las mejores prácticas y metodologías para que **NeuroScribe** no sea solo una app de IA, sino un ecosistema profesional, escalable y robusto.

---

## 1. METODOLOGÍA DE DESARROLLO: SDD (SPEC-DRIVEN DEVELOPMENT)

El código es transitorio; la especificación es eterna. Para evitar que NeuroScribe se convierta en un "Frankenstein":
*   **Diseño antes que Código:** Antes de pedirle al agente que programe el Módulo Científico, debemos tener una "Spec" (Especificación) que detalle cómo se conectarán las APIs de búsqueda con el generador de texto.
*   **Validación Atómica:** No avances al siguiente sprint hasta que la especificación del actual esté cerrada y probada.

## 2. EL RIGOR CIENTÍFICO MEDIANTE RAG EFÍMERO (PRIVACIDAD TOTAL)

Para tu módulo de investigación (Papers APA 7), el curso sugiere que la IA nunca debe "inventar". Debe trabajar bajo el paradigma de **IA Anclada y Efímera**:
*   **Fuentes de Verdad Híbridas:** El sistema debe conectarse a internet, buscar en Semantic Scholar/OpenAlex, **descargar los metadatos y PDFs a una carpeta temporal (`/tmp` o RAM)**, y entregar ese contexto al modelo GGUF local.
*   **Protocolo de Autodestrucción (Hardware Wiped):** Inmediatamente después de que el Llama-3 local genere y guarde el texto en el TipTap local, **todos los PDFs y rastros web descargados DEBEN SER BORRADOS DEFINITIVAMENTE del disco duro**.
*   **Verificación DOI:** Implementar un paso de "Revisión de Hechos" donde se verifique que cada cita generada por la IA tenga un DOI real existente.

## 3. ORQUESTACIÓN DE AGENTES (EL "PERSONA AGENT" STACK)

En lugar de un solo agente gigante, divide la creación del Paper o la Transcripción en roles especializados:
*   **Agente Transcriptor:** Se enfoca solo en la limpieza del texto y la diarización (quién habla).
*   **Agente Analista:** Toma la transcripción limpia y busca patrones clínicos o académicos según la plantilla.
*   **Agente Redactor (Editor):** Toma el análisis y le da el formato APA 7 o clínico final en el editor TipTap.
*   **Agente Revisor:** Revisa que el tono sea profesional y que se cumplan las normas de privacidad.

## 4. INSTALACIÓN INTELIGENTE Y DETECCIÓN DE HARDWARE

No intentes usar el mismo modelo para todos los médicos. Las laptops varían:
*   **SysProbe Integrado:** El instalador (Tauri/Rust) debe ejecutar `systeminformation` o un script ligero para leer la RAM del usuario y si posee GPU dedicada instalada.
*   **Descarga Condicionada (GGML/GGUF):** Si RAM > 11GB, el instalador baja `llama-3-8b.gguf` (4.9GB). Si RAM <= 10GB, baja `phi-3.5-mini.gguf` (2GB).
*   **Actualizaciones (CI/CD Local):** Configura GitHub Actions para construir los `.exe` o `.dmg` y al abrirlos la app busca ligeras mejoras estructurales o plantillas automáticas.



*NeuroScribe no es solo una herramienta; es un flujo de trabajo inteligente que respeta el método científico.*
