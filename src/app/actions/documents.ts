import { invoke } from '@tauri-apps/api/core';

export interface Document {
  id: string;
  folder_id: string | null;
  title: string;
  content: string | null;
  document_type: 'transcript' | 'summary' | 'paper';
  tokens_used: number;
  created_at: string;
}

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
}): Promise<Document> {
  try {
    const doc = await invoke<Document>('db_save_document', {
      id,
      folderId: folder_id,
      title,
      content,
      docType: type,
      tokens: tokens_used
    });
    return doc;
  } catch (error) {
    console.error("Error saving document in local DB:", error);
    throw error;
  }
}

export async function getDocuments(folderId?: string): Promise<Document[]> {
  try {
    const docs = await invoke<Document[]>('db_get_documents', { folderId });
    return docs;
  } catch (error) {
    console.error("Error fetching documents from local DB:", error);
    return [];
  }
}
