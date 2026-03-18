'use client'

import Header from "@/components/shared/Header";
import Sidebar from "@/components/shared/Sidebar";
import ResearchSidebar from "@/components/research/ResearchSidebar";
import { useUI } from "@/hooks/useUI";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const { isResearchOpen, setIsResearchOpen, injectResearchContent } = useUI();

  return (
    <div className="flex flex-col h-screen bg-zinc-50 font-sans dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      <Header onResearchClick={() => setIsResearchOpen(true)} />
      
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
      </div>
    </div>
  );
}
