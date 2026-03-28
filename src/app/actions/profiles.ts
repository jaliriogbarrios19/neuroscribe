import { invoke } from '@tauri-apps/api/core';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  minutes_balance: number;
  cc_balance: number;
  created_at: string;
  license_key: string | null;
  gladia_api_key: string | null;
  trial_start_date: string;
  is_activated: boolean;
  activation_token: string | null;
}

interface ProfileUpdateInput {
  [key: string]: unknown;
}

export async function getProfile(): Promise<Profile | null> {
  try {
    const profile = await invoke<Profile>('db_get_profile');
    return profile;
  } catch (error) {
    console.error('Error fetching profile from local DB:', error);
    return null;
  }
}

export async function activateLicense(key: string): Promise<boolean> {
  try {
    const success = await invoke<boolean>('activate_license', { key });
    return success;
  } catch (error) {
    console.error('Error activating license:', error);
    throw error;
  }
}

export async function setGladiaApiKey(gladiaApiKey: string): Promise<boolean> {
  try {
    const success = await invoke<boolean>('db_set_gladia_api_key', {
      gladiaApiKey,
    });
    return success;
  } catch (error) {
    console.error('Error saving Gladia API key:', error);
    throw error;
  }
}

export async function updateProfile(data: ProfileUpdateInput) {
  // Nota: Dejamos esto mockeado por ahora ya que el perfil local es estático en el primer arranque
  console.log('[MOCK] updateProfile', data);
  return { id: 'local-user', ...data };
}
