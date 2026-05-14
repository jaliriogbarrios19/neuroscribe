'use client'

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import type { TranscriptionResult, SpeakerInfo } from "@/types/transcription";
import { updateSpeakerLabel } from "@/app/actions/ia";

interface SpeakerViewProps {
  result: TranscriptionResult | null;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

export default function SpeakerView({ result }: SpeakerViewProps) {
  const [editingSpeaker, setEditingSpeaker] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [speakers, setSpeakers] = useState<SpeakerInfo[]>(result?.speakers || []);

  if (!result || result.segments.length === 0) {
    return result ? (
      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap">{result.full_text}</p>
      </div>
    ) : null;
  }

  const handleStartEdit = (speaker: SpeakerInfo) => {
    setEditingSpeaker(speaker.id);
    setEditValue(speaker.label);
  };

  const handleSaveEdit = async (speakerId: string) => {
    if (!editValue.trim()) return;
    try {
      await updateSpeakerLabel(speakerId, editValue);
      setSpeakers(prev => prev.map(s =>
        s.id === speakerId ? { ...s, label: editValue } : s
      ));
    } catch (err) {
      console.error("Error updating speaker label:", err);
    }
    setEditingSpeaker(null);
  };

  const getSpeakerLabel = (speakerId: string): string => {
    const updated = speakers.find(s => s.id === speakerId);
    if (updated) return updated.label;
    return result.segments.find(s => s.speaker_id === speakerId)?.speaker_label || "Unknown";
  };

  const getSpeakerColor = (speakerId: string): string => {
    const updated = speakers.find(s => s.id === speakerId);
    if (updated) return updated.color;
    return result.segments.find(s => s.speaker_id === speakerId)?.speaker_label ? "#6366f1" : "#a1a1aa";
  };

  const speakerColorStyle = (speakerId: string) => {
    const color = getSpeakerColor(speakerId);
    return {
      borderLeftColor: color,
      backgroundColor: `${color}10`,
    };
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Hablantes</span>
        <span className="text-[10px] text-zinc-400">
          (click en nombre para renombrar)
        </span>
      </div>

      {(() => {
        const uniqueSpeakers = Array.from(new Set(result.segments.map(s => s.speaker_id)));
        return (
          <div className="flex flex-wrap gap-2 mb-4">
            {uniqueSpeakers.map((speakerId) => (
              <div key={speakerId} className="group flex items-center gap-1">
                {editingSpeaker === speakerId ? (
                  <div className="flex items-center gap-1">
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveEdit(speakerId);
                        if (e.key === "Escape") setEditingSpeaker(null);
                      }}
                      className="w-32 rounded border border-indigo-300 px-2 py-0.5 text-xs focus:border-indigo-500 focus:outline-none dark:bg-zinc-800 dark:border-indigo-700"
                    />
                    <button
                      onClick={() => handleSaveEdit(speakerId)}
                      className="p-0.5 text-emerald-500 hover:text-emerald-600"
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const speaker = speakers.find(s => s.id === speakerId);
                      handleStartEdit(speaker || { id: speakerId, label: getSpeakerLabel(speakerId), color: getSpeakerColor(speakerId) });
                    }}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border opacity-90 hover:opacity-100 transition-opacity"
                    style={{
                      color: getSpeakerColor(speakerId),
                      borderColor: getSpeakerColor(speakerId),
                      backgroundColor: `${getSpeakerColor(speakerId)}15`,
                    }}
                  >
                    {getSpeakerLabel(speakerId)}
                    <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      })()}

      <div className="space-y-1 max-h-96 overflow-y-auto">
        {result.segments.map((seg, i) => (
          <div
            key={i}
            className="flex gap-3 px-3 py-2 rounded-r-lg border-l-4 text-sm"
            style={speakerColorStyle(seg.speaker_id)}
          >
            <span className="text-[10px] text-zinc-400 font-mono mt-0.5 shrink-0 w-12 text-right">
              {formatTime(seg.start_ms)}
            </span>
            <span className="flex-1 text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {seg.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
