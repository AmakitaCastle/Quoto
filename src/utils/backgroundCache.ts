/**
 * 背景配置缓存
 *
 * 内存缓存，1 小时 TTL，避免重复请求封面 API
 */

import { BackgroundConfig } from '@/types';

interface CacheItem {
  config: BackgroundConfig;
  timestamp: number;
}

export class BackgroundCache {
  private cache = new Map<string, CacheItem>();
  private ttl: number;

  constructor(ttlMinutes = 60) {
    this.ttl = ttlMinutes * 1000;
  }

  /**
   * 获取缓存
   * @param key - 缓存键（书名）
   * @returns 缓存的配置，过期或不存在返回 null
   */
  get(key: string): BackgroundConfig | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 检查 TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.config;
  }

  /**
   * 设置缓存
   * @param key - 缓存键（书名）
   * @param config - 背景配置
   */
  set(key: string, config: BackgroundConfig): void {
    this.cache.set(key, {
      config,
      timestamp: Date.now(),
    });
  }

  /**
   * 清除缓存
   * @param key - 可选，不传则清空所有
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存数量
   */
  size(): number {
    return this.cache.size;
  }
}

// 导出单例
export const backgroundCache = new BackgroundCache(60);
