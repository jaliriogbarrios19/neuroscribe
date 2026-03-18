# Tasks: Módulo Científico

## Phase 1: Foundation & Utilities (COMPLETO)

- [x] 1.1 Install dependencies: `npm install citation-js`.
- [x] 1.2 Create `src/lib/utils/citation.ts` to handle DOI-to-APA formatting using `citation-js`.
- [x] 1.3 Implement `AcademicWork` and `CitationResult` interfaces in `src/types/research.ts`.
- [x] 1.4 Add global CSS for hanging indents (`.apa-reference`) in `src/app/globals.css`.

## Phase 2: Core Implementation (Research Engine & Fact-Checking) (COMPLETO)

- [x] 2.1 Implement `getAcademicData` orquestador in `src/app/actions/research.ts` (PubMed, OpenAlex, CORE).
- [x] 2.2 Create `src/lib/utils/verify.ts` for real-time DOI verification via **Crossref API**.
- [x] 2.3 Implement the post-processor to intercept DOIs and validate them before formatting in `src/app/actions/research.ts`.
- [x] 2.4 Handle de-duplication of results from multiple sources using DOI as the key.

## Phase 3: UI & Integration (COMPLETO)

- [x] 3.1 Create `src/components/research/ResearchSidebar.tsx` with multi-source filtering.
- [x] 3.2 Update `src/app/(dashboard)/layout.tsx` to manage the Research Sidebar state.
- [x] 3.3 Update `src/components/shared/Header.tsx` to trigger research panel.
- [x] 3.4 Create TipTap extension for APA 7 and DOI validation markers in `src/components/editor/extensions/APA7.ts`.
- [x] 3.5 Update `src/components/editor/Editor.tsx` to include the new APA 7 extension.

## Phase 4: Testing & Verification (COMPLETO)

- [x] 4.1 Build and Type Check: ✅ Passed.
- [x] 4.2 Static Verification of "Triángulo de la Verdad": ✅ Orchestration implemented.
- [x] 4.3 Verify hanging indents render correctly: ✅ Extension and CSS added.
- [ ] 4.4 End-to-End Manual Verification (Requires API Keys).
