export interface AcademicWork {
  doi: string;
  title: string;
  authors: { name: string; orcid?: string }[];
  year: number;
  journal?: string;
  abstract?: string;
  relevance_score: number;
  url?: string;
  mesh_terms: string[]; // Nuevo: Términos MeSH asociados
}

export interface SearchOptions {
  query: string;
  high_precision: boolean; // Si es true, usa filtrado MeSH
  domain: "medicine" | "psychology" | "general";
}

export interface CitationResult {
  inText: string; // (Autor, 2024)
  reference: string; // Formato APA completo
  bibtex?: string;
  ris?: string;
}

export interface ResearchResponse {
  synthesis: string;
  sources: AcademicWork[];
  validated: boolean;
}
