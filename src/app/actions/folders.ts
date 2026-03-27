import { invoke } from '@tauri-apps/api/core';

export async function getFolders() {
  try {
    const folders = await invoke<any[]>('db_get_folders');
    return folders;
  } catch (error) {
    console.error('Error fetching folders from local DB:', error);
    return [];
  }
}

export async function createFolder(name: string) {
  try {
    const folder = await invoke<any>('db_create_folder', { name });
    return folder;
  } catch (error) {
    console.error('Error creating folder in local DB:', error);
    throw error;
  }
}
