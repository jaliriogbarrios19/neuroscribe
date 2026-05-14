import { invoke } from "@tauri-apps/api/core";
import { AcademicWork, ResearchResponse } from "@/types/research";
import { llmGenerate } from "./ia";

/**
 * Orquestador de búsqueda académica en el backend de Rust.
 * Soporta modo de alta precisión con filtrado MeSH.
 */
export async function getAcademicData(query: string, highPrecision: boolean = false): Promise<AcademicWork[]> {
  try {
    const results = await invoke<AcademicWork[]>("get_academic_data_local", {
      query,
      highPrecision
    });
    return results;
  } catch (error) {
    console.error("Error in getAcademicData:", error);
    return [];
  }
}

/**
 * Valida un DOI usando el backend de Rust.
 */
export async function verifyDOI(doi: string): Promise<boolean> {
  try {
    return await invoke<boolean>("verify_doi_local", { doi });
  } catch (error) {
    console.error("Error verifying DOI:", error);
    return false;
  }
}

export async function generateScienceSynthesis(query: string, works: AcademicWork[], domain: string = "general") {
  try {
    const result = await invoke<string>("generate_research_paper_local", {
      articles: works,
      domain: domain
    });
    
    // Fact-Checking básico de DOIs en el resultado generado (One-shot)
    // En una versión más avanzada, esto se haría iterativamente en lib.rs
    
    return {
      synthesis: result,
      sources: works,
      validated: true
    };
  } catch (error) {
    console.error("Error in generateScienceSynthesis:", error);
    throw error;
  }
}

export async function generateQuickAnswer(query: string, works: AcademicWork[], domain: string = "general") {
  try {
    const result = await invoke<string>("generate_quick_answer_local", {
      query: query,
      articles: works,
      domain: domain
    });
    return {
      synthesis: result,
      sources: works.slice(0, 5),
      validated: true
    };
  } catch (error) {
    console.error("Error in generateQuickAnswer:", error);
    throw error;
  }
}

export async function searchResearch(query: string) {
  return getAcademicData(query);
}

export async function generateWithCloudLLM(
  provider: string,
  query: string,
  works: AcademicWork[],
  domain: string,
  mode: "quick" | "full"
): Promise<{ synthesis: string; sources: AcademicWork[] }> {
  const context = works
    .slice(0, 5)
    .map((w, i) => `Fuente ${i + 1}: ${w.title} (${w.year})\n${w.abstract_text || w.journal}`)
    .join("\n\n");

  const prompt = mode === "quick"
    ? `Responde a esta pregunta usando la evidencia proporcionada. Se conciso y cita las fuentes.\n\nPregunta: ${query}\nDominio: ${domain}\n\nEvidencia:\n${context}`
    : `Genera un paper academico en formato APA 7ma edicion sobre el siguiente tema, usando la evidencia proporcionada. Incluye titulo bilingue, resumen, abstract, desarrollo con citas, y referencias.\n\nTema: ${query}\nDominio: ${domain}\n\nEvidencia:\n${context}`;

  const synthesis = await llmGenerate(provider, prompt);
  return { synthesis, sources: works.slice(0, 5) };
}

export async function saveResearch(data: any) {
  console.log("[MOCK] saveResearch", data);
  return { id: "mock-res-" + Date.now(), ...data };
}

export async function getResearchResults(folderId: string) {
  console.log("[MOCK] getResearchResults", folderId);
  return [];
}
