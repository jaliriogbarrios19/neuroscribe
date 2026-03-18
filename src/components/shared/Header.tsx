'use client'

import { Mic, Search, Settings, User, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getProfile, Profile } from "@/app/actions/profiles";
import { cn } from "@/lib/utils/cn";

interface HeaderProps {
  onTranscriptionClick?: () => void;
  onResearchClick?: () => void;
}

const Header = ({ onTranscriptionClick, onResearchClick }: HeaderProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [trialDays, setTrialDays] = useState<number | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        
        // Calcular días de trial
        const start = new Date(p.trial_start_date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const remaining = 30 - diffDays;
        setTrialDays(remaining > 0 ? remaining : 0);
      }
    }
    loadProfile();
  }, []);

  return (
    <header className="flex-none border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      <div className="mx-auto flex h-16 w-full items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white font-bold">
              NS
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
              NeuroScribe
            </span>
          </Link>

          {/* License Badge */}
          {profile && (
            <div className="ml-2">
              {profile.is_activated ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                  <ShieldCheck size={12} />
                  LICENCIA ACTIVA
                </div>
              ) : (
                <Link href="/settings/license" className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border transition-all hover:shadow-sm",
                  trialDays !== null && trialDays <= 7 
                    ? "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                    : "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
                )}>
                  <Clock size={12} />
                  PRUEBA: {trialDays} DÍAS RESTANTES
                </Link>
              )}
            </div>
          )}
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={onTranscriptionClick}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
          >
            <Mic size={18} />
            Transcripción
          </button>
          <button 
            onClick={onResearchClick}
            className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors"
          >
            <Search size={18} />
            Investigación
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/settings" className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
            <Settings size={20} />
          </Link>
          <button className="p-2 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 border border-zinc-200 rounded-full dark:border-zinc-700 transition-colors">
            <User size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
