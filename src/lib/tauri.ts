/**
 * Tauri API 封装
 *
 * 提供与 Tauri 后端交互的函数。
 * 目前包含图片保存功能。
 *
 * @package src/lib
 */

import { invoke } from '@tauri-apps/api/core';

/**
 * 保存图片到本地磁盘
 *
 * 调用 Tauri 后端的 `save_image` 命令，将 Canvas 生成的图片
 * 保存到用户指定的位置。
 *
 * @param dataUrl - 图片的 Data URL（base64 编码的 PNG）
 * @param filename - 保存的文件名
 * @returns 保存后的完整路径
 */
export async function saveImageToDisk(dataUrl: string, filename: string): Promise<string> {
  return invoke<string>('save_image', { dataUrl, filename });
}
