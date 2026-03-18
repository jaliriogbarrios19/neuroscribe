'use client'

import Editor from "@/components/editor/Editor";
import AudioUploader from "@/components/transcription/AudioUploader";
import { X, Loader2, Save, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { saveDocument } from "@/app/actions/documents";
import { generateSummaryLocal } from "@/app/actions/ia";

export default function DashboardPage() {
  const [editorContent, setEditorContent] = useState<string>("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentDocTitle, setCurrentDocTitle] = useState("Nuevo Documento");
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(undefined);

  const handleTranscriptionComplete = (text: string) => {
    setEditorContent(text);
    setIsUploaderOpen(false);
  };

  const handleGenerateSummary = async () => {
    if (!editorContent.trim()) return;
    setIsAnalyzing(true);
    try {
      const summary = await generateSummaryLocal(editorContent, 'summary');
      // Añadir el resumen al final del contenido actual
      setEditorContent(prev => `${prev}<br/><hr/><br/><h2>Resumen Clínico (IA Local)</h2>${summary}`);
    } catch (error) {
      console.error("Error generating summary:", error);
      alert("Error al generar el resumen clínico local.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const doc = await saveDocument({
        id: currentDocId,
        title: currentDocTitle,
        content: editorContent,
        type: 'transcript'
      });
      setCurrentDocId(doc.id);
      alert("¡Documento guardado con éxito!");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error al guardar el documento.");
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
            onChange={(e) => setCurrentDocTitle(e.target.value)}
            className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0 dark:text-white"
            placeholder="Título del documento..."
          />
          <p className="text-zinc-500 dark:text-zinc-400">
            {currentDocId ? "Editando..." : "Borrador sin guardar"}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsUploaderOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Subir Audio
          </button>
          <button 
            onClick={handleGenerateSummary}
            disabled={isAnalyzing || !editorContent.trim()}
            className="inline-flex items-center justify-center rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-indigo-600 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-indigo-400 dark:hover:bg-zinc-800 disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={18} className="animate-spin mr-2" /> : <Sparkles size={18} className="mr-2" />}
            {isAnalyzing ? "Analizando..." : "Generar Resumen"}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-700 disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="mr-2" />}
            {isSaving ? "Guardando..." : "Guardar Cambios"}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <section className="relative rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="min-h-[700px] overflow-hidden rounded-xl">
           <Editor content={editorContent} onChange={setEditorContent} />
        </div>
      </section>

      {/* Audio Uploader Overlay */}
      {isUploaderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Nueva Transcripción</h3>
              <button 
                onClick={() => setIsUploaderOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800"
              >
                <X size={20} />
              </button>
            </div>
            <AudioUploader onTranscriptionComplete={handleTranscriptionComplete} />
          </div>
        </div>
      )}
    </div>
  );
}
