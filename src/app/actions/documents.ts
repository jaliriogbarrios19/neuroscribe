import { invoke } from '@tauri-apps/api/core';

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
  try {
    const doc = await invoke<any>('db_save_document', {
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

export async function getDocuments(folderId?: string) {
  try {
    const docs = await invoke<any[]>('db_get_documents', { folderId });
    return docs;
  } catch (error) {
    console.error("Error fetching documents from local DB:", error);
    return [];
  }
}
