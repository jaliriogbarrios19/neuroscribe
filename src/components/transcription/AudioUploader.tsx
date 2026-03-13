'use client'

import { Upload, X, FileAudio, Loader2, Mic, Square, Play, Circle, ScreenShare } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import MeetingRecorder from "./MeetingRecorder";

interface AudioUploaderProps {
  onTranscriptionComplete?: (text: string, tokens: number) => void;
}

const AudioUploader = ({ onTranscriptionComplete }: AudioUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState("");
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'upload' | 'record' | 'meeting'>('upload');
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setAudioBlob(null);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setFile(new File([blob], `grabacion_${new Date().getTime()}.webm`, { type: 'audio/webm' }));
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleMeetingRecordingComplete = (blob: Blob) => {
    setAudioBlob(blob);
    setFile(new File([blob], `reunion_${new Date().getTime()}.webm`, { type: 'video/webm' }));
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const removeFile = () => {
    setFile(null);
    setAudioBlob(null);
    setProgress(0);
    setStatus("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setProgress(10);
    setStatus("Subiendo archivo a Supabase Storage...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "transcript");

      // Intervalo de progreso visual mientras la API responde (fake until 90)
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 2;
          return prev;
        });
      }, 1000);

      // Paso 1: Subida y Transcripción
      setStatus("Procesando con Whisper-v3 (Fal.ai)...");
      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      clearInterval(interval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Error en el servidor");
      }

      setStatus("Análisis clínico con Llama 3.1 (OpenRouter)...");
      const data = await response.json();
      
      setProgress(100);
      setStatus("¡Completado!");

      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.html, data.tokens);
      }
      
      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setAudioBlob(null);
        setProgress(0);
        setStatus("");
      }, 1000);

    } catch (error: any) {
      console.error("Error processing audio:", error);
      setStatus(`Error: ${error.message}`);
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/30">
      {/* Tab Switcher */}
      {!file && !isRecording && (
        <div className="flex p-1 bg-zinc-100 rounded-lg mb-6 dark:bg-zinc-800/50">
          <button 
            onClick={() => setMode('upload')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'upload' ? 'bg-white shadow-sm dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
          >
            <Upload size={14} /> Subir
          </button>
          <button 
            onClick={() => setMode('record')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'record' ? 'bg-white shadow-sm dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
          >
            <Mic size={14} /> Grabar
          </button>
          <button 
            onClick={() => setMode('meeting')}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${mode === 'meeting' ? 'bg-white shadow-sm dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}
          >
            <ScreenShare size={14} /> Reunión
          </button>
        </div>
      )}

      {!file && !isRecording ? (
        mode === 'upload' ? (
          <label className="flex flex-col items-center justify-center gap-4 cursor-pointer py-10">
            <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
              <Upload size={32} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Haz clic o arrastra un audio</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">MP3, WAV, M4A (Máx. 25MB)</p>
            </div>
            <input type="file" className="hidden" accept="audio/*" onChange={handleFileChange} />
          </label>
        ) : mode === 'record' ? (
          <div className="flex flex-col items-center justify-center gap-6 py-10">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-indigo-100/50 animate-pulse dark:bg-indigo-900/20" />
              <button 
                onClick={startRecording}
                className="relative p-6 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
              >
                <Mic size={32} />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">Iniciar Grabación</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Asegúrate de dar permisos de micrófono</p>
            </div>
          </div>
        ) : (
          <MeetingRecorder onRecordingComplete={handleMeetingRecordingComplete} />
        )
      ) : isRecording ? (
        <div className="flex flex-col items-center justify-center gap-6 py-10">
          <div className="flex items-center gap-2 mb-2">
            <Circle size={12} className="text-red-500 fill-red-500 animate-pulse" />
            <span className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">{formatDuration(recordingDuration)}</span>
          </div>
          <button 
            onClick={stopRecording}
            className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            <Square size={32} />
          </button>
          <p className="text-sm font-medium text-zinc-500">Grabando sesión clínica...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white border border-zinc-200 rounded-lg dark:bg-zinc-800 dark:border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-zinc-100 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-400">
                <FileAudio size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate dark:text-white">{file?.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {audioBlob ? (mode === 'meeting' ? "Grabación de reunión" : "Grabación de voz") : `${((file?.size || 0) / (1024 * 1024)).toFixed(2)} MB`}
                </p>
              </div>
            </div>
            {!isUploading && (
              <button onClick={removeFile} className="p-1 hover:bg-zinc-100 rounded-full text-zinc-400 dark:hover:bg-zinc-700">
                <X size={18} />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="animate-pulse">{status}</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden dark:bg-zinc-800">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isUploading ? (
              <><Loader2 size={18} className="animate-spin" /> Procesando...</>
            ) : (
              "Iniciar Transcripción Real"
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioUploader;
