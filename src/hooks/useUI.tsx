'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from 'react';

/** Documento minimal para pasar desde el explorador al editor. */
export interface OpenableDocument {
  id: string;
  title: string;
  content: string;
}

interface UIContextType {
  isResearchOpen: boolean;
  setIsResearchOpen: (open: boolean) => void;
  isUploaderOpen: boolean;
  setIsUploaderOpen: (open: boolean) => void;
  researchContent: string | null;
  injectResearchContent: (content: string) => void;
  clearResearchContent: () => void;
  transcriptionContent: string | null;
  injectTranscriptionContent: (content: string) => void;
  clearTranscriptionContent: () => void;
  /** Carpeta activa en la sidebar — null = sin filtro */
  activeFolder: { id: string; name: string } | null;
  setActiveFolder: (folder: { id: string; name: string } | null) => void;
  /** Documento actualmente cargado en el editor */
  activeDocument: OpenableDocument | null;
  openDocument: (doc: OpenableDocument) => void;
  clearActiveDocument: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [researchContent, setResearchContent] = useState<string | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<
    string | null
  >(null);
  const [activeFolder, setActiveFolder] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [activeDocument, setActiveDocument] = useState<OpenableDocument | null>(
    null
  );

  const injectResearchContent = useCallback((content: string) => {
    setResearchContent(content);
  }, []);

  const clearResearchContent = useCallback(() => {
    setResearchContent(null);
  }, []);

  const injectTranscriptionContent = useCallback((content: string) => {
    setTranscriptionContent(content);
  }, []);

  const clearTranscriptionContent = useCallback(() => {
    setTranscriptionContent(null);
  }, []);

  const openDocument = useCallback((doc: OpenableDocument) => {
    setActiveDocument(doc);
  }, []);

  const clearActiveDocument = useCallback(() => {
    setActiveDocument(null);
  }, []);

  return (
    <UIContext.Provider
      value={{
        isResearchOpen,
        setIsResearchOpen,
        isUploaderOpen,
        setIsUploaderOpen,
        researchContent,
        injectResearchContent,
        clearResearchContent,
        transcriptionContent,
        injectTranscriptionContent,
        clearTranscriptionContent,
        activeFolder,
        setActiveFolder,
        activeDocument,
        openDocument,
        clearActiveDocument,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}
