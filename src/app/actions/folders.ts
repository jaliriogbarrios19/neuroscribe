import { invoke } from '@tauri-apps/api/core';

export interface Folder {
  id: string;
  name: string;
  created_at: string;
  count: number;
}

export async function getFolders(): Promise<Folder[]> {
  try {
    const folders = await invoke<Folder[]>('db_get_folders');
    return folders;
  } catch (error) {
    console.error("Error fetching folders from local DB:", error);
    return [];
  }
}

export async function createFolder(name: string): Promise<Folder> {
  try {
    const folder = await invoke<Folder>('db_create_folder', { name });
    return folder;
  } catch (error) {
    console.error("Error creating folder in local DB:", error);
    throw error;
  }
}
