import { invoke } from '@tauri-apps/api/core';

export async function saveImageToDisk(dataUrl: string, filename: string): Promise<string> {
  return invoke<string>('save_image', { dataUrl, filename });
}
