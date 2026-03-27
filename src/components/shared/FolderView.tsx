'use client';

import { useEffect, useState } from 'react';
import {
  X,
  FileText,
  Loader2,
  Trash2,
  FolderOpen,
  Plus,
  Calendar,
} from 'lucide-react';
import {
  getDocuments,
  deleteDocument,
  DocumentEntry,
} from '@/app/actions/documents';
import { useUI } from '@/hooks/useUI';
import { cn } from '@/lib/utils/cn';

const DOC_TYPE_LABELS: Record<string, string> = {
  transcript: 'Transcripción',
  summary: 'Resumen',
  paper: 'Paper',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  transcript: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  summary:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
  paper:
    'bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400',
};

interface FolderViewProps {
  folderId: string;
  folderName: string;
  onClose: () => void;
  onNewDocument: () => void;
}

const FolderView = ({
  folderId,
  folderName,
  onClose,
  onNewDocument,
}: FolderViewProps) => {
  const { openDocument } = useUI();
  const [docs, setDocs] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const result = await getDocuments(folderId);
      setDocs(result);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  const handleOpen = (doc: DocumentEntry) => {
    openDocument({ id: doc.id, title: doc.title, content: doc.content ?? '' });
    onClose();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este documento permanentemente?')) return;
    setDeleting(id);
    try {
      await deleteDocument(id);
      await loadDocs();
    } catch {
      alert('Error al eliminar el documento.');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (raw: string) => {
    try {
      return new Date(raw).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return raw;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen size={18} className="text-indigo-500" />
            <h3 className="font-bold text-zinc-900 dark:text-white">
              {folderName}
            </h3>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              {docs.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 dark:hover:bg-zinc-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Document List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
          ) : docs.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-zinc-400">
              <FileText size={32} className="opacity-30" />
              <p className="text-xs">Esta carpeta no tiene documentos aún.</p>
            </div>
          ) : (
            docs.map(doc => (
              <div
                key={doc.id}
                className="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 transition-all hover:border-indigo-200 hover:bg-white dark:border-zinc-800 dark:bg-zinc-800/50 dark:hover:border-indigo-600/40 dark:hover:bg-zinc-800"
              >
                <button
                  className="flex flex-1 items-start gap-3 text-left"
                  onClick={() => handleOpen(doc)}
                >
                  <div className="mt-0.5 p-1.5 rounded-md bg-white shadow-sm dark:bg-zinc-900">
                    <FileText size={14} className="text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                      {doc.title}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded px-1.5 py-0.5 text-[9px] font-bold uppercase',
                          DOC_TYPE_COLORS[doc.document_type] ??
                            DOC_TYPE_COLORS['transcript']
                        )}
                      >
                        {DOC_TYPE_LABELS[doc.document_type] ??
                          doc.document_type}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-zinc-400">
                        <Calendar size={10} />
                        {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="shrink-0 rounded-md p-1.5 text-zinc-300 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 dark:text-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                >
                  {deleting === doc.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3">
          <button
            onClick={onNewDocument}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
          >
            <Plus size={14} />
            Nueva Transcripción en esta Carpeta
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderView;
