'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  isResearchOpen: boolean;
  setIsResearchOpen: (open: boolean) => void;
  researchContent: string | null;
  injectResearchContent: (content: string) => void;
  clearResearchContent: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export function UIProvider({ children }: { children: ReactNode }) {
  const [isResearchOpen, setIsResearchOpen] = useState(false);
  const [researchContent, setResearchContent] = useState<string | null>(null);

  const injectResearchContent = (content: string) => {
    setResearchContent(content);
  };

  const clearResearchContent = () => {
    setResearchContent(null);
  };

  return (
    <UIContext.Provider value={{ 
      isResearchOpen, 
      setIsResearchOpen, 
      researchContent, 
      injectResearchContent, 
      clearResearchContent 
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
