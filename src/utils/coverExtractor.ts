/**
 * 书籍封面提取工具
 *
 * 从用户上传的图片提取主色和视觉元素，生成背景配置
 * 支持两级降级：上传图片 → 默认渐变
 */

import { BackgroundConfig, PatternType } from '@/types';

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
export async function extractColors(imageSource: HTMLImageElement | string): Promise<string[]> {
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;

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
 * 加载图片为 HTMLImageElement
 */
function loadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
  });
}

/**
 * 检测封面视觉元素类型
 *
 * 根据颜色特征判断
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
 * 从上传的图片加载背景配置
 *
 * @param imageDataUrl - 上传图片的 Data URL
 * @returns BackgroundConfig
 */
export async function loadBackgroundFromUpload(imageDataUrl: string): Promise<BackgroundConfig> {
  try {
    const colors = await extractColors(imageDataUrl);
    const pattern = detectPattern(colors, '');

    return {
      type: 'cover',
      colors,
      pattern,
      imageUrl: imageDataUrl,
      maskOpacity: 0.7,
    };
  } catch (err) {
    console.warn('Failed to process uploaded image:', err);
    return getDefaultGradient();
  }
}

/**
 * 加载背景配置（已废弃，保留以兼容旧代码）
 * @deprecated 使用 loadBackgroundFromUpload 替代
 */
export async function loadBackgroundConfig(): Promise<BackgroundConfig> {
  return getDefaultGradient();
}
