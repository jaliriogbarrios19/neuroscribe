'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

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
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [researchContent, setResearchContent] = useState<string | null>(null);
  const [transcriptionContent, setTranscriptionContent] = useState<string | null>(null);

  const injectResearchContent = (content: string) => {
    setResearchContent(content);
  };

  const clearResearchContent = () => {
    setResearchContent(null);
  };

  const injectTranscriptionContent = (content: string) => {
    setTranscriptionContent(content);
  };

  const clearTranscriptionContent = () => {
    setTranscriptionContent(null);
  };

  return (
    <UIContext.Provider value={{ 
      isResearchOpen, 
      setIsResearchOpen, 
      isUploaderOpen,
      setIsUploaderOpen,
      researchContent, 
      injectResearchContent, 
      clearResearchContent,
      transcriptionContent,
      injectTranscriptionContent,
      clearTranscriptionContent
    }}>
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
