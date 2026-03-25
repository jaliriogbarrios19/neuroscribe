'use server'

import { AcademicWork, ResearchResponse } from "@/types/research";
import { formatToAPA } from "@/lib/utils/citation";
import { verifyDOIWithCrossref } from "@/lib/utils/verify";

const CONTACT_EMAIL = "hola@neuroscribe.app"; // Email para Polite Pool de OpenAlex y Crossref
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// --- Tipos locales para respuestas de APIs externas ---

interface OpenAlexWorkRaw {
  doi?: string;
  display_name?: string;
  title?: string;
  publication_year?: number;
  relevance_score?: number;
  host_venue?: { display_name?: string };
  open_access?: { oa_url?: string };
  authorships?: Array<{ author: { display_name: string } }>;
}

interface PubMedArticleId {
  idtype: string;
  value: string;
}

interface PubMedAuthorRaw {
  name: string;
}

interface PubMedArticleRaw {
  title: string;
  pubdate: string;
  fulljournalname?: string;
  source?: string;
  articleids?: PubMedArticleId[];
  authors?: PubMedAuthorRaw[];
}

/**
 * Orquestador principal de búsqueda académica (PubMed + OpenAlex).
 * Implementa de-duplicación basada en DOI.
 */
export async function getAcademicData(query: string): Promise<AcademicWork[]> {
  try {
    const [openAlexResults, pubMedResults] = await Promise.all([
      fetchOpenAlex(query),
      fetchPubMed(query)
    ]);

    // Combinar y eliminar duplicados basados en DOI
    const combined = [...openAlexResults, ...pubMedResults];
    const uniqueMap = new Map<string, AcademicWork>();

    combined.forEach(work => {
      if (work.doi) {
        // Normalizar DOI a formato limpio
        const cleanDoi = work.doi.replace(/https?:\/\/(dx\.)?doi\.org\//, '').toLowerCase();
        if (!uniqueMap.has(cleanDoi)) {
          uniqueMap.set(cleanDoi, work);
        }
      }
    });

    return Array.from(uniqueMap.values())
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, 10); // Retornar los 10 mejores
  } catch (error) {
    console.error("Error in academic orchestration:", error);
    return [];
  }
}

/**
 * Fetcher para OpenAlex (Catálogo Abierto masivo).
 */
async function fetchOpenAlex(query: string): Promise<AcademicWork[]> {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&mailto=${CONTACT_EMAIL}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return data.results.map((work: OpenAlexWorkRaw) => ({
      doi: work.doi || "",
      title: work.display_name || work.title,
      authors: work.authorships?.map((a) => ({ name: a.author.display_name })) || [],
      year: work.publication_year,
      journal: work.host_venue?.display_name,
      abstract: "", 
      relevance_score: work.relevance_score || 0,
      url: work.open_access?.oa_url || work.doi
    }));
  } catch (error) {
    console.error("OpenAlex Fetch Error:", error);
    return [];
  }
}

/**
 * Fetcher para PubMed (Rigor Clínico).
 */
async function fetchPubMed(query: string): Promise<AcademicWork[]> {
  const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=10`;
  
  try {
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist;

    if (!ids || ids.length === 0) return [];

    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();

    return ids.map((id: string) => {
      const item = summaryData.result[id] as PubMedArticleRaw;
      const doi = item.articleids?.find((aid: PubMedArticleId) => aid.idtype === "doi")?.value || "";
      
      return {
        doi: doi ? `https://doi.org/${doi}` : "",
        title: item.title,
        authors: item.authors?.map((a: PubMedAuthorRaw) => ({ name: a.name })) || [],
        year: parseInt(item.pubdate) || 0,
        journal: item.fulljournalname || item.source,
        abstract: "", 
        relevance_score: 0.8, 
        url: doi ? `https://doi.org/${doi}` : `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    });
  } catch (error) {
    console.error("PubMed Fetch Error:", error);
    return [];
  }
}

/**
 * Acción para generar la síntesis científica con Llama 3.1 405b.
 * Implementa Fact-Checking con Crossref y formateo APA con citation-js.
 */
export async function generateScienceSynthesis(query: string, works: AcademicWork[]): Promise<ResearchResponse> {
  if (!OPENROUTER_KEY) {
    throw new Error("OPENROUTER_API_KEY no configurada");
  }

  const context = works.map((w, i) => `[${i+1}] ${w.title} (${w.year}). DOI: ${w.doi}\nAbstract: ${w.abstract || "No disponible"}`).join("\n\n");

  const prompt = `
    Eres el Agente Investigador de NeuroScribe. Tu tarea es responder a la siguiente consulta médica/científica utilizando EXCLUSIVAMENTE los artículos proporcionados abajo.
    
    CONSULTA: "${query}"
    
    ARTÍCULOS DISPONIBLES:
    ${context}
    
    REGLAS ESTRICTAS:
    1. Responde de forma profesional y técnica.
    2. Cada afirmación DEBE estar respaldada por uno o más de los artículos.
    3. Para citar, usa ÚNICAMENTE el formato [DOI:tu_doi_aqui]. Ejemplo: "El uso de IA reduce errores diagnósticos [DOI:10.1001/jama.2024.123]".
    4. NO inventes información ni DOIs. Si la información no está en los artículos, indica que no se encontró evidencia suficiente.
    5. No incluyas una sección de bibliografía al final, solo las citas en el texto.
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://neuroscribe.app",
        "X-Title": "NeuroScribe Research Agent"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-405b-instruct",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3
      })
    });

    const data = await response.json();
    let synthesis = data.choices?.[0]?.message?.content || "";

    const doiRegex = /\[DOI:(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\]/gi;
    const matches = Array.from(synthesis.matchAll(doiRegex)) as RegExpExecArray[];
    
    const processedReferences = new Map<string, string>();
    
    for (const match of matches) {
      const fullMatch = match[0];
      const doi = match[1];

      const isValid = await verifyDOIWithCrossref(doi);
      
      if (isValid) {
        const apa = await formatToAPA(doi);
        synthesis = synthesis.replaceAll(fullMatch, apa.inText);
        processedReferences.set(doi, apa.reference);
      } else {
        synthesis = synthesis.replaceAll(fullMatch, "(Cita no verificada)");
      }
    }

    // Añadir sección de Referencias al final
    if (processedReferences.size > 0) {
      const referenceList = Array.from(processedReferences.values())
        .sort()
        .map(ref => `<p class="apa-reference">${ref}</p>`)
        .join("");
      
      synthesis += `<br/><h3>Referencias</h3>${referenceList}`;
    }

    return {
      synthesis,
      sources: works,
      validated: true
    };
  } catch (error) {
    console.error("Error generating synthesis:", error);
    throw error;
  }
}
