import { Cite } from 'citation-js';
import { CitationResult } from '@/types/research';

/**
 * Formatea un DOI o metadatos JSON a APA 7 utilizando citation-js.
 */
export async function formatToAPA(input: string | object): Promise<CitationResult> {
  try {
    const cite = new Cite(input);

    // Formato de referencia completa (APA 7)
    const reference = cite.format('bibliography', {
      format: 'html',
      template: 'apa',
      lang: 'es-ES'
    });

    // Formato de cita en el texto (Smith, 2023)
    const inText = cite.format('citation', {
      template: 'apa',
      lang: 'es-ES'
    });

    // Formatos adicionales para exportación
    const bibtex = cite.format('bibtex');
    const ris = cite.format('ris');

    return {
      inText,
      reference,
      bibtex,
      ris
    };
  } catch (error) {
    console.error('Error formatting citation:', error);
    throw new Error('No se pudo formatear la cita académica.');
  }
}

/**
 * Valida un DOI mediante una búsqueda rápida en el motor de citation-js.
 */
export async function validateDOI(doi: string): Promise<boolean> {
  try {
    const cite = new Cite(doi);
    return cite.data.length > 0;
  } catch {
    return false;
  }
}
