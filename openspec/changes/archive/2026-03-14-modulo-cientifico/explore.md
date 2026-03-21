# Exploration: Módulo Científico (Agente Investigador & APA 7)

## Current State
El sistema ya cuenta con una base sólida de autenticación, gestión de documentos y carpetas, y un editor TipTap funcional. Se ha identificado el riesgo de alucinaciones bibliográficas por parte de la IA, lo que requiere una capa de verificación determinista.

## Affected Areas
- `src/app/actions/research.ts` — Orquestación multi-fuente (OpenAlex, PubMed, CORE).
- `src/lib/utils/verify.ts` (Nuevo) — Capa de "Fact-Checking" con la API de **Crossref**.
- `src/lib/utils/citation.ts` — Integración con `citation-js` y metadatos de múltiples fuentes.

## Approaches

### 1. Orquestación Multi-fuente con Fact-Checking (RECOMENDADO)
Integrar **PubMed** para rigor clínico, **CORE** para enlaces a PDFs en Open Access y **Crossref** como validador de DOIs. La IA propone, pero Crossref dispone.
- **Pros:** Credibilidad científica absoluta, acceso a textos completos (CORE), validación en tiempo real de citas (Crossref).
- **Cons:** Mayor latencia por múltiples llamadas a APIs (se mitigará con caché).
- **Effort:** High.

## Recommendation
Implementar la arquitectura del **"Triángulo de la Verdad"**. Usaremos OpenAlex y PubMed como fuentes de descubrimiento, CORE para facilitar el acceso al conocimiento abierto y **Crossref** como el juez final que valida la existencia de cada DOI generado antes de permitir su inserción en el editor.

## Risks
- **Latencia:** Consultar 4 APIs puede ser lento. Implementaremos una estrategia de "Streaming" para la búsqueda y validación asíncrona para las citas.
- **Límites de Rate-limit:** Necesario configurar cabeceras de contacto para el "Polite Pool" de todas las APIs.

## Ready for Proposal
**Sí** — Esta arquitectura posiciona a NeuroScribe como una herramienta de grado de investigación superior.
