'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { useUI } from '@/hooks/useUI';
import { APA7 } from './extensions/APA7';

interface EditorProps {
  content?: string;
  onChange?: (content: string) => void;
}

const Editor = ({ content, onChange }: EditorProps) => {
  const {
    researchContent,
    clearResearchContent,
    transcriptionContent,
    clearTranscriptionContent,
  } = useUI();

  const editor = useEditor({
    extensions: [StarterKit, APA7],
    immediatelyRender: false,
    content:
      content ||
      `
      <h2>Bienvenido a NeuroScribe</h2>
      <p>Este es el editor profesional diseñado para transcripciones clínicas e investigación científica.</p>
    `,
    editorProps: {
      attributes: {
        class:
          'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[600px] p-12',
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== undefined && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Listen for research content injections
  useEffect(() => {
    if (editor && researchContent) {
      editor.commands.insertContent(researchContent);
      clearResearchContent();
    }
  }, [researchContent, editor, clearResearchContent]);

  // Listen for transcription content injections
  useEffect(() => {
    if (editor && transcriptionContent) {
      editor.commands.insertContent(transcriptionContent);
      clearTranscriptionContent();
    }
  }, [transcriptionContent, editor, clearTranscriptionContent]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900">
      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
