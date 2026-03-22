/**
 * 书籍封面分析工具（v3 模糊背景方案）
 *
 * 从用户上传的图片提取主色、纹理复杂度、亮点位置和平均亮度
 */

import { BackgroundConfig, BrightSpot } from '@/types';
import { rgbToHsl, lum } from './colorUtils';

/**
 * K-Means 颜色聚类
 *
 * @param pixels - 像素数组，每个元素为 [r, g, b]
 * @param k - 聚类数量
 * @param iters - 迭代次数
 * @returns 聚类中心，按饱和度降序排列
 */
function kMeans(pixels: number[][], k: number, iters = 20): number[][] {
  const step = Math.floor(pixels.length / k);
  let centers: number[][] = [];
  for (let i = 0; i < k; i++) {
    centers.push([...pixels[i * step]]);
  }

  for (let it = 0; it < iters; it++) {
    const clusters: number[][][] = Array.from({ length: k }, () => []);

    // 分配像素到最近的聚类中心
    for (const px of pixels) {
      let best = 0, bestD = Infinity;
      for (let i = 0; i < k; i++) {
        const d = (px[0]-centers[i][0])**2
                + (px[1]-centers[i][1])**2
                + (px[2]-centers[i][2])**2;
        if (d < bestD) { bestD = d; best = i; }
      }
      clusters[best].push(px);
    }

    // 更新聚类中心
    for (let i = 0; i < k; i++) {
      if (!clusters[i].length) continue;
      centers[i] = [
        clusters[i].reduce((s, p) => s + p[0], 0) / clusters[i].length,
        clusters[i].reduce((s, p) => s + p[1], 0) / clusters[i].length,
        clusters[i].reduce((s, p) => s + p[2], 0) / clusters[i].length
      ];
    }
  }

  // 按饱和度降序排列
  return centers.sort((a, b) => {
    const [, sa] = rgbToHsl(a);
    const [, sb] = rgbToHsl(b);
    return sb - sa;
  });
}

/**
 * RGB 转 Hex
 */
function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
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
 * 分析封面图片，提取背景生成所需数据
 *
 * @param imageSource - HTMLImageElement 或 Data URL
 * @returns BackgroundConfig
 */
export async function analyzeCover(
  imageSource: HTMLImageElement | string
): Promise<BackgroundConfig> {
  const img = typeof imageSource === 'string' ? await loadImage(imageSource) : imageSource;

  const SIZE = 80;
  const c = document.createElement('canvas');
  c.width = c.height = SIZE;
  const ctx = c.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const imageData = ctx.getImageData(0, 0, SIZE, SIZE);
  const data = imageData.data;

  // 提取像素并转 RGB
  const pixels: number[][] = [];
  for (let i = 0; i < data.length; i += 4) {
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  // K-Means 主色提取
  const palette = kMeans(pixels, 5);
  const colors = palette.map(([r, g, b]) => rgbToHex(r, g, b));

  // 计算亮度图
  const L = new Float32Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    L[i] = lum([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]]) / 255;
  }

  // 纹理复杂度（亮度方差）
  let varSum = 0, varCount = 0;
  for (let y = 2; y < SIZE - 2; y++) {
    for (let x = 2; x < SIZE - 2; x++) {
      const vals: number[] = [];
      let mean = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const v = L[(y + dy) * SIZE + (x + dx)];
          vals.push(v);
          mean += v;
        }
      }
      mean /= 25;
      varSum += vals.reduce((s, v) => s + (v - mean) ** 2, 0) / 25;
      varCount++;
    }
  }
  const textureScore = Math.min(1, (varSum / varCount) * 30);

  // 平均亮度
  let lumSum = 0;
  for (let i = 0; i < L.length; i++) {
    lumSum += L[i];
  }
  const avgLum = lumSum / L.length;

  // 亮点检测
  const brightSpots: BrightSpot[] = [];
  for (let y = 2; y < SIZE - 2; y += 2) {
    for (let x = 2; x < SIZE - 2; x += 2) {
      const v = L[y * SIZE + x];
      if (v < 0.62) continue;

      let isMax = true;
      for (let dy = -2; dy <= 2 && isMax; dy++) {
        for (let dx = -2; dx <= 2 && isMax; dx++) {
          if ((dy || dx) && L[(y + dy) * SIZE + (x + dx)] > v) {
            isMax = false;
          }
        }
      }

      if (isMax) {
        brightSpots.push({ x: x / SIZE, y: y / SIZE, v });
      }
    }
  }

  return {
    type: 'cover',
    colors,
    textureScore,
    brightSpots,
    avgLum,
  };
}

/**
 * 获取默认渐变配置（暗金风格）
 */
export function getDefaultGradient(): BackgroundConfig {
  return {
    type: 'gradient',
    colors: ['#1a1a2e', '#16213e', '#0f0f2e'],
    textureScore: 0,
    brightSpots: [],
    avgLum: 0,
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
    const img = await loadImage(imageDataUrl);
    return analyzeCover(img);
  } catch (err) {
    console.warn('Failed to analyze cover:', err);
    return getDefaultGradient();
  }
}
