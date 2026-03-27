'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import { useState } from 'react';
import { FileText, Lightbulb, Loader2, Pen } from 'lucide-react';
import { processEditorAction } from '@/app/actions/ia';

interface EditorBubbleMenuProps {
  editor: Editor;
}

type InlineAction = 'explain' | 'summarize' | 'continue';

const ACTIONS: Array<{
  id: InlineAction;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: 'explain', label: 'Explicar', icon: <Lightbulb size={13} /> },
  { id: 'summarize', label: 'Resumir', icon: <FileText size={13} /> },
  { id: 'continue', label: 'Continuar', icon: <Pen size={13} /> },
];

const ACTION_LABELS: Record<InlineAction, string> = {
  explain: 'IA – Explicación',
  summarize: 'IA – Resumen',
  continue: 'IA – Continuación',
};

const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  const [running, setRunning] = useState<InlineAction | null>(null);

  const handleAction = async (action: InlineAction) => {
    const { from, to } = editor.state.selection;
    if (from === to) return;

    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;

    setRunning(action);
    try {
      const result = await processEditorAction(selectedText, action);
      editor
        .chain()
        .focus()
        .setTextSelection(to)
        .insertContent(
          `<p><strong>[${ACTION_LABELS[action]}]</strong> ${result}</p>`
        )
        .run();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error desconocido en la IA.';
      editor
        .chain()
        .focus()
        .setTextSelection(to)
        .insertContent(`<p><em style="color:red">[Error IA: ${msg}]</em></p>`)
        .run();
    } finally {
      setRunning(null);
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top-start' }}
      className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
    >
      {ACTIONS.map(({ id, label, icon }) => (
        <button
          key={id}
          onClick={() => handleAction(id)}
          disabled={!!running}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400"
        >
          {running === id ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            icon
          )}
          {label}
        </button>
      ))}
    </BubbleMenu>
  );
};

export default EditorBubbleMenu;
