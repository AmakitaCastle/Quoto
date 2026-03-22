# 边缘检测纹理背景系统设计文档

**日期**: 2026-03-22
**状态**: 待实现

---

## 1. 概述

### 1.1 背景
当前用户上传封面图片后，系统直接绘制原图作为背景，导致文字看不清。需要一种既能保留封面特征，又不影响文字可读性的方案。

### 1.2 目标
- 从上传封面提取主题色和纹理特征
- 使用边缘检测算法生成抽象背景纹理
- 确保文字清晰可读（对比度 ≥ 4.5:1）
- 每本书生成独特的个性化背景

### 1.3 范围
- 修改 `coverExtractor.ts` 增加边缘检测功能
- 修改 `cardRenderer.ts` 增加纹理绘制
- 保持 CardCanvas 组件接口不变

---

## 2. 当前架构

### 2.1 背景渲染流程
```
上传图片 → 提取 5 个主色 → 绘制渐变 → 绘制遮罩 → 文字
```

### 2.2 问题
- 原图直接绘制会干扰文字
- 即使有遮罩，复杂图片仍影响可读性
- 失去了"识别封面特征"的意义

---

## 3. 新架构设计

### 3.1 处理流程
```
┌─────────────────────────────────────────────────────────┐
│                   用户上传封面图片                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  1. 提取主色：5 个区域采样，得到 ['#xxx', '#xxx', ...]    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  2. 边缘检测：Sobel 算子计算梯度，生成边缘图              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  3. 特征分类：识别边缘类型（直线/曲线/点）                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  4. 纹理生成：用主色绘制抽象线条/点阵                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│  5. 叠加渲染：渐变层 → 纹理层 → 遮罩层 → 文字            │
└─────────────────────────────────────────────────────────┘
```

### 3.2 边缘检测算法

**Sobel 算子**（简化版，适用于 Canvas）：

```typescript
// 对缩小后的图片（200x280）进行边缘检测
function detectEdges(imageData: ImageData): EdgeMap {
  const { width, height, data } = imageData;
  const edges = new Float32Array(width * height);

  // Sobel 算子
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      let k = 0;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const i = ((y + dy) * width + (x + dx)) * 4;
          const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11;
          gx += gray * sobelX[k];
          gy += gray * sobelY[k];
          k++;
        }
      }

      edges[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  return edges;
}
```

### 3.3 纹理生成策略

根据边缘强度和分布，生成不同类型的纹理：

| 边缘特征 | 纹理类型 | 绘制方式 |
|----------|----------|----------|
| 高强度直线 | 几何线条 | Canvas `lineTo` 路径 |
| 曲线/有机边缘 | 波浪纹理 | 贝塞尔曲线 |
| 分散点状边缘 | 点阵/星星 | `arc()` 圆形 |
| 低边缘强度 | 噪点纹理 | 随机像素点 |

### 3.4 数据结构

```typescript
interface BackgroundConfig {
  type: 'cover' | 'gradient';
  colors: string[];           // 5 个主色
  pattern: PatternType;       // 纹理类型
  imageUrl?: string;          // 上传的图片（保留用于调试）
  edges?: EdgeData;           // 边缘数据（新增）
  maskOpacity: number;
}

interface EdgeData {
  type: 'lines' | 'curves' | 'dots' | 'noise';
  intensity: number;          // 边缘强度 (0-1)
  paths: PathData[];          // 边缘路径
}

interface PathData {
  points: { x: number; y: number }[];
  closed: boolean;
}
```

### 3.5 渲染层次

```
第 1 层：主色渐变
  └→ 从上传封面提取的 5 个主色

第 2 层：边缘纹理（新增）
  └→ 使用主色之一，以 15-25% 不透明度绘制边缘路径

第 3 层：装饰元素（可选）
  ├→ 'stars': 星空点缀
  ├→ 'geometric': 几何图形
  └→ 'none': 无

第 4 层：遮罩层
  └→ 顶部 75% → 中部 55% → 底部 65% 不透明度
```

---

## 4. 关键实现

### 4.1 边缘检测函数

```typescript
/**
 * 从图片提取边缘数据
 * @param imageSource - HTMLImageElement 或 Data URL
 * @returns EdgeData
 */
export async function extractEdges(
  imageSource: HTMLImageElement | string
): Promise<EdgeData> {
  const img = typeof imageSource === 'string'
    ? await loadImage(imageSource)
    : imageSource;

  // 缩小到 200x280 进行边缘检测
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 280;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 200, 280);

  const imageData = ctx.getImageData(0, 0, 200, 280);
  const edges = computeSobel(imageData);
  const threshold = computeAdaptiveThreshold(edges);
  const paths = extractPaths(edges, threshold);

  // 分类边缘类型
  const type = classifyEdgeType(paths);

  return { type, intensity: computeIntensity(edges), paths };
}
```

### 4.2 绘制边缘纹理

```typescript
function drawEdgeTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  edges: EdgeData,
  baseColor: string
): void {
  ctx.save();
  ctx.globalAlpha = 0.2;  // 低不透明度
  ctx.strokeStyle = baseColor;
  ctx.lineWidth = 1;

  edges.paths.forEach(path => {
    ctx.beginPath();
    const start = path.points[0];
    ctx.moveTo(start.x * (width / 200), start.y * (height / 280));

    for (let i = 1; i < path.points.length; i++) {
      const point = path.points[i];
      ctx.lineTo(point.x * (width / 200), point.y * (height / 280));
    }

    if (path.closed) ctx.closePath();
    ctx.stroke();
  });

  ctx.restore();
}
```

---

## 5. 错误处理

### 5.1 边缘检测失败

| 错误类型 | 降级策略 |
|----------|----------|
| 图片加载失败 | 使用默认渐变 |
| Canvas 不支持 | 跳过纹理层 |
| 边缘数据为空 | 使用纯色渐变 + 遮罩 |

### 5.2 性能保护

- 边缘检测在缩小后的图片（200x280）上进行
- 路径简化：超过 100 个点的路径使用 Douglas-Peucker 算法简化
- 使用 `requestIdleCallback` 避免阻塞 UI

---

## 6. 缓存策略

### 6.1 内存缓存

```typescript
interface CacheItem {
  config: BackgroundConfig;
  timestamp: number;
  edges?: EdgeData;  // 缓存边缘数据
}

// 复用现有的 BackgroundCache，TTL = 60 分钟
```

### 6.2 缓存键

- 主键：`data.uploadedBackground` 的 hash 值
- 备选：`data.uploadedBackground`（Data URL 较长）

---

## 7. 性能指标

| 指标 | 目标值 |
|------|--------|
| 边缘检测耗时 | < 100ms |
| 路径提取耗时 | < 50ms |
| 纹理绘制耗时 | < 30ms |
| 总加载时间 | < 500ms |

---

## 8. 测试要点

### 8.1 功能测试
- [ ] 上传不同风格的封面生成不同的纹理
- [ ] 边缘检测失败时正确降级
- [ ] 缓存命中时不重复计算

### 8.2 边界测试
- [ ] 上传纯色图片（无边缘）
- [ ] 上传高对比度图片
- [ ] 上传超大图片（>5MB）

### 8.3 视觉测试
- [ ] 文字对比度 ≥ 4.5:1
- [ ] 纹理不干扰文字阅读
- [ ] 不同风格封面有明显差异

---

## 9. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/coverExtractor.ts` | 修改 | 增加 `extractEdges`, `computeSobel`, `extractPaths` 等函数 |
| `src/utils/cardRenderer.ts` | 修改 | 增加 `drawEdgeTexture` 函数 |
| `src/types/index.ts` | 修改 | 增加 `EdgeData`, `PathData` 类型 |
| `src/components/CardCanvas.tsx` | 无需修改 | 接口保持不变 |
| `src/utils/backgroundCache.ts` | 无需修改 | 复用现有缓存 |

---

## 10. 验收标准

1. ✅ 上传封面后，背景呈现与封面相关的抽象纹理
2. ✅ 文字清晰可读，对比度达标
3. ✅ 不同封面生成不同的纹理效果
4. ✅ 边缘检测耗时 < 100ms
5. ✅ 失败时静默降级为纯色渐变

---

## 11. 后续优化建议

1. **Canny 边缘检测**：更精确的边缘识别
2. **机器学习分类**：识别封面类型（星空/纸质/几何）
3. **WebAssembly 加速**：使用 WASM 进行边缘检测
4. **纹理预设库**：根据封面类型选择不同的纹理生成策略
