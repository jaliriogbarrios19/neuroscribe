'use client';

import { useMemo, useState } from 'react';
import React from 'react';
import {
  User,
  Stethoscope,
  ArrowRight,
  Loader2,
  ClipboardList,
  ChevronDown,
} from 'lucide-react';
import { generateSummaryLocal } from '@/app/actions/ia';
import { cn } from '@/lib/utils/cn';

export type SpeakerRole = 'doctor' | 'patient' | 'other';

interface SpeakerAssignment {
  label: string;
  role: SpeakerRole;
}

interface SpeakerPanelProps {
  rawTranscription: string;
  onComplete: (processedContent: string) => void;
  onCancel: () => void;
}

const ROLE_OPTIONS: {
  value: SpeakerRole;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'doctor',
    label: 'Doctor / Terapeuta',
    icon: <Stethoscope size={14} />,
  },
  { value: 'patient', label: 'Paciente', icon: <User size={14} /> },
  { value: 'other', label: 'Otro', icon: <User size={14} /> },
];

const CLINICAL_TEMPLATES = [
  {
    id: 'psych_session',
    label: 'Nota de Sesión Psicológica',
    prompt:
      'Genera una nota clínica psicológica estructurada con: Motivo de consulta, Observaciones del paciente, Intervenciones realizadas, Plan de seguimiento. Usa formato APA y lenguaje clínico profesional.',
  },
  {
    id: 'medical_consult',
    label: 'Consulta Médica General',
    prompt:
      'Genera un informe de consulta médica con: Anamnesis, Exploración, Diagnóstico diferencial, Plan terapéutico. Sigue el formato SOAP (Subjetivo, Objetivo, Análisis, Plan).',
  },
  {
    id: 'intake',
    label: 'Historia Clínica (Primera Vez)',
    prompt:
      'Genera una historia clínica completa de primera consulta con: Datos personales, Motivo de consulta, Historia de la enfermedad actual, Antecedentes, Exploración, Impresión diagnóstica.',
  },
  {
    id: 'followup',
    label: 'Nota de Seguimiento',
    prompt:
      'Genera una nota de seguimiento breve y concisa con: Evolución desde última consulta, Estado actual, Ajustes al plan de tratamiento.',
  },
  {
    id: 'raw',
    label: 'Solo Limpiar y Formatear',
    prompt:
      'Formatea y limpia la transcripción: organiza el diálogo, corrige mayúsculas y puntuación, identifica los turnos de habla. No añadas información que no esté en el original.',
  },
];

/** Detecta los hablantes únicos en una transcripción usando el prefijo "Speaker N:". */
function detectSpeakers(text: string): string[] {
  const pattern = /\b(Speaker\s+\d+|Hablante\s+\d+|SPEAKER_\d+)\b/gi;
  const found = new Set<string>();
  let m;
  while ((m = pattern.exec(text)) !== null) {
    found.add(m[0]);
  }
  if (found.size === 0) {
    // Si no hay etiquetas, asumimos al menos 2 hablantes genéricos
    found.add('Speaker 1');
    found.add('Speaker 2');
  }
  return Array.from(found).sort();
}

const SpeakerPanel = ({
  rawTranscription,
  onComplete,
  onCancel,
}: SpeakerPanelProps) => {
  const speakers = useMemo(
    () => detectSpeakers(rawTranscription),
    [rawTranscription]
  );
  const [assignments, setAssignments] = useState<
    Record<string, SpeakerAssignment>
  >(
    Object.fromEntries(
      speakers.map((s, i) => [
        s,
        { label: s, role: (i === 0 ? 'doctor' : 'patient') as SpeakerRole },
      ])
    )
  );
  const [selectedTemplate, setSelectedTemplate] = useState(
    CLINICAL_TEMPLATES[0].id
  );
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (speaker: string, role: SpeakerRole) => {
    setAssignments(prev => ({
      ...prev,
      [speaker]: { ...prev[speaker], role },
    }));
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    try {
      // Reemplazar etiquetas de hablantes con roles asignados
      let labeled = rawTranscription;
      Object.entries(assignments).forEach(([speaker, assignment]) => {
        const roleLabel =
          ROLE_OPTIONS.find(r => r.value === assignment.role)?.label || speaker;
        labeled = labeled.replaceAll(speaker, `**${roleLabel}**`);
      });

      const template = CLINICAL_TEMPLATES.find(t => t.id === selectedTemplate);
      const fullPrompt = template
        ? `${template.prompt}\n\nTranscripción:\n${labeled}`
        : labeled;

      const result = await generateSummaryLocal(fullPrompt, 'summary');

      // Inyectar al editor con cabecera de sesión
      const date = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const header = `<h2>${template?.label ?? 'Transcripción Clínica'}</h2><p><em>Fecha: ${date}</em></p><hr/>`;
      onComplete(`${header}${result}`);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Error procesando transcripción.';
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Speaker Assignment */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
          Asignación de Hablantes
        </h4>
        <div className="space-y-2">
          {speakers.map(speaker => (
            <div
              key={speaker}
              className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <span className="flex-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
                {speaker}
              </span>
              <div className="relative">
                <select
                  value={assignments[speaker]?.role ?? 'other'}
                  onChange={e =>
                    handleRoleChange(speaker, e.target.value as SpeakerRole)
                  }
                  className="appearance-none rounded-md border border-zinc-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium focus:border-indigo-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  {ROLE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={12}
                  className="pointer-events-none absolute right-2 top-2 text-zinc-400"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Template Selector */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-2">
          <ClipboardList size={12} />
          Plantilla Clínica
        </h4>
        <div className="grid grid-cols-1 gap-2">
          {CLINICAL_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => setSelectedTemplate(tpl.id)}
              className={cn(
                'rounded-lg border px-3 py-2 text-left text-xs font-medium transition-all',
                selectedTemplate === tpl.id
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-900/20 dark:text-indigo-300'
                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              )}
            >
              {tpl.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
        <button
          onClick={handleProcess}
          disabled={processing}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {processing ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ArrowRight size={14} />
          )}
          {processing ? 'Procesando...' : 'Generar Nota Clínica'}
        </button>
      </div>
    </div>
  );
};

export default SpeakerPanel;
