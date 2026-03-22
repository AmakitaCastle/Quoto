/**
 * 书籍封面提取工具
 *
 * 从用户上传的图片提取主色和视觉元素，生成背景配置
 * 支持两级降级：上传图片 → 默认渐变
 */

import { BackgroundConfig, PatternType, PathData } from '@/types';

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
 * 从上传的图片加载背景配置（旧版本，不使用边缘检测）
 *
 * @deprecated 使用新的 loadBackgroundFromUpload（带边缘检测）替代
 */
export async function loadBackgroundFromUploadLegacy(imageDataUrl: string): Promise<BackgroundConfig> {
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

/**
 * 使用 Sobel 算子计算边缘强度
 *
 * @param imageData - Canvas ImageData
 * @returns Float32Array 边缘强度图（归一化到 0-1）
 */
export function computeSobel(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const edges = new Float32Array(width * height);

  // Sobel 算子
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  let maxEdge = 0;

  // 计算边缘强度
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      let k = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          // 转灰度
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          gx += gray * sobelX[k];
          gy += gray * sobelY[k];
          k++;
        }
      }

      const magnitude = Math.sqrt(gx * gx + gy * gy);
      edges[y * width + x] = magnitude;
      if (magnitude > maxEdge) maxEdge = magnitude;
    }
  }

  // 归一化到 0-1
  const normalized = new Float32Array(width * height);
  for (let i = 0; i < normalized.length; i++) {
    normalized[i] = edges[i] / maxEdge;
  }

  return normalized;
}

/**
 * 计算自适应阈值（Otsu 方法简化版）
 *
 * @param edges - 边缘强度图
 * @returns 最佳阈值 (0-1)
 */
export function computeAdaptiveThreshold(edges: Float32Array): number {
  // 计算直方图
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < edges.length; i++) {
    const bin = Math.floor(edges[i] * 255);
    histogram[bin]++;
  }

  // Otsu 方法
  const total = edges.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    sum += i * histogram[i];
  }

  let sumB = 0;
  let wB = 0;
  let maxVariance = 0;
  let threshold = 0;

  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;

    const wF = total - wB;
    if (wF === 0) break;

    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);

    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }

  return threshold / 255;
}

/**
 * 从边缘图提取路径
 *
 * @param edges - 边缘强度图
 * @param threshold - 二值化阈值
 * @param width - 图片宽度
 * @param height - 图片高度
 * @returns PathData[] 路径数组
 */
export function extractPaths(
  edges: Float32Array,
  threshold: number,
  width: number,
  height: number
): PathData[] {
  const visited = new Uint8Array(width * height);
  const paths: PathData[] = [];

  // 二值化
  const binary = new Uint8Array(width * height);
  for (let i = 0; i < edges.length; i++) {
    binary[i] = edges[i] >= threshold ? 1 : 0;
  }

  // 查找轮廓
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (binary[i] && !visited[i]) {
        const path = traceContour(binary, visited, x, y, width, height);
        if (path.length > 3) {
          paths.push({ points: path, closed: true });
        }
      }
    }
  }

  // 对每个路径应用 Douglas-Peucker 简化
  const simplifiedPaths = paths.map(path => ({
    points: simplifyPath(path.points, 2),  // epsilon = 2
    closed: path.closed
  })).filter(path => path.points.length > 2);  // 过滤掉过度简化的路径

  return simplifiedPaths;
}

/**
 * 追踪轮廓（8 邻域）
 */
function traceContour(
  binary: Uint8Array,
  visited: Uint8Array,
  startX: number,
  startY: number,
  width: number,
  height: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const directions = [
    { dx: 1, dy: 0 },   // 右
    { dx: 1, dy: 1 },   // 右下
    { dx: 0, dy: 1 },   // 下
    { dx: -1, dy: 1 },  // 左下
    { dx: -1, dy: 0 },  // 左
    { dx: -1, dy: -1 }, // 左上
    { dx: 0, dy: -1 },  // 上
    { dx: 1, dy: -1 },  // 右上
  ];

  let x = startX, y = startY;
  let dirIndex = 0;

  do {
    points.push({ x, y });
    visited[y * width + x] = 1;

    // 查找下一个边缘点
    let found = false;
    for (let i = 0; i < 8; i++) {
      const nextDir = (dirIndex + i) % 8;
      const nx = x + directions[nextDir].dx;
      const ny = y + directions[nextDir].dy;
      const ni = ny * width + nx;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height &&
          binary[ni] && !visited[ni]) {
        x = nx;
        y = ny;
        dirIndex = (nextDir + 4) % 8;  // 逆时针搜索
        found = true;
        break;
      }
    }

    if (!found) break;
  } while ((x !== startX || y !== startY) && points.length < 500);

  return points;
}

/**
 * Douglas-Peucker 路径简化算法
 *
 * @param points - 原始路径点
 * @param epsilon - 简化阈值（越小越精确）
 * @returns 简化后的路径点
 */
function simplifyPath(
  points: { x: number; y: number }[],
  epsilon: number = 2
): { x: number; y: number }[] {
  if (points.length < 3) return points;

  // 找到距离基线最远的点
  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // 如果最大距离大于阈值，递归简化
  if (maxDist > epsilon) {
    const left = simplifyPath(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPath(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [first, last];
  }
}

/**
 * 计算点到直线的垂直距离
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }

  return Math.abs(
    dy * point.x - dx * point.y + lineStart.x * lineStart.y - lineStart.y * lineStart.x
  ) / Math.sqrt(dx * dx + dy * dy);
}

/**
 * 根据路径特征分类边缘类型
 *
 * @param paths - 路径数组
 * @returns 纹理类型
 */
export function classifyEdgeType(paths: PathData[]): 'lines' | 'curves' | 'dots' | 'noise' {
  if (paths.length === 0) return 'noise';

  // 计算路径的平均长度和曲率
  let totalLength = 0;
  let curvature = 0;

  paths.forEach(path => {
    for (let i = 1; i < path.points.length; i++) {
      const dx = path.points[i].x - path.points[i - 1].x;
      const dy = path.points[i].y - path.points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // 简单曲率估计：起点到终点距离与路径长度的比值
    if (path.points.length > 2) {
      const first = path.points[0];
      const last = path.points[path.points.length - 1];
      const directDist = Math.sqrt(
        Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
      );
      if (totalLength > 0) {
        curvature += directDist / totalLength;
      }
    }
  });

  const avgLength = totalLength / paths.length;
  const avgCurvature = curvature / paths.length;

  // 分类规则
  if (avgLength < 5) return 'dots';          // 短路径 → 点状
  if (avgCurvature > 0.8) return 'lines';    // 高曲率 → 直线
  if (avgCurvature > 0.5) return 'curves';   // 中等曲率 → 曲线
  return 'noise';                            // 其他 → 噪点
}

/**
 * 计算边缘强度平均值
 *
 * @param edges - 边缘强度图
 * @returns 边缘强度 (0-1)
 */
function computeIntensity(edges: Float32Array): number {
  let sum = 0;
  let count = 0;
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 0.1) {  // 忽略弱边缘
      sum += edges[i];
      count++;
    }
  }
  return count > 0 ? sum / count / edges.length : 0;
}

/**
 * 从图片提取边缘数据
 *
 * @param imageSource - HTMLImageElement 或 Data URL
 * @returns EdgeData
 */
export async function extractEdges(
  imageSource: HTMLImageElement | string
): Promise<import('@/types').EdgeData> {
  try {
    const img = typeof imageSource === 'string'
      ? await loadImage(imageSource)
      : imageSource;

    // 缩小到 200x280 进行边缘检测
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 280;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(img, 0, 0, 200, 280);
    const imageData = ctx.getImageData(0, 0, 200, 280);

    // 边缘检测
    const edges = computeSobel(imageData);
    const threshold = computeAdaptiveThreshold(edges);
    const paths = extractPaths(edges, threshold, 200, 280);

    // 分类和计算强度
    const type = classifyEdgeType(paths);
    const intensity = computeIntensity(edges);

    return { type, intensity, paths };
  } catch (err) {
    console.warn('Edge detection failed:', err);
    return { type: 'noise', intensity: 0, paths: [] };
  }
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
    const img = await loadImage(imageDataUrl);
    const edges = await extractEdges(img);
    const pattern = detectPattern(colors, '');

    return {
      type: 'cover',
      colors,
      pattern: edges.paths.length > 0 ? 'edges' : pattern,
      imageUrl: imageDataUrl,
      edges,
      maskOpacity: 0.7,
    };
  } catch (err) {
    console.warn('Failed to process uploaded image:', err);
    return getDefaultGradient();
  }
}
