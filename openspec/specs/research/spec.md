# Research Specification (v3)

## Purpose
Este dominio define el comportamiento de la orquestación multi-agente para la investigación científica, incluyendo el filtrado crítico de fuentes (50->10), la síntesis jerárquica y la generación de papers en medicina y psicología con rigor APA 7 y validación determinista de DOIs.

## Requirements

### Requirement: 50->10 Academic Screening Protocol
El sistema DEBE realizar una búsqueda extensa (máx. 50 artículos) y aplicar un filtro de relevancia mediante el Agente Investigador para seleccionar los 10 mejores artículos basados en:
- Calidad de la publicación (Q1/Q2).
- Relevancia directa con la consulta.
- Rigor metodológico detectado en el abstract.

#### Scenario: Selection of top 10 articles
- GIVEN 50 articles retrieved from PubMed/OpenAlex.
- WHEN the Researcher Agent processes the abstracts.
- THEN it MUST rank and select the 10 most relevant articles.

### Requirement: MedRAGent High-Precision MeSH Search
El sistema DEBE permitir filtrar búsquedas académicas utilizando la taxonomía oficial MeSH (Medical Subject Headings) de la NLM.
- MUST map user queries to MeSH terms via Entrez `esearch` when "High Precision" mode is enabled.
- MUST inject discovered MeSH terms into the PubMed/OpenAlex queries to increase clinical relevance.

##### Scenario: Search with MeSH discovery
- GIVEN the user enters "diabetes management" in "High Precision" mode.
- WHEN the user clicks search.
- THEN the system MUST query Entrez for related MeSH terms and use them to refine the multi-source search.

### Requirement: Parallel Multi-Source Orchestration
El sistema DEBE consultar simultáneamente múltiples bases de datos académicas (PubMed para rigor clínico y OpenAlex para cobertura masiva) desde el backend de Rust.
- MUST de-duplicate results based on normalized DOI.
- MUST return a unified list of AcademicWorks.

### Requirement: Multi-Agent Synthesis Flow
La generación del paper se divide en dos fases:
1. **Agent "One" (Summarizer)**: Genera un resumen técnico enfocado en Metodología y Resultados.
2. **Agent "Two" (Synthesizer)**: Integra los resúmenes en un paper final con normas APA 7.

### Requirement: Deterministic DOI Verification
El sistema DEBE verificar la existencia real de cada cita generada por la IA antes de finalizar la síntesis contra la API de Crossref.
- If a DOI is not found, the system SHALL replace it with a warning or "Unverified" indicator.

### Requirement: Dual Research Modes
El sistema DEBE soportar dos modalidades: **Modo Paper (Completo)** y **Modo Respuesta (Express)**.
- El Modo Respuesta selecciona los 5 mejores artículos y genera una síntesis concisa de máx. 500 palabras.
