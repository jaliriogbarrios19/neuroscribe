'use client'

import { ScreenShare, StopCircle, Circle, Loader2, Info } from "lucide-react";
import { useState, useRef } from "react";

interface MeetingRecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
}

const MeetingRecorder = ({ onRecordingComplete }: MeetingRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // Pedimos captura de pantalla/pestaña CON audio del sistema
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Requerido para que aparezca el diálogo de selección de pestaña
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' });
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        if (onRecordingComplete) onRecordingComplete(blob);
        
        // Limpiar tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Si el usuario deja de compartir desde el botón nativo del navegador
      stream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

    } catch (err) {
      console.error("Error al capturar pantalla:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs > 0 ? hrs + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {!isRecording ? (
        <>
          <div className="p-4 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
            <ScreenShare size={40} />
          </div>
          <div className="text-center max-w-sm">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white">Grabar Reunión Virtual</p>
            <p className="text-xs text-zinc-500 mt-2 dark:text-zinc-400">
              Al hacer clic, selecciona la pestaña de **Google Meet o Zoom** y asegúrate de marcar la casilla <span className="font-bold text-indigo-600 dark:text-indigo-400">"Compartir audio de la pestaña"</span>.
            </p>
          </div>
          <button 
            onClick={startRecording}
            className="px-6 py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition-colors"
          >
            Vincular y Grabar
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-red-50 rounded-full border border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
            <Circle size={12} className="text-red-500 fill-red-500 animate-pulse" />
            <span className="text-2xl font-mono font-bold text-red-600 dark:text-red-400">
              {formatDuration(duration)}
            </span>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-zinc-900 dark:text-white">Capturando audio de la reunión...</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 italic mt-1">No cierres la pestaña de la reunión</p>
          </div>
          <button 
            onClick={stopRecording}
            className="flex items-center gap-2 px-8 py-3 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <StopCircle size={20} />
            Finalizar y Procesar
          </button>
        </div>
      )}
      
      <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex gap-3 dark:bg-blue-900/10 dark:border-blue-900/20">
        <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-800 dark:text-blue-300">
          Nota: Esta función graba el audio de la pestaña seleccionada. Para mejores resultados, usa audífonos para evitar eco.
        </p>
      </div>
    </div>
  );
};

export default MeetingRecorder;
