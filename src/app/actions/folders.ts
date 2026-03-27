import { invoke } from '@tauri-apps/api/core';

export interface FolderEntry {
  id: string;
  name: string;
  created_at: string;
  count: number;
}

export async function getFolders(): Promise<FolderEntry[]> {
  try {
    const folders = await invoke<FolderEntry[]>('db_get_folders');
    return folders;
  } catch (error) {
    console.error('Error fetching folders from local DB:', error);
    return [];
  }
}

export async function createFolder(name: string): Promise<FolderEntry> {
  try {
    const folder = await invoke<FolderEntry>('db_create_folder', { name });
    return folder;
  } catch (error) {
    console.error('Error creating folder in local DB:', error);
    throw error;
  }
}
