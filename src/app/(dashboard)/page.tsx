'use client';

import Editor from '@/components/editor/Editor';
import { Loader2, Save, Sparkles, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { saveDocument } from '@/app/actions/documents';
import { generateSummaryLocal } from '@/app/actions/ia';
import { useUI } from '@/hooks/useUI';

export default function DashboardPage() {
  const { activeDocument, clearActiveDocument, activeFolder } = useUI();

  const [editorContent, setEditorContent] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [currentDocTitle, setCurrentDocTitle] = useState('Nuevo Documento');
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(
    undefined
  );

  /** When a document is opened from FolderView, load it into the editor. */
  useEffect(() => {
    if (activeDocument) {
      setCurrentDocId(activeDocument.id);
      setCurrentDocTitle(activeDocument.title);
      setEditorContent(activeDocument.content);
      clearActiveDocument();
    }
  }, [activeDocument, clearActiveDocument]);

  const handleGenerateSummary = async () => {
    if (!editorContent.trim()) return;
    setIsAnalyzing(true);
    try {
      const summary = await generateSummaryLocal(editorContent, 'summary');
      setEditorContent(
        (prev: string) =>
          `${prev}<br/><hr/><br/><h2>Resumen Clínico (IA Local)</h2>${summary}`
      );
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Error al generar el resumen clínico local.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const doc = await saveDocument({
        id: currentDocId,
        folder_id: activeFolder?.id,
        title: currentDocTitle,
        content: editorContent,
        type: 'transcript',
      });
      setCurrentDocId(doc.id);
      setSavedFeedback(true);
      setTimeout(() => setSavedFeedback(false), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar el documento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            value={currentDocTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentDocTitle(e.target.value)
            }
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0 dark:text-white"
            placeholder="Título del documento..."
          />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            {activeFolder ? (
              <span>
                📁 <span className="font-medium">{activeFolder.name}</span>
                {currentDocId ? ' · Editando' : ' · Borrador sin guardar'}
              </span>
            ) : currentDocId ? (
              'Editando...'
            ) : (
              'Borrador sin guardar'
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGenerateSummary}
            disabled={isAnalyzing || !editorContent.trim()}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-indigo-400 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Sparkles size={18} className="mr-2" />
            )}
            {isAnalyzing ? 'Analizando...' : 'Generar Resumen'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700 disabled:opacity-50"
          >
            {savedFeedback ? (
              <CheckCircle2 size={18} className="mr-2" />
            ) : isSaving ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Save size={18} className="mr-2" />
            )}
            {savedFeedback
              ? '¡Guardado!'
              : isSaving
                ? 'Guardando...'
                : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <section className="relative rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-h-[700px] overflow-hidden rounded-xl">
          <Editor content={editorContent} onChange={setEditorContent} />
        </div>
      </section>
    </div>
  );
}
