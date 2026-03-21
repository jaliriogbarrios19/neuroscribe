'use client'

import { Folder, FolderPlus, Search, User, Loader2, Plus, X, Cpu } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { getFolders, createFolder } from "@/app/actions/folders";
import { getProfile } from "@/app/actions/profiles";
import IAStatus from "./IAStatus";

const Sidebar = () => {
  const [folders, setFolders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [foldersData, profileData] = await Promise.all([
        getFolders(),
        getProfile()
      ]);
      setFolders(foldersData);
      setProfile(profileData);
    } catch (error) {
      console.error("Error fetching sidebar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setCreating(true);
    try {
      await createFolder(newFolderName);
      setNewFolderName("");
      setIsModalOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      console.error("Error creating folder:", error);
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 flex flex-col h-[calc(100vh-64px)] dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar carpetas..."
            className="w-full rounded-md border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Carpetas y Pacientes
          </h3>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={16} className="animate-spin text-zinc-400" />
          </div>
        ) : (
          <nav className="space-y-1">
            {folders.map((folder) => (
              <button
                key={folder.id}
                className="group flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Folder size={16} className="text-zinc-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="truncate">{folder.name}</span>
                </div>
                <span className="rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                  {folder.count}
                </span>
              </button>
            ))}
            {folders.length === 0 && (
              <p className="text-[10px] text-center text-zinc-500 mt-4">No hay carpetas. Crea la primera.</p>
            )}
          </nav>
        )}
      </div>

      <div className="px-4 mb-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2 px-2">
          Configuración
        </h3>
        <nav className="space-y-1">
          <Link
            href="/settings/models"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <Cpu size={14} className="text-zinc-400" />
            <span>Gestor de Modelos</span>
          </Link>
          <Link
            href="/settings/license"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <User size={14} className="text-zinc-400" />
            <span>Licencia</span>
          </Link>
        </nav>
      </div>

      <div className="px-4 mb-4">
        <IAStatus />
      </div>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold dark:bg-indigo-900/30">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-900 truncate dark:text-zinc-200">
              {profile?.full_name || profile?.email || "Usuario"}
            </p>
            <p className="text-[10px] text-zinc-500 truncate dark:text-zinc-400">
              Saldo: {profile?.minutes_balance || 0} min / {profile?.cc_balance || 0} CC
            </p>
          </div>
        </div>
      </div>

      {/* Modal Nueva Carpeta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold">Nueva Carpeta o Paciente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateFolder}>
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Nombre del paciente o proyecto..."
                className="w-full rounded-md border border-zinc-200 bg-zinc-50 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-4"
              />
              <button
                type="submit"
                disabled={creating || !newFolderName.trim()}
                className="w-full py-2 rounded-lg bg-indigo-600 text-white font-medium text-xs flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Crear Carpeta
              </button>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
