# 书影卡片模糊背景生成系统实现计划 (v3)

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用高斯模糊方案完全替代边缘检测方案，实现更自然柔和的封面背景生成系统

**Architecture:**
- 分析层：80x80 缩略图上进行 K-Means 聚类、亮度方差、亮点检测
- 决策层：根据 textureScore 动态计算模糊半径和透明度，根据 avgLum 判断适配模式
- 生成层：四层渲染（底色渐变 → 模糊副本 → 蒙版暗角 → 柔光晕）
- 缓存策略：上传时一次性分析并缓存结果，渲染时动态计算决策参数

**Tech Stack:** TypeScript, Canvas 2D API, K-Means 聚类算法

---

## Chunk 1: 类型定义和颜色工具

### Task 1: 更新 BackgroundConfig 类型定义

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 添加新的类型定义**

在 `BackgroundConfig` 接口附近添加：

```typescript
/** 亮点数据 */
export interface BrightSpot {
  x: number;  // 归一化坐标 0-1
  y: number;  // 归一化坐标 0-1
  v: number;  // 亮度值 0-1
}

/** 蒙版三段停止点 */
export interface MaskStops {
  top: number;
  middle: number;
  bottom: number;
}

/** 封面适配模式 */
export type CoverMode = 'normal' | 'too-bright' | 'too-plain';
```

- [ ] **Step 2: 更新 BackgroundConfig 接口**

修改 `BackgroundConfig` 接口：

```typescript
export interface BackgroundConfig {
  type: 'cover' | 'gradient';
  colors: string[];           // K-Means 5 个主色（按饱和度降序）
  textureScore: number;       // 0-1
  brightSpots: BrightSpot[];  // 亮点位置
  avgLum: number;             // 0-1
  imageUrl?: string;
}
```

- [ ] **Step 3: 移除边缘检测相关类型**

删除以下类型（已不再使用）：
- `EdgeData`
- `PathData`
- `PatternType`

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
npm run build 2>&1 | head -30
```

Expected: 可能有其他引用错误，先记录

- [ ] **Step 5: 提交**

```bash
git add src/types/index.ts
git commit -m "refactor(types): update BackgroundConfig for v3 blur background, remove edge detection types"
```

---

### Task 2: 实现颜色工具函数

**Files:**
- Create: `src/utils/colorUtils.ts`

- [ ] **Step 1: 创建文件并实现基础函数**

```typescript
/**
 * 颜色工具函数
 *
 * 所有颜色操作在 HSL 空间进行，保留色相和饱和度
 */

/**
 * 计算亮度（相对 luminance）
 */
export function lum([r, g, b]: number[]): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * RGB 转 HSL
 * @returns [h: 0-360, s: 0-100, l: 0-100]
 */
export function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s * 100, l * 100];
}

/**
 * HSL 转 RGB
 * @param h 0-360
 * @param s 0-100
 * @param l 0-100
 * @returns [r, g, b] 0-255
 */
export function hslToRgb([h, s, l]: number[]): number[] {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) return [l * 255, l * 255, l * 255];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  return [
    hue(p, q, h + 1/3) * 255,
    hue(p, q, h) * 255,
    hue(p, q, h - 1/3) * 255
  ];
}

/**
 * RGB 转 RGBA 字符串
 */
export function toRgba([r, g, b]: number[], a: number): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

/**
 * Hex 转 RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npm run build 2>&1 | head -20
```

Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/utils/colorUtils.ts
git commit -m "feat(utils): add color utility functions (rgb/hsl conversion)"
```

---

### Task 3: 实现 K-Means 颜色聚类

**Files:**
- Modify: `src/utils/coverExtractor.ts`

- [ ] **Step 1: 在文件顶部添加 K-Means 函数**

在 `rgbToHex` 函数之后添加：

```typescript
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
  let centers = Array.from({ length: k }, (_, i) => [...pixels[i * step]]);

  for (let it = 0; it < iters; it++) {
    const clusters = Array.from({ length: k }, () => []);

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
```

- [ ] **Step 2: 导入颜色工具函数**

修改文件顶部 import：

```typescript
import { BackgroundConfig, BrightSpot } from '@/types';
import { rgbToHsl, hslToRgb, toRgba, lum, hexToRgb } from './colorUtils';
```

- [ ] **Step 3: 验证编译**

```bash
npm run build 2>&1 | head -20
```

- [ ] **Step 4: 提交**

```bash
git add src/utils/coverExtractor.ts
git commit -m "feat(utils): add K-Means color clustering for cover analysis"
```

---

## Chunk 2: 分析层实现

### Task 4: 实现封面分析主函数

**Files:**
- Modify: `src/utils/coverExtractor.ts`

- [ ] **Step 1: 重写 extractColors 函数为 analyzeCover**

```typescript
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
  const colors = palette.map(([r, g, b]) => {
    const hex = `#${[r, g, b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
    return hex;
  });

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
```

- [ ] **Step 2: 保留旧函数（deprecated）**

```typescript
/**
 * @deprecated 使用 analyzeCover 替代
 */
export async function extractColors(...): Promise<string[]> { ... }
```

- [ ] **Step 3: 更新 loadBackgroundFromUpload**

```typescript
export async function loadBackgroundFromUpload(imageDataUrl: string): Promise<BackgroundConfig> {
  try {
    const img = await loadImage(imageDataUrl);
    return analyzeCover(img);
  } catch (err) {
    console.warn('Failed to analyze cover:', err);
    return getDefaultGradient();
  }
}
```

- [ ] **Step 4: 验证编译**

```bash
npm run build 2>&1 | head -20
```

- [ ] **Step 5: 提交**

```bash
git add src/utils/coverExtractor.ts
git commit -m "feat(utils): implement analyzeCover with K-Means, texture score, bright spots detection"
```

---

## Chunk 3: 渲染层实现

### Task 5: 实现决策层函数

**Files:**
- Create: `src/utils/coverDecision.ts`

- [ ] **Step 1: 创建决策工具文件**

```typescript
/**
 * 封面背景决策层
 *
 * 根据分析数据动态计算渲染参数
 */

import { CoverMode, MaskStops } from '@/types';

/**
 * 获取封面适配模式
 */
export function getMode(avgLum: number, textureScore: number): CoverMode {
  if (avgLum > 0.65) return 'too-bright';
  if (textureScore < 0.08) return 'too-plain';
  return 'normal';
}

/**
 * 计算模糊半径
 */
export function getBlurRadius(textureScore: number): number {
  return Math.round(16 + (1 - textureScore) * 16);
}

/**
 * 计算纹理透明度
 */
export function getTexAlpha(textureScore: number): number {
  return 0.35 + (1 - textureScore) * 0.25;
}

/**
 * 获取蒙版三段停止点
 */
export function getMaskStops(mode: CoverMode): MaskStops {
  switch (mode) {
    case 'too-bright':
      return { top: 0.85, middle: 0.70, bottom: 0.55 };
    case 'too-plain':
      return { top: 0.68, middle: 0.55, bottom: 0.42 };
    default:
      return { top: 0.72, middle: 0.58, bottom: 0.45 };
  }
}

/**
 * 获取光晕源（最多 3 个）
 */
export function getGlowSources(brightSpots: Array<{x: number, y: number, v: number}>) {
  if (brightSpots.length > 0) {
    return brightSpots.slice(0, 3);
  }
  return [{ x: 0.82, y: 0.10, v: 0.7 }];
}
```

- [ ] **Step 2: 验证编译**

```bash
npm run build 2>&1 | head -20
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/coverDecision.ts
git commit -m "feat(utils): add decision layer functions for dynamic parameter calculation"
```

---

### Task 6: 实现渲染层（四层渲染）

**Files:**
- Modify: `src/utils/cardRenderer.ts`

- [ ] **Step 1: 更新导入**

```typescript
import { BackgroundConfig, CardData, CardStyle } from '@/types';
import {
  getBlurRadius,
  getTexAlpha,
  getMaskStops,
  getGlowSources,
  getMode
} from './coverDecision';
import { rgbToHsl, hslToRgb, toRgba } from './colorUtils';
```

- [ ] **Step 2: 重写 drawBackground 函数**

```typescript
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BackgroundConfig
): void {
  if (config.type !== 'cover' || !config.imageUrl) {
    // Fallback: 使用 style 的渐变
    return;
  }

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = config.imageUrl;

  // 等待图片加载完成（同步绘制场景）
  if (!img.complete) {
    img.onload = () => {
      drawBackground(ctx, width, height, config);
    };
    return;
  }

  // 决策参数
  const mode = getMode(config.avgLum, config.textureScore);
  const blurRadius = getBlurRadius(config.textureScore);
  const texAlpha = getTexAlpha(config.textureScore);
  const maskStops = getMaskStops(mode);
  const glowSources = getGlowSources(config.brightSpots);

  // 主色（第一个，饱和度最高）
  const [r, g, b] = hslToRgb(rgbToHsl(hexToRgb(config.colors[0])));
  const [H, S] = rgbToHsl([r, g, b]);

  // Layer 1: 主色深色底渐变
  const c0 = hslToRgb([H, Math.min(S, 85), 11]);
  const c1 = hslToRgb([(H + 15) % 360, Math.min(S, 70), 7]);
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, toRgba(c0, 1));
  bg.addColorStop(1, toRgba(c1, 1));
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Layer 2: 封面模糊副本
  const ia = img.naturalWidth / img.naturalHeight;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (ia > 1) {
    sw = sh;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = sw;
    sy = (img.naturalHeight - sh) / 2;
  }

  const bleed = blurRadius * 2.5;
  ctx.filter = `blur(${blurRadius}px)`;
  ctx.globalAlpha = texAlpha;
  ctx.drawImage(
    img, sx, sy, sw, sh,
    -bleed, -bleed, width + bleed * 2, height + bleed * 2
  );
  ctx.filter = 'none';
  ctx.globalAlpha = 1;

  // Layer 3: 主色蒙版 + 四角暗角
  const maskColor = hslToRgb([H, Math.min(S * 0.4, 30), 4]);
  const mask = ctx.createLinearGradient(0, 0, 0, height);
  mask.addColorStop(0, toRgba(maskColor, maskStops.top));
  mask.addColorStop(0.5, toRgba(maskColor, maskStops.middle));
  mask.addColorStop(1, toRgba(maskColor, maskStops.bottom));
  ctx.fillStyle = mask;
  ctx.fillRect(0, 0, width, height);

  // 四角暗角
  [[0, 0], [width, 0], [width, height], [0, height]].forEach(([cx, cy]) => {
    const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.62);
    vg.addColorStop(0, 'rgba(0,0,0,0.42)');
    vg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, width, height);
  });

  // Layer 4: 柔光晕
  glowSources.forEach(({ x, y, v }, i) => {
    const glowColor = hslToRgb([H, Math.min(S + 10, 100), 30 + i * 5]);
    const px = x * width, py = y * height;
    const g = ctx.createRadialGradient(px, py, 0, px, py, width * 0.45);
    g.addColorStop(0, toRgba(glowColor, v * 0.45));
    g.addColorStop(0.5, toRgba(glowColor, v * 0.12));
    g.addColorStop(1, toRgba(glowColor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
  });

  // 补色冷光
  const coldColor = hslToRgb([(H + 180) % 360, Math.min(S * 0.5, 40), 18]);
  const cg = ctx.createRadialGradient(width * 0.1, height * 0.9, 0, width * 0.1, height * 0.9, width * 0.5);
  cg.addColorStop(0, toRgba(coldColor, 0.20));
  cg.addColorStop(1, toRgba(coldColor, 0));
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, width, height);
}
```

- [ ] **Step 3: 移除旧绘制函数**

删除以下函数：
- `drawEdgeTexture`
- `drawStars`
- `drawGeometric`
- `drawSparkle`

- [ ] **Step 4: 验证编译**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 5: 提交**

```bash
git add src/utils/cardRenderer.ts
git commit -m "feat(renderer): implement v3 four-layer blur background rendering"
```

---

## Chunk 4: 清理和测试

### Task 7: 清理边缘检测残留代码

**Files:**
- Modify: `src/utils/coverExtractor.ts`

- [ ] **Step 1: 移除边缘检测相关函数**

删除以下函数：
- `computeSobel`
- `computeAdaptiveThreshold`
- `extractPaths`
- `traceContour`
- `classifyEdgeType`
- `extractEdges`
- `computeIntensity`
- `simplifyPath`
- `perpendicularDistance`

- [ ] **Step 2: 验证编译**

```bash
npm run build 2>&1 | head -30
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/coverExtractor.ts
git commit -m "refactor(utils): remove edge detection functions"
```

---

### Task 8: 验证和测试

**Files:**
- Manual testing

- [ ] **Step 1: 功能测试**

上传不同类型的封面图片：
- 深色封面
- 白底/淡彩封面
- 纯色封面
- 复杂插图封面

- [ ] **Step 2: 控制台检查**

```javascript
const config = await loadBackgroundFromUpload(imageDataUrl);
console.log('Colors:', config.colors);
console.log('Texture Score:', config.textureScore);
console.log('Avg Lum:', config.avgLum);
console.log('Bright Spots:', config.brightSpots.length);
```

- [ ] **Step 3: 视觉验证**

- 模糊效果自然，无黑边
- 文字清晰可读
- 光晕位置与封面亮点一致
- 白底封面蒙版加重

- [ ] **Step 4: 提交测试报告**

创建 `docs/superpowers/tests/blur-background-test-report.md`

---

## 验收标准

1. ✅ TypeScript 编译通过
2. ✅ 上传封面生成柔和模糊背景
3. ✅ 纹理复杂度动态控制模糊参数
4. ✅ 白底/淡彩封面自动加重蒙版
5. ✅ 纯色封面正确降级
6. ✅ 文字清晰可读
7. ✅ 无边缘检测代码残留
