# Design: Módulo Científico

## Technical Approach

El "Agente Investigador" evolucionará a una arquitectura de **Verificación Blindada**. Implementaremos un orquestador multi-fuente que consultará **PubMed** (rigor clínico), **OpenAlex** (catálogo masivo) y **CORE** (acceso abierto). La pieza central será un validador determinista conectado a la API de **Crossref**, que actuará como filtro final para cada cita generada por la IA, garantizando que solo la verdad científica llegue al editor TipTap.

## Architecture Decisions

### Decision: Multi-Source Orchestration
**Choice**: Usar un patrón de orquestación en paralelo para PubMed, OpenAlex y CORE.
**Rationale**: PubMed es el estándar médico; CORE garantiza PDFs gratuitos; OpenAlex proporciona cobertura masiva. Juntos ofrecen una visión completa sin depender de una sola API.

### Decision: Verification Layer - Crossref
**Choice**: Usar la API de Crossref como validador de DOIs.
**Rationale**: Es el registro oficial de DOIs. Si Crossref confirma la existencia de un artículo bajo un DOI, la información es verídica. Esto elimina el riesgo de alucinaciones de la IA.

### Decision: Polite Pool Usage
**Choice**: Incluir una cabecera de contacto (email) en todas las peticiones a las APIs.
**Rationale**: Nos permite entrar en el "Polite Pool", lo que garantiza mejores tiempos de respuesta y mayores límites de peticiones sin necesidad de keys de pago inmediatas.

## Data Flow

1. **Research Request**: El usuario lanza una consulta en el `ResearchSidebar`.
2. **Orchestrated Fetching (`getAcademicData`)**:
   - `Promise.all` para consultar PubMed, OpenAlex y CORE en paralelo.
   - Normalización de resultados a la interfaz `AcademicWork`.
3. **AI Synthesis with Fact-Checking**:
   - La IA genera el borrador con marcadores de DOI.
   - **Post-processor**: Un hook asíncrono consulta Crossref para validar cada marcador.
   - Si se valida: Se formatea la cita con `citation-js`.
   - Si no: Se solicita a la IA una corrección o se informa al usuario.
4. **Final Injection**: El contenido se inyecta en TipTap con formato APA 7 y enlaces funcionales.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/actions/research.ts` | Modify | Orquestador multi-API (PubMed, CORE, OpenAlex). |
| `src/lib/utils/verify.ts` | Create | Capa de verificación asíncrona con Crossref. |
| `src/lib/utils/citation.ts` | Modify | Integración con metadatos de múltiples fuentes. |
| `src/components/research/ResearchSidebar.tsx` | Create | Interfaz de búsqueda multi-fuente. |

## Interfaces / Contracts

```typescript
interface VerifiedPaper extends AcademicWork {
  doi_verified: boolean;
  has_pdf: boolean;
  pdf_url?: string;
  source: 'PubMed' | 'OpenAlex' | 'CORE';
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `verify.ts` | Probar con DOIs reales e inventados para asegurar que el "Fact-Checker" es preciso. |
| Integration | `getAcademicData` | Verificar que los resultados de las 3 fuentes se combinan sin duplicados (usando DOI como clave única). |
| Manual | PDF Flow | Confirmar que el enlace a CORE abre el PDF correctamente. |

## Open Questions

- [ ] ¿Cómo manejar duplicados entre fuentes? (Resuelto: DOI será la clave primaria de de-duplicación).
- [ ] ¿Límite de citas por respuesta? (Propuesto: Máximo 10 citas validadas por bloque de texto).
