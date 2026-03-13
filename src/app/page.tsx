'use client'

import Editor from "@/components/editor/Editor";
import Sidebar from "@/components/shared/Sidebar";
import AudioUploader from "@/components/transcription/AudioUploader";
import { Mic, Search, Settings, User, X, Loader2, Save } from "lucide-react";
import { useState } from "react";
import { saveDocument } from "@/app/actions/documents";

export default function Home() {
  const [editorContent, setEditorContent] = useState<string>("");
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDocTitle, setCurrentDocTitle] = useState("Nuevo Documento");
  const [currentDocId, setCurrentDocId] = useState<string | undefined>(undefined);

  const handleTranscriptionComplete = (text: string) => {
    setEditorContent(text);
    setIsUploaderOpen(false);
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
    <div className="flex flex-col h-screen bg-zinc-50 font-sans dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Dashboard Header */}
      <header className="flex-none border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white font-bold">
              NS
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NeuroScribe
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => setIsUploaderOpen(true)}
              className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
            >
              <Mic size={18} />
              Transcripción
            </button>
            <button className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors">
              <Search size={18} />
              Investigación
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200">
              <Settings size={20} />
            </button>
            <button className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 rounded-full dark:border-zinc-700">
              <User size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Workspace */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-6 lg:p-10 relative">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex-1">
                <input 
                  type="text" 
                  value={currentDocTitle}
                  onChange={(e) => setCurrentDocTitle(e.target.value)}
                  className="text-2xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
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
          </div>

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
        </main>
      </div>
    </div>
  );
}
