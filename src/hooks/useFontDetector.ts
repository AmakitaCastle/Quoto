/**
 * 字体检测 Hook
 *
 * 调用 Tauri 系统命令获取用户电脑上已安装的字体列表。
 *
 * @package src/hooks
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/** 字体信息 */
export interface SystemFont {
  name: string;
  family: string;
  is_system: boolean;
}

/**
 * 字体检测器 Hook
 * @returns 字体列表、加载状态、错误信息
 */
export function useFontDetector() {
  const [fonts, setFonts] = useState<SystemFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        const result = await invoke<SystemFont[]>('get_system_fonts');
        setFonts(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fonts');
      } finally {
        setLoading(false);
      }
    }

    loadFonts();
  }, []);

  return { fonts, loading, error };
}
