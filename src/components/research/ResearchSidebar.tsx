'use client';

import { useState } from 'react';
import {
  Search,
  Loader2,
  BookOpen,
  ExternalLink,
  Sparkles,
  X,
  FileText,
  Zap,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import {
  getAcademicData,
  generateScienceSynthesis,
  generateQuickAnswer,
} from '@/app/actions/research';
import { AcademicWork } from '@/types/research';
import { cn } from '@/lib/utils/cn';

interface ResearchSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertResult: (content: string) => void;
}

const ResearchSidebar = ({
  isOpen,
  onClose,
  onInsertResult,
}: ResearchSidebarProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AcademicWork[]>([]);
  const [loading, setLoading] = useState(false);
  const [synthesizing, setSynthesizing] = useState(false);
  const [highPrecision, setHighPrecision] = useState(false);

  const [domain, setDomain] = useState<'medicine' | 'psychology'>('psychology');
  const [researchMode, setResearchMode] = useState<'quick' | 'full'>('quick');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await getAcademicData(query, highPrecision);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (results.length === 0) return;

    setSynthesizing(true);
    try {
      if (researchMode === 'quick') {
        const response = await generateQuickAnswer(query, results, domain);
        onInsertResult(response.synthesis);
      } else {
        const response = await generateScienceSynthesis(query, results, domain);
        onInsertResult(response.synthesis);
      }
    } catch (error) {
      console.error('Synthesis error:', error);
      alert('Error al generar la síntesis científica.');
    } finally {
      setSynthesizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-96 border-l border-zinc-200 bg-white shadow-2xl transition-transform dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-600" />
            <h2 className="text-lg font-bold">Investigación</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Area */}
        <div className="p-4">
          <form onSubmit={handleSearch} className="relative">
            <Search size={16} className="absolute left-3 top-3 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar evidencia científica..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </form>

          {/* Precision Toggle */}
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ShieldCheck
                size={14}
                className={cn(
                  highPrecision ? 'text-emerald-500' : 'text-zinc-400'
                )}
              />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                Alta Precisión (MeSH)
              </span>
            </div>
            <button
              onClick={() => setHighPrecision(!highPrecision)}
              className={cn(
                'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
                highPrecision
                  ? 'bg-emerald-500'
                  : 'bg-zinc-200 dark:bg-zinc-700'
              )}
            >
              <span
                className={cn(
                  'inline-block h-3 w-3 transform rounded-full bg-white transition-transform',
                  highPrecision ? 'translate-x-5' : 'translate-x-1'
                )}
              />
            </button>
          </div>

          {/* Domain Selector */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setDomain('psychology')}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all',
                domain === 'psychology'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              PSICOLOGÍA
            </button>
            <button
              onClick={() => setDomain('medicine')}
              className={cn(
                'flex-1 rounded-lg py-1.5 text-[10px] font-bold transition-all',
                domain === 'medicine'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
              )}
            >
              MEDICINA
            </button>
          </div>

          {/* Mode Selector */}
          <div className="mt-2 flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-900">
            <button
              onClick={() => setResearchMode('quick')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium transition-all',
                researchMode === 'quick'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              )}
            >
              <Zap size={12} />
              Respuesta Rápida
            </button>
            <button
              onClick={() => setResearchMode('full')}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-medium transition-all',
                researchMode === 'full'
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-indigo-400'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              )}
            >
              <FileText size={12} />
              Paper Completo
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 pt-0">
          {loading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 size={24} className="animate-spin text-indigo-600" />
              <p className="text-xs">
                Consultando el Triángulo de la Verdad...
              </p>
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-4">
              {results.map((work, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-colors hover:border-indigo-200 dark:border-zinc-800 dark:bg-zinc-800/50"
                >
                  <h3 className="mb-1 text-sm font-bold leading-tight text-zinc-900 dark:text-white">
                    {work.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="font-medium text-zinc-500">
                      {work.year}
                    </span>
                    <span className="truncate text-indigo-600 dark:text-indigo-400">
                      {work.journal}
                    </span>
                  </div>

                  {/* MeSH Terms display if any */}
                  {work.mesh_terms && work.mesh_terms.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {work.mesh_terms.slice(0, 3).map((term, i) => (
                        <span
                          key={i}
                          className="flex items-center gap-0.5 rounded bg-zinc-100 dark:bg-zinc-700 px-1 py-0.5 text-[8px] text-zinc-500 dark:text-zinc-400"
                        >
                          <Tag size={8} /> {term}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <a
                      href={work.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-indigo-600"
                    >
                      <ExternalLink size={12} />
                      Ver Fuente
                    </a>
                    {work.url?.includes('.pdf') && (
                      <span className="flex items-center gap-1 rounded bg-green-100 px-1.5 py-0.5 text-[9px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <FileText size={10} />
                        OPEN ACCESS
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-20 text-center text-zinc-400">
              <p className="text-sm italic">
                Haz una pregunta para buscar evidencia rigurosa en PubMed y
                OpenAlex.
              </p>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {results.length > 0 && (
          <div className="border-t border-zinc-200 p-4 dark:border-zinc-800 bg-white/80 backdrop-blur dark:bg-zinc-900/80">
            <button
              onClick={handleSynthesize}
              disabled={synthesizing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {synthesizing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              {synthesizing
                ? 'Procesando Evidencia...'
                : researchMode === 'quick'
                  ? 'Generar Respuesta Rápida'
                  : 'Redactar Paper Completo'}
            </button>
            <p className="mt-2 text-center text-[9px] text-zinc-400 uppercase tracking-widest">
              Garantizado por Crossref Fact-Checking
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ResearchSidebar;
