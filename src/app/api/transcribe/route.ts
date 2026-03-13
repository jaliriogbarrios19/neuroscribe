import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configuración de Fal (Agente Transcriptor)
const FAL_KEY = process.env.FAL_AI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string || "transcript";

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó archivo de audio" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    // 1. Subir a Supabase Storage (Temporal)
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audios')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('audios')
      .getPublicUrl(fileName);

    // 2. Transcripción con Fal.ai (Whisper-v3 + Diarización)
    // Usamos el endpoint de whisper-v3 con diarización
    const transcriptionResult: any = await fal.subscribe("fal-ai/whisper-v3", {
      input: {
        audio_url: publicUrl,
        diarize: true,
        language: "es"
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log("Fal.ai Queue:", update.status);
      },
    });

    const rawTranscript = transcriptionResult.chunks.map((chunk: any) => {
      return `[Hablante ${chunk.speaker || 'Desconocido'}]: ${chunk.text}`;
    }).join("\n");

    // 3. Orquestación con OpenRouter (Agente Analista + Editor)
    // Llama 3.1 405b para limpiar y formatear
    const prompt = `
      Eres un Agente Analista Clínico y Editor Profesional.
      Has recibido la siguiente transcripción cruda de una sesión (con diarización):
      
      ---
      ${rawTranscript}
      ---
      
      Tu tarea es:
      1. Limpiar el texto (corregir errores de puntuación y términos clínicos/científicos).
      2. Si hay dos hablantes, identifícalos como "Doctor/Psicólogo" y "Paciente" según el contexto.
      3. Formatear la salida en HTML semántico compatible con TipTap (usa <p>, <strong>, <ul>, etc.).
      4. Si el tipo es "summary", genera un resumen clínico estructurado.
      5. No inventes información. Si algo no está claro, indícalo.
      
      Devuelve SOLO el código HTML, sin preámbulos.
    `;

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://neuroscribe.app",
        "X-Title": "NeuroScribe"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-405b-instruct",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const aiData = await openRouterResponse.json();
    const formattedHtml = aiData.choices[0].message.content;

    // 4. Limpieza (Opcional): Borrar el audio de storage tras procesar para ahorrar espacio
    await supabase.storage.from('audios').remove([fileName]);

    return NextResponse.json({ 
      html: formattedHtml,
      tokens: aiData.usage?.total_tokens || 0
    });

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
