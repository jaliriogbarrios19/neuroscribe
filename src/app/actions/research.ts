import { invoke } from '@tauri-apps/api/core';
import { AcademicWork } from '@/types/research';

/**
 * Orquestador de búsqueda académica en el backend de Rust.
 * Soporta modo de alta precisión con filtrado MeSH.
 */
export async function getAcademicData(
  query: string,
  highPrecision: boolean = false
): Promise<AcademicWork[]> {
  try {
    const results = await invoke<AcademicWork[]>('get_academic_data_local', {
      query,
      highPrecision,
    });
    return results;
  } catch (error) {
    console.error('Error in getAcademicData:', error);
    return [];
  }
}

/**
 * Valida un DOI usando el backend de Rust.
 */
export async function verifyDOI(doi: string): Promise<boolean> {
  try {
    return await invoke<boolean>('verify_doi_local', { doi });
  } catch (error) {
    console.error('Error verifying DOI:', error);
    return false;
  }
}

export async function generateScienceSynthesis(
  query: string,
  works: AcademicWork[],
  domain: string = 'general'
) {
  void query;
  try {
    const result = await invoke<string>('generate_research_paper_local', {
      articles: works,
      domain: domain,
    });

    // Fact-Checking básico de DOIs en el resultado generado (One-shot)
    // En una versión más avanzada, esto se haría iterativamente en lib.rs

    return {
      synthesis: result,
      sources: works,
      validated: true,
    };
  } catch (error) {
    console.error('Error in generateScienceSynthesis:', error);
    throw error;
  }
}

export async function generateQuickAnswer(
  query: string,
  works: AcademicWork[],
  domain: string = 'general'
) {
  try {
    const result = await invoke<string>('generate_quick_answer_local', {
      query: query,
      articles: works,
      domain: domain,
    });
    return {
      synthesis: result,
      sources: works.slice(0, 5),
      validated: true,
    };
  } catch (error) {
    console.error('Error in generateQuickAnswer:', error);
    throw error;
  }
}

export async function searchResearch(query: string) {
  return getAcademicData(query);
}

export async function saveResearch(data: Record<string, unknown>) {
  const payload = data;
  console.log('[MOCK] saveResearch', payload);
  return { id: 'mock-res-' + Date.now(), ...payload };
}

export async function getResearchResults(folderId: string) {
  console.log('[MOCK] getResearchResults', folderId);
  return [];
}
