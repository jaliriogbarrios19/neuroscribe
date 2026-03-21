# Proposal: Módulo Científico

## Intent

Implementar el "Agente Investigador" para permitir búsquedas académicas de alto rigor. Usaremos el **"Triángulo de la Verdad"**: **PubMed** para rigor clínico, **OpenAlex** para descubrimiento masivo, **CORE** para acceso a PDFs abiertos y **Crossref** como motor de validación de DOIs.

## Scope

### In Scope
- Orquestación multi-fuente (OpenAlex, PubMed, CORE).
- Validación de citas en tiempo real mediante la API de **Crossref** (IA Fact-Checking).
- Generación de referencias bibliográficas APA 7 con `citation-js`.
- Búsqueda de enlaces a PDFs en Open Access (vía CORE/Unpaywall).
- Inserción de citas validadas en el editor TipTap con sangría francesa.

### Out of Scope
- Descarga masiva de PDFs (solo se proporcionará el enlace directo).
- Traducción completa de artículos de pago (solo se traduce el abstract).

## Approach

Implementaremos una arquitectura de **Investigación Blindada**:
1.  **Exploración:** Consultamos PubMed y OpenAlex simultáneamente para una visión 360°.
2.  **Enriquecimiento:** Cruzamos los resultados con CORE para obtener enlaces a PDF.
3.  **Generación de Síntesis:** La IA recibe los datos y propone contenido.
4.  **Validación de Hechos:** Un post-procesador intercepta cada DOI generado y lo valida contra **Crossref**. Si el DOI no existe, la IA debe buscar una fuente real o el sistema alerta al usuario.
5.  **Formateo Determinista:** `citation-js` genera la referencia APA 7 basándose en los metadatos validados por Crossref.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/actions/research.ts` | New | Orquestador multi-API (PubMed, CORE, OpenAlex). |
| `src/lib/utils/verify.ts` | New | Utilidades de "Fact-Checking" con Crossref. |
| `src/lib/utils/citation.ts` | New | Integración con `citation-js`. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Alucinaciones de la IA | Low | Se mitiga al 100% mediante la validación obligatoria en Crossref. |
| Tiempos de respuesta de APIs | Med | Implementación de ejecución paralela asíncrona (Promise.all) para las consultas. |

## Rollback Plan

Revertir a la versión anterior de `page.tsx`. No se altera la estructura de la base de datos de usuarios.

## Success Criteria

- [ ] Búsqueda devuelve resultados de PubMed y CORE con enlaces a PDF.
- [ ] Crossref valida exitosamente DOIs antes de la inserción.
- [ ] No se permite la inserción de una cita si Crossref no la confirma.
- [ ] Referencias perfectas en APA 7 generadas por `citation-js`.
