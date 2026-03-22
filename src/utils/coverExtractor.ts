/**
 * 书籍封面提取工具
 *
 * 从豆瓣 API 获取封面，提取主色和视觉元素，生成背景配置
 * 支持三级降级：封面 API → 内置纹理 → 默认渐变
 */

import { BackgroundConfig, PatternType } from '@/types';

// 豆瓣搜索 API
const DOUBAN_SEARCH_API = 'https://api.douban.com/v2/book/search';

/**
 * 10 种内置中式纹理
 */
export const TEXTURES = [
  { name: 'xuan-paper', label: '宣纸纹', colors: ['#f5f0e6', '#e8e0d0', '#d0c8b8'] },
  { name: 'juan-fabric', label: '绢布纹', colors: ['#e8d8c0', '#d8c8a8', '#c8b898'] },
  { name: 'mu-wood', label: '木纹', colors: ['#8B6F47', '#6B5437', '#4B3F27'] },
  { name: 'shi-stone', label: '石纹', colors: ['#6a6a6a', '#5a5a5a', '#4a4a4a'] },
  { name: 'zhu-bamboo', label: '竹纹', colors: ['#c8d8c0', '#b8c8b0', '#a8b8a0'] },
  { name: 'yun-cloud', label: '云纹', colors: ['#e0e8f0', '#d0d8e0', '#c0c8d0'] },
  { name: 'shui-water', label: '水纹', colors: ['#a0c8d8', '#90b8c8', '#80a8b8'] },
  { name: 'shan-mountain', label: '山纹', colors: ['#5a6a5a', '#4a5a4a', '#3a4a3a'] },
  { name: 'hua-niao', label: '花鸟纹', colors: ['#f0d8e8', '#e0c8d8', '#d0b8c8'] },
  { name: 'ji-geometric', label: '几何纹', colors: ['#d8c8e8', '#c8b8d8', '#b8a8c8'] },
] as const;

/**
 * 根据书名计算纹理索引（确定性哈希）
 */
export function getTextureIndex(bookTitle: string): number {
  let hash = 0;
  for (let i = 0; i < bookTitle.length; i++) {
    hash = ((hash << 5) - hash) + bookTitle.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % TEXTURES.length;
}

/**
 * 从豆瓣 API 获取书籍封面 URL
 */
export async function fetchBookCover(bookTitle: string): Promise<string | null> {
  try {
    const url = `${DOUBAN_SEARCH_API}?q=${encodeURIComponent(bookTitle)}&start=0&count=1`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.books || data.books.length === 0) {
      return null;
    }

    return data.books[0].image;
  } catch (err) {
    console.warn('Failed to fetch book cover:', err);
    return null;
  }
}

/**
 * RGB 转 Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * 从图片提取主色
 *
 * 将图片缩小到 100x140，分 5 个区域采样平均色
 */
export async function extractColors(imageUrl: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, 100, 140);

  const imageData = ctx.getImageData(0, 0, 100, 140);
  const pixels = imageData.data;

  // 分 5 个区域采样
  const regions = [
    { y: 0, h: 28 },    // 顶部
    { y: 28, h: 28 },   // 中上
    { y: 56, h: 28 },   // 中部
    { y: 84, h: 28 },   // 中下
    { y: 112, h: 28 },  // 底部
  ];

  const colors: string[] = [];

  regions.forEach(region => {
    let r = 0, g = 0, b = 0, count = 0;

    for (let y = region.y; y < region.y + region.h; y += 4) {
      for (let x = 0; x < 100; x += 4) {
        const i = (y * 100 + x) * 4;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }
    }

    colors.push(rgbToHex(r / count, g / count, b / count));
  });

  return colors;
}

/**
 * 检测封面视觉元素类型
 *
 * 简化版：根据颜色特征判断
 */
export function detectPattern(colors: string[], bookTitle: string): PatternType {
  // 根据书名关键词判断（简化方案）
  const title = bookTitle.toLowerCase();

  if (title.includes('王子') || title.includes('星空') || title.includes('夜')) {
    return 'stars';
  }
  if (title.includes('梦') || title.includes('红') || title.includes('古典')) {
    return 'texture';
  }
  if (title.includes('1984') || title.includes('几何') || title.includes('未来')) {
    return 'geometric';
  }
  if (title.includes('仙踪') || title.includes('魔法') || title.includes('光')) {
    return 'sparkle';
  }

  // 默认：根据颜色饱和度判断
  const avgSaturation = colors.reduce((acc, color) => {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const s = max === 0 ? 0 : (max - min) / max;
    return acc + s;
  }, 0) / colors.length;

  return avgSaturation > 0.5 ? 'sparkle' : 'minimal';
}

/**
 * 获取默认渐变配置（暗金风格）
 */
export function getDefaultGradient(): BackgroundConfig {
  return {
    type: 'gradient',
    colors: ['#1a1a2e', '#16213e', '#0f0f2e'],
    pattern: 'minimal',
    maskOpacity: 0.7,
  };
}

/**
 * 加载内置纹理配置
 */
export function getTextureConfig(textureIndex: number): BackgroundConfig {
  const texture = TEXTURES[textureIndex];
  return {
    type: 'texture',
    colors: [...texture.colors] as string[],
    pattern: 'texture',
    textureName: texture.name,
    maskOpacity: 0.65,
  };
}

/**
 * 加载背景配置（三级降级入口）
 */
export async function loadBackgroundConfig(
  bookTitle: string
): Promise<BackgroundConfig> {
  // 尝试 Tier 1: 封面 API
  try {
    const coverUrl = await fetchBookCover(bookTitle);

    if (coverUrl) {
      const colors = await extractColors(coverUrl);
      const pattern = detectPattern(colors, bookTitle);

      return {
        type: 'cover',
        colors,
        pattern,
        maskOpacity: 0.7,
      };
    }
  } catch (err) {
    console.warn('Tier 1 (cover API) failed:', err);
  }

  // 降级到 Tier 2: 内置纹理
  try {
    const textureIndex = getTextureIndex(bookTitle);
    return getTextureConfig(textureIndex);
  } catch (err) {
    console.warn('Tier 2 (texture) failed:', err);
  }

  // 降级到 Tier 3: 默认渐变
  return getDefaultGradient();
}
