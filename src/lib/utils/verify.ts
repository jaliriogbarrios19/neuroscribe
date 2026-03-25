import { AcademicWork } from "@/types/research";

const CONTACT_EMAIL = "hola@neuroscribe.app"; // Email para Polite Pool de Crossref

interface CrossrefAuthor {
  given?: string;
  family?: string;
}

/**
 * Valida un DOI directamente en la API de Crossref.
 * Actúa como nuestro "Detector de Alucinaciones".
 */
export async function verifyDOIWithCrossref(doi: string): Promise<boolean> {
  if (!doi) return false;

  // Limpiar el DOI (quitar prefijo URL si existe)
  const cleanDoi = doi.replace(/https?:\/\/(dx\.)?doi\.org\//, '').toLowerCase();
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}?mailto=${CONTACT_EMAIL}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.status === 200) {
      const data = await response.json();
      return !!data.message?.DOI; // Confirmamos que el DOI retornado por Crossref es el mismo o válido
    }
    
    return false;
  } catch (error) {
    console.error(`Crossref Validation Error for DOI ${cleanDoi}:`, error);
    return false;
  }
}

/**
 * Enriquece metadatos desde Crossref si falta información crítica.
 */
export async function getMetadataFromCrossref(doi: string): Promise<Partial<AcademicWork> | null> {
  const cleanDoi = doi.replace(/https?:\/\/(dx\.)?doi\.org\//, '').toLowerCase();
  const url = `https://api.crossref.org/works/${encodeURIComponent(cleanDoi)}?mailto=${CONTACT_EMAIL}`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    const work = data.message;

    return {
      doi: work.DOI,
      title: work.title?.[0] || "",
      authors: work.author?.map((a: CrossrefAuthor) => ({ name: `${a.given ?? ''} ${a.family ?? ''}`.trim() })) || [],
      year: work.published?.['date-parts']?.[0]?.[0] || 0,
      journal: work['container-title']?.[0] || ""
    };
  } catch (error) {
    console.error("Error fetching metadata from Crossref:", error);
    return null;
  }
}
