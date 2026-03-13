'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

const Editor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: `
      <h2>Bienvenido a NeuroScribe</h2>
      <p>Este es el editor profesional diseñado para transcripciones clínicas e investigación científica.</p>
      <ul>
        <li><strong>Precisión APA 7:</strong> Citación automática.</li>
        <li><strong>Transcripción IA:</strong> Integrada con Whisper.</li>
      </ul>
    `,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[500px]',
      },
    },
  })

  return (
    <div className="bg-white p-8 shadow-lg border border-gray-100 rounded-lg max-w-4xl mx-auto mt-10">
      <EditorContent editor={editor} />
    </div>
  )
}

export default Editor
