'use client'

import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import ResearchSidebar from "@/components/research/ResearchSidebar";
import AudioUploader from "@/components/transcription/AudioUploader";
import { useUI } from "@/hooks/useUI";
import { X, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { checkModelStatus, ModelStatus } from "@/app/actions/ia";
import Link from "next/link";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [modelStatus, setModelStatus] = useState<ModelStatus | null>(null);

  useEffect(() => {
    checkModelStatus().then(setModelStatus).catch(console.error);
  }, []);
  const { 
    isResearchOpen, 
    setIsResearchOpen, 
    injectResearchContent,
    isUploaderOpen,
    setIsUploaderOpen,
    injectTranscriptionContent
  } = useUI();

  const handleTranscriptionComplete = (text: string) => {
    injectTranscriptionContent(text);
    setIsUploaderOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-50 font-sans dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      <Header 
        onResearchClick={() => setIsResearchOpen(true)} 
        onTranscriptionClick={() => setIsUploaderOpen(true)}
      />
      
      {modelStatus && !modelStatus.whisper_ready && !modelStatus.llama_ready && !modelStatus.biomed_ready && (
        <div className="bg-indigo-600 dark:bg-indigo-900 text-white px-6 py-2.5 text-xs flex items-center justify-between shadow-md z-40 relative">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-indigo-200" />
            <span className="font-medium">NeuroScribe IA Local: Requiere descargar los cerebros (modelos) iniciales para poder transcribir y analizar.</span>
          </div>
          <Link href="/settings/models" className="font-bold underline hover:text-indigo-200 shrink-0">
            Ir al Gestor de Modelos &rarr;
          </Link>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto bg-white dark:bg-zinc-950 p-6 lg:p-10 relative">
          {children}
        </main>

        <ResearchSidebar 
          isOpen={isResearchOpen} 
          onClose={() => setIsResearchOpen(false)} 
          onInsertResult={injectResearchContent}
        />

        {/* Audio Uploader Global Overlay */}
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
    </div>
  );
}
