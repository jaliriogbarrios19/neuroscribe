'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Agente Analista (Backend): Obtiene todas las carpetas del usuario.
 */
export async function getFolders() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from('folders')
    .select('*, documents(id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching folders:", error);
    return [];
  }

  // Mapeamos para contar los documentos por carpeta
  return data.map(folder => ({
    id: folder.id,
    name: folder.name,
    count: folder.documents?.length || 0,
    created_at: folder.created_at
  }));
}

/**
 * Agente Editor (Backend): Crea una nueva carpeta.
 */
export async function createFolder(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const { data, error } = await supabase
    .from('folders')
    .insert([{ name, user_id: user.id }])
    .select()
    .single();

  if (error) {
    console.error("Error creating folder:", error);
    throw error;
  }

  revalidatePath('/');
  return data;
}
