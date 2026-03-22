# 书影卡片模糊背景生成系统设计规范 (v3)

**日期**: 2026-03-22
**版本**: v3
**状态**: 待实现

---

## 一、设计原则

### 核心矛盾

封面是为"被看"设计的，背景是为"衬托文字"设计的，两者目标天然冲突：

| 封面设计目标 | 背景设计目标 |
|---|---|
| 抓眼球、传递书的气质 | 退到幕后、不干扰阅读 |
| 高对比度、信息密集 | 低对比度、有呼吸感 |
| 有大量文字（书名/作者） | 不能有多余视觉噪声 |

### 解决思路

**所有视觉元素都来自封面图本身，没有凭空生成的装饰。**

封面经过大幅高斯模糊后，可识别的具体内容（书名文字、人物轮廓）消失，但颜色分布、明暗结构、色彩过渡这些"感觉"被保留下来。

```
封面图
  ├─ 模糊副本 → 背景纹理层（颜色 + 明暗结构来自封面）
  └─ 缩略图分析 → 主色 + 亮点位置 + 纹理复杂度
                    ↓
              控制模糊程度 / 叠加透明度 / 光晕落点 / 蒙版色调
```

### 与边缘检测方案对比

| | v2 边缘检测 | v3 高斯模糊 |
|---|---|---|
| 纹理来源 | Sobel 边缘检测提取轮廓 | 封面图直接高斯模糊 |
| 分析复杂度 | 200x280 Sobel + 轮廓追踪 | 80x80 K-Means + 亮度方差 |
| 视觉效果 | 抽象线条纹理 | 柔和色彩过渡 |
| 文字可读性 | 0.2 透明度线条 | 多层蒙版控制 |

---

## 二、分析层

所有分析在 80×80 的离屏 Canvas 上进行。

```javascript
const SIZE = 80;
const c = document.createElement('canvas');
c.width = c.height = SIZE;
const ctx = c.getContext('2d');
ctx.drawImage(img, 0, 0, SIZE, SIZE);
const d = ctx.getImageData(0, 0, SIZE, SIZE).data;
```

### 2.1 分析指标

| 指标 | 值域 | 用途 |
|---|---|---|
| 主色板 palette | [[r,g,b] × 5] | 底色渐变 + 蒙版色调 + 光晕配色 |
| 纹理复杂度 textureScore | 0 – 1 | 控制模糊半径和透明度 |
| 亮点列表 brightSpots | [{x,y,v}] | 光晕落点（归一化坐标） |
| 平均亮度 avgLum | 0 – 1 | 封面适配性判断 |

### 2.2 K-Means 主色提取

对所有像素跑 K-Means（k=5，迭代 20 次），按饱和度降序排列。

```typescript
function kMeans(pixels: number[][], k: number, iters = 20): number[][] {
  const step = Math.floor(pixels.length / k);
  let centers = Array.from({ length: k }, (_, i) => [...pixels[i * step]]);

  for (let it = 0; it < iters; it++) {
    const clusters = Array.from({ length: k }, () => []);
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
    for (let i = 0; i < k; i++) {
      if (!clusters[i].length) continue;
      centers[i] = [
        clusters[i].reduce((s,p) => s+p[0], 0) / clusters[i].length,
        clusters[i].reduce((s,p) => s+p[1], 0) / clusters[i].length,
        clusters[i].reduce((s,p) => s+p[2], 0) / clusters[i].length
      ];
    }
  }
  return centers.sort((a, b) => rgbToHsl(b)[1] - rgbToHsl(a)[1]);
}
```

### 2.3 纹理复杂度

以 5×5 为滑动窗口，计算亮度方差：

```typescript
const L = new Float32Array(SIZE * SIZE);
for (let i = 0; i < SIZE*SIZE; i++)
  L[i] = lum([d[i*4], d[i*4+1], d[i*4+2]]) / 255;

let varSum = 0, varCount = 0;
for (let y = 2; y < SIZE-2; y++) {
  for (let x = 2; x < SIZE-2; x++) {
    const vals = [];
    let mean = 0;
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) {
        const v = L[(y+dy)*SIZE + (x+dx)];
        vals.push(v); mean += v;
      }
    mean /= 25;
    varSum += vals.reduce((s,v) => s + (v-mean)**2, 0) / 25;
    varCount++;
  }
}
const textureScore = Math.min(1, (varSum / varCount) * 30);
```

### 2.4 亮点检测

```typescript
const brightSpots = [];
for (let y = 2; y < SIZE-2; y += 2) {
  for (let x = 2; x < SIZE-2; x += 2) {
    const v = L[y*SIZE + x];
    if (v < 0.62) continue;
    let isMax = true;
    for (let dy = -2; dy <= 2 && isMax; dy++)
      for (let dx = -2; dx <= 2 && isMax; dx++)
        if ((dy || dx) && L[(y+dy)*SIZE + (x+dx)] > v) isMax = false;
    if (isMax) brightSpots.push({ x: x/SIZE, y: y/SIZE, v });
  }
}
```

---

## 三、决策层

### 3.1 适配模式

```typescript
type CoverMode = 'normal' | 'too-bright' | 'too-plain';

function getMode(avgLum: number, textureScore: number): CoverMode {
  if (avgLum > 0.65) return 'too-bright';  // 白底、淡彩封面
  if (textureScore < 0.08) return 'too-plain';  // 极简纯色封面
  return 'normal';
}
```

### 3.2 参数映射

| 分析指标 | 生成参数 | 计算方式 |
|---|---|---|
| textureScore | blurRadius | `16 + (1 - textureScore) * 16`（16–32px） |
| textureScore | texAlpha | `0.35 + (1 - textureScore) * 0.25`（0.35–0.60） |
| mode | maskStops | normal: {0.72, 0.58, 0.45} / too-bright: {0.85+, ...} |
| brightSpots | glowPoints | slice(0, 3) or fallback |

---

## 四、生成层

### 4.1 渲染层次

```
Layer 4: 柔光晕（亮点位置，蒙版之后）
Layer 3: 主色蒙版 + 四角暗角
Layer 2: 封面模糊副本（纹理层）
Layer 1: 主色深色底渐变（兜底）
```

### 4.2 Layer 1：主色深色底渐变

```typescript
const [H, S] = rgbToHsl(palette[0]);
const c0 = hslToRgb([H, Math.min(S, 85), 11]);
const c1 = hslToRgb([(H+15)%360, Math.min(S, 70), 7]);

const bg = ctx.createLinearGradient(0, 0, W, H);
bg.addColorStop(0, toRgba(c0, 1));
bg.addColorStop(1, toRgba(c1, 1));
ctx.fillStyle = bg;
ctx.fillRect(0, 0, W, H);
```

### 4.3 Layer 2：封面模糊副本

```typescript
const blurRadius = Math.round(16 + (1 - textureScore) * 16);
const texAlpha = 0.35 + (1 - textureScore) * 0.25;

// cover-fit 裁切
const ia = img.naturalWidth / img.naturalHeight;
let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
if (ia > 1) { sw = sh; sx = (img.naturalWidth - sw) / 2; }
else        { sh = sw; sy = (img.naturalHeight - sh) / 2; }

// 出血防黑边
const bleed = blurRadius * 2.5;
ctx.filter = `blur(${blurRadius}px)`;
ctx.globalAlpha = texAlpha;
ctx.drawImage(img, sx, sy, sw, sh, -bleed, -bleed, W + bleed*2, H + bleed*2);
ctx.filter = 'none';
ctx.globalAlpha = 1;
```

### 4.4 Layer 3：主色蒙版 + 四角暗角

```typescript
const [H, S] = rgbToHsl(palette[0]);
const maskColor = hslToRgb([H, Math.min(S * 0.4, 30), 4]);

const mask = ctx.createLinearGradient(0, 0, 0, H);
mask.addColorStop(0, toRgba(maskColor, maskStops.top));
mask.addColorStop(0.5, toRgba(maskColor, maskStops.middle));
mask.addColorStop(1, toRgba(maskColor, maskStops.bottom));
ctx.fillStyle = mask;
ctx.fillRect(0, 0, W, H);

// 四角暗角
[[0,0],[W,0],[W,H],[0,H]].forEach(([cx, cy]) => {
  const vg = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 0.62);
  vg.addColorStop(0, 'rgba(0,0,0,0.42)');
  vg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
});
```

### 4.5 Layer 4：柔光晕

```typescript
const [H, S] = rgbToHsl(palette[0]);
const sources = brightSpots.length
  ? brightSpots.slice(0, 3)
  : [{ x: 0.82, y: 0.10, v: 0.7 }];

sources.forEach(({ x, y, v }, i) => {
  const glowColor = hslToRgb([H, Math.min(S + 10, 100), 30 + i*5]);
  const px = x * W, py = y * H;
  const g = ctx.createRadialGradient(px, py, 0, px, py, W * 0.45);
  g.addColorStop(0, toRgba(glowColor, v * 0.45));
  g.addColorStop(0.5, toRgba(glowColor, v * 0.12));
  g.addColorStop(1, toRgba(glowColor, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
});

// 补色冷光
const coldColor = hslToRgb([(H + 180) % 360, Math.min(S * 0.5, 40), 18]);
const cg = ctx.createRadialGradient(W*0.1, H*0.9, 0, W*0.1, H*0.9, W*0.5);
cg.addColorStop(0, toRgba(coldColor, 0.20));
cg.addColorStop(1, toRgba(coldColor, 0));
ctx.fillStyle = cg;
ctx.fillRect(0, 0, W, H);
```

---

## 五、数据结构

### BackgroundConfig

```typescript
interface BackgroundConfig {
  type: 'cover' | 'gradient';
  colors: string[];           // K-Means 5 个主色（按饱和度降序）
  textureScore: number;       // 0-1
  brightSpots: Array<{x: number, y: number, v: number}>;
  avgLum: number;             // 0-1
  imageUrl?: string;
}
```

### 移除的类型

```typescript
// 以下类型不再需要：
// - EdgeData
// - PathData
// - PatternType (保留用于其他用途或移除)
```

---

## 六、颜色工具函数

```typescript
function lum([r, g, b]: number[]): number {
  return 0.299*r + 0.587*g + 0.114*b;
}

function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2-max-min) : d / (max+min);
    switch (max) {
      case r: h = ((g-b)/d + (g<b ? 6 : 0)) / 6; break;
      case g: h = ((b-r)/d + 2) / 6; break;
      default: h = ((r-g)/d + 4) / 6;
    }
  }
  return [h*360, s*100, l*100];
}

function hslToRgb([h, s, l]: number[]): number[] {
  h /= 360; s /= 100; l /= 100;
  if (s === 0) return [l*255, l*255, l*255];
  const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l - q;
  const hue = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q-p)*6*t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q-p)*(2/3-t)*6;
    return p;
  };
  return [
    hue(p, q, h+1/3) * 255,
    hue(p, q, h)     * 255,
    hue(p, q, h-1/3) * 255
  ];
}

function toRgba([r,g,b]: number[], a: number): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}
```

---

## 七、文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | 更新 BackgroundConfig，移除 EdgeData/PathData/PatternType |
| `src/utils/coverExtractor.ts` | 重写 | 实现 K-Means、textureScore、brightSpots、avgLum |
| `src/utils/cardRenderer.ts` | 重写 | 实现四层渲染逻辑 |
| `src/components/CardCanvas.tsx` | 无需修改 | 接口保持不变 |

---

## 八、验收标准

1. ✅ 上传封面后生成柔和模糊背景
2. ✅ 纹理复杂度动态控制模糊半径和透明度
3. ✅ 光晕落点来自封面亮点位置
4. ✅ 白底/淡彩封面自动加重蒙版
5. ✅ 文字清晰可读，对比度良好
6. ✅ 纯色封面正确降级处理

---

## 九、后续优化建议

1. **Web Worker 分析**：将 K-Means 移到 Worker 避免阻塞主线程
2. **缓存优化**：分析结果存 IndexedDB，避免重复计算
3. **更多光晕样式**：根据封面风格选择不同光晕形状
4. **暗角形状优化**：根据封面构图调整暗角位置和强度
