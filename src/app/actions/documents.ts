'use server'

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Agente Editor (Backend): Guarda o actualiza un documento.
 */
export async function saveDocument({
  id,
  title,
  content,
  folder_id,
  type,
  tokens_used = 0
}: {
  id?: string,
  title: string,
  content: string,
  folder_id?: string,
  type: 'transcript' | 'summary' | 'paper',
  tokens_used?: number
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("No autenticado");

  const documentData = {
    user_id: user.id,
    folder_id,
    title,
    content,
    type,
    tokens_used,
  };

  let result;
  
  if (id) {
    // Update
    result = await supabase
      .from('documents')
      .update(documentData)
      .eq('id', id)
      .select()
      .single();
  } else {
    // Insert
    result = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();
  }

  if (result.error) {
    console.error("Error saving document:", result.error);
    throw result.error;
  }

  revalidatePath('/');
  return result.data;
}

/**
 * Agente Analista: Obtiene documentos de una carpeta.
 */
export async function getDocuments(folderId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  let query = supabase
    .from('documents')
    .select('*')
    .eq('user_id', user.id);
  
  if (folderId) {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching documents:", error);
    return [];
  }

  return data;
}
