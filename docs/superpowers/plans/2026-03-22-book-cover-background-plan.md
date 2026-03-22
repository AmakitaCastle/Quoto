# 书籍封面背景系统实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为书摘卡片添加书籍封面背景图功能，支持三级降级（API → 纹理 → 渐变）

**Architecture:**
- 新增 coverExtractor.ts 工具处理封面提取和降级逻辑
- 修改 CardCanvas.tsx 增加背景加载状态管理
- 修改 cardRenderer.ts 支持背景配置参数
- 新增背景缓存机制和内建纹理资源

**Tech Stack:** TypeScript, Canvas API, Douban API, React

---

## Chunk 1: 基础类型和缓存

### Task 1: 新增 BackgroundConfig 类型定义

**Files:**
- Modify: `src/types/index.ts:119-120` (在文件末尾添加)

- [ ] **Step 1: 添加 BackgroundConfig 类型**

在 `src/types/index.ts` 文件末尾添加：

```typescript
/**
 * 背景配置接口
 *
 * 用于书籍封面背景系统的三级降级配置
 */
export interface BackgroundConfig {
  /** 背景类型 */
  type: 'cover' | 'texture' | 'gradient';
  /** 主色数组（3-5 个颜色） */
  colors: string[];
  /** 视觉元素类型 */
  pattern: PatternType;
  /** 纹理名称（仅 Tier 2） */
  textureName?: string;
  /** 遮罩不透明度 (0.6-0.7) */
  maskOpacity: number;
}

/**
 * 视觉元素类型
 *
 * 用于识别封面特征并生成对应的背景效果
 */
export type PatternType =
  | 'stars'      // 星空元素（如小王子）
  | 'texture'    // 纸质纹理（如红楼梦）
  | 'geometric'  // 几何图案（如 1984）
  | 'sparkle'    // 闪烁效果（如绿野仙踪）
  | 'minimal';  // 极简风格（如白夜行）
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat(types): add BackgroundConfig and PatternType for cover background"
```

---

### Task 2: 创建背景缓存工具

**Files:**
- Create: `src/utils/backgroundCache.ts`

- [ ] **Step 1: 创建缓存类**

```typescript
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
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/utils/backgroundCache.ts
git commit -m "feat(utils): add background cache with 1h TTL"
```

---

## Chunk 2: 封面提取核心逻辑

### Task 3: 创建封面提取工具 coverExtractor.ts

**Files:**
- Create: `src/utils/coverExtractor.ts`

- [ ] **Step 1: 创建基础结构和 DOUBAN_API 配置**

```typescript
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
```

- [ ] **Step 2: 添加 Douban API 调用函数**

```typescript
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
```

- [ ] **Step 3: 添加颜色提取函数**

```typescript
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
```

- [ ] **Step 4: 添加图案检测函数**

```typescript
/**
 * 检测封面视觉元素类型
 *
 * 简化版：根据颜色特征判断
 * TODO: 可以使用 ML 模型进行更精确的识别
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
  // 高饱和度 → sparkle，低饱和度 → minimal
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
```

- [ ] **Step 5: 添加默认渐变配置**

```typescript
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
```

- [ ] **Step 6: 添加纹理加载函数**

```typescript
/**
 * 加载内置纹理配置
 */
export function getTextureConfig(textureIndex: number): BackgroundConfig {
  const texture = TEXTURES[textureIndex];
  return {
    type: 'texture',
    colors: texture.colors,
    pattern: 'texture',
    textureName: texture.name,
    maskOpacity: 0.65,
  };
}
```

- [ ] **Step 7: 添加主函数 loadBackgroundConfig**

```typescript
/**
 * 加载背景配置（三级降级入口）
 *
 * @param bookTitle - 书名
 * @returns BackgroundConfig
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
```

- [ ] **Step 8: 验证 TypeScript 编译**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 9: 提交**

```bash
git add src/utils/coverExtractor.ts
git commit -m "feat(utils): add cover extractor with 3-tier fallback"
```

---

## Chunk 3: 修改卡片渲染器

### Task 4: 修改 cardRenderer.ts 支持背景配置

**Files:**
- Modify: `src/utils/cardRenderer.ts`

- [ ] **Step 1: 添加导入**

在文件顶部添加：

```typescript
import { BackgroundConfig } from '@/types';
```

- [ ] **Step 2: 修改 renderCardToCanvas 函数签名**

修改为：

```typescript
export function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  data: CardData,
  style: CardStyle,
  quoteStartY: number,
  openQuoteY: number,
  backgroundConfig?: BackgroundConfig,  // 新增参数
): void {
```

- [ ] **Step 3: 添加绘制背景函数**

在文件顶部（辅助函数区域）添加：

```typescript
/**
 * 绘制背景配置
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: BackgroundConfig
): void {
  // 绘制主色渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  config.colors.forEach((color, i) => {
    const offset = i / (config.colors.length - 1);
    gradient.addColorStop(offset, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 根据 pattern 添加装饰元素
  if (config.pattern === 'stars') {
    drawStars(ctx, width, height);
  } else if (config.pattern === 'geometric') {
    drawGeometric(ctx, width, height, config.colors);
  } else if (config.pattern === 'sparkle') {
    drawSparkle(ctx, width, height, config.colors);
  }

  // 绘制遮罩层
  const maskGradient = ctx.createLinearGradient(0, 0, 0, height);
  maskGradient.addColorStop(0, `rgba(0, 0, 0, ${config.maskOpacity + 0.05})`);
  maskGradient.addColorStop(0.3, `rgba(0, 0, 0, ${config.maskOpacity - 0.15})`);
  maskGradient.addColorStop(1, `rgba(0, 0, 0, ${config.maskOpacity})`);

  ctx.fillStyle = maskGradient;
  ctx.fillRect(0, 0, width, height);
}

/**
 * 绘制星空元素
 */
function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const textArea = { x: 40, y: 60, w: 280, h: 200 };

  for (let i = 0; i < 50; i++) {
    let x: number, y: number;

    // 避开文字区域
    do {
      x = Math.random() * width;
      y = Math.random() * height;
    } while (
      x >= textArea.x && x <= textArea.x + textArea.w &&
      y >= textArea.y && y <= textArea.y + textArea.h
    );

    const size = Math.random() * 2 + 0.5;
    const brightness = Math.random() * 0.5 + 0.5;

    // 光晕
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    glowGradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.6})`);
    glowGradient.addColorStop(1, 'transparent');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 绘制几何图案
 */
function drawGeometric(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[]
): void {
  ctx.save();
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 40 + 15;

    ctx.strokeStyle = colors[Math.floor(Math.random() * colors.length)];
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, size, size);
  }

  ctx.restore();
}

/**
 * 绘制闪烁效果
 */
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[]
): void {
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 4 + 2;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
    gradient.addColorStop(0, colors[colors.length - 1] + '80');
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
```

- [ ] **Step 4: 修改背景绘制逻辑**

找到原有的背景绘制部分（约 150-171 行），替换为：

```typescript
  // ── 圆角背景 ──────────────────────────────────────────────────────────────
  const cornerRadius = Math.min(20, width / 2, height / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(width - cornerRadius, 0);
  ctx.quadraticCurveTo(width, 0, width, cornerRadius);
  ctx.lineTo(width, height - cornerRadius);
  ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
  ctx.lineTo(cornerRadius, height);
  ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.clip();

  // 使用背景配置或默认渐变
  if (backgroundConfig) {
    drawBackground(ctx, width, height, backgroundConfig);
  } else {
    const gradient = parseGradient(style.background, ctx, height);
    ctx.fillStyle = gradient ?? style.background;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.restore();
```

- [ ] **Step 5: 验证 TypeScript 编译**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 6: 提交**

```bash
git add src/utils/cardRenderer.ts
git commit -m "feat(renderer): support background config parameter"
```

---

## Chunk 4: 修改 CardCanvas 组件

### Task 5: 修改 CardCanvas.tsx 增加背景加载

**Files:**
- Modify: `src/components/CardCanvas.tsx`

- [ ] **Step 1: 添加导入**

```typescript
import { useState, useEffect } from 'react';
import { BackgroundConfig } from '@/types';
import { backgroundCache } from '@/utils/backgroundCache';
import { loadBackgroundConfig } from '@/utils/coverExtractor';
```

- [ ] **Step 2: 添加状态变量**

在组件内部添加：

```typescript
  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
```

- [ ] **Step 3: 添加背景加载 useEffect**

在原有的 useEffect 之前添加：

```typescript
  // 加载背景配置
  useEffect(() => {
    const loadBackground = async () => {
      setBackgroundLoading(true);

      // 检查缓存
      const cached = backgroundCache.get(data.bookTitle);
      if (cached) {
        setBackgroundConfig(cached);
        setBackgroundLoading(false);
        return;
      }

      // 加载新配置
      const config = await loadBackgroundConfig(data.bookTitle);
      backgroundCache.set(data.bookTitle, config);
      setBackgroundConfig(config);
      setBackgroundLoading(false);
    };

    loadBackground();
  }, [data.bookTitle]);
```

- [ ] **Step 4: 修改渲染调用**

修改原有的 `renderCardToCanvas` 调用，传入 `backgroundConfig`：

```typescript
    renderCardToCanvas(
      canvas,
      data,
      style,
      dimensions.quoteStartY,
      dimensions.openQuoteY,
      backgroundConfig ?? undefined  // 新增参数
    );
```

- [ ] **Step 5: 添加加载状态 UI（可选）**

在 return 语句中添加：

```tsx
  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ maxWidth: '400px', height: 'auto' }}
      />
      {backgroundLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <div className="w-6 h-6 border-2 border-[#d4a04a] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
```

- [ ] **Step 6: 验证 TypeScript 编译**

```bash
npm run typecheck
```

Expected: 无错误

- [ ] **Step 7: 提交**

```bash
git add src/components/CardCanvas.tsx
git commit -m "feat(CardCanvas): add background loading with cache support"
```

---

## Chunk 5: 内置纹理资源

### Task 6: 创建内置纹理资源

**Files:**
- Create: `public/textures/xuan-paper.png`
- Create: `public/textures/juan-fabric.png`
- Create: `public/textures/mu-wood.png`
- Create: `public/textures/shi-stone.png`
- Create: `public/textures/zhu-bamboo.png`
- Create: `public/textures/yun-cloud.png`
- Create: `public/textures/shui-water.png`
- Create: `public/textures/shan-mountain.png`
- Create: `public/textures/hua-niao.png`
- Create: `public/textures/ji-geometric.png`

由于纹理图片需要实际图像文件，采用 CSS 生成纹理替代：

- [ ] **Step 1: 修改 coverExtractor.ts，使用 CSS 生成纹理**

修改 `getTextureConfig` 函数，不依赖实际图片文件：

```typescript
/**
 * 加载内置纹理配置（CSS 生成版本）
 *
 * 不需要实际图片文件，使用 Canvas 程序化生成
 */
export async function loadTextureConfig(textureIndex: number): Promise<BackgroundConfig> {
  const texture = TEXTURES[textureIndex];
  return {
    type: 'texture',
    colors: texture.colors,
    pattern: 'texture',
    textureName: texture.name,
    maskOpacity: 0.65,
  };
}
```

- [ ] **Step 2: 修改 cardRenderer.ts，添加 Canvas 绘制纹理函数**

在 `drawBackground` 函数中添加 texture 处理：

```typescript
  if (config.type === 'texture') {
    drawTexture(ctx, width, height, config.colors, config.textureName);
  }
```

添加 `drawTexture` 函数：

```typescript
/**
 * 绘制中式纹理
 */
function drawTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: string[],
  textureName?: string
): void {
  // 底色渐变
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  colors.forEach((color, i) => {
    gradient.addColorStop(i / (colors.length - 1), color);
  });
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // 噪点纹理
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const alpha = 0.02 + Math.random() * 0.03;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillRect(x, y, 2, 1);
  }

  // 四角云纹装饰
  ctx.strokeStyle = 'rgba(160, 140, 100, 0.3)';
  ctx.lineWidth = 1;
  const cloudPatterns = [
    { x: 30, y: 30, r: 20 },
    { x: width - 30, y: 30, r: 15 },
    { x: 30, y: height - 30, r: 15 },
    { x: width - 30, y: height - 30, r: 20 },
  ];

  cloudPatterns.forEach(pattern => {
    ctx.beginPath();
    ctx.arc(pattern.x, pattern.y, pattern.r, 0, Math.PI * 2);
    ctx.stroke();
  });
}
```

- [ ] **Step 3: 提交**

```bash
git add src/utils/cardRenderer.ts src/utils/coverExtractor.ts
git commit -m "feat(textures): add procedural texture generation (no image files needed)"
```

---

## 验收标准

完成所有任务后，验证以下内容：

1. ✅ TypeScript 编译通过
2. ✅ 输入书名后，卡片背景与书籍关联
3. ✅ API 失败时静默降级到纹理/渐变
4. ✅ 重复输入同一本书不重复请求（缓存生效）
5. ✅ 文字清晰可读，对比度良好

---

## 注意事项

1. 本计划不需要修改 Settings 组件（项目中不存在）
2. 纹理资源使用 Canvas 程序化生成，无需实际图片文件
3. Douban API 使用公开接口，无需 API Key
4. 所有错误处理采用静默降级策略
