# 书籍封面背景系统设计文档

**日期**: 2026-03-22
**状态**: 待实现

---

## 1. 概述

### 1.1 背景
当前卡片背景使用预设的纯色/渐变样式，与用户选择的书籍没有视觉关联。希望引入书籍封面作为背景来源，增强卡片与书籍的关联性。

### 1.2 目标
- 为卡片渲染引入书籍封面背景图
- 保持文字清晰可读（遮罩层 60-70% 不透明度）
- 优雅降级处理（API 失败时有备选方案）
- 只修改背景层，文字渲染逻辑保持不变

### 1.3 范围
- 新增封面提取工具
- 新增内置纹理资源
- 修改卡片渲染器
- 新增全局配置开关

---

## 2. 当前架构

### 2.1 背景渲染
```
cardRenderer.ts
  └── parseGradient()
      └── ctx.createLinearGradient()
          └── style.background (CSS 渐变字符串)
```

### 2.2 风格配置 (STYLES)
```typescript
interface CardStyle {
  id: string;
  name: string;
  background: string;  // CSS linear-gradient
  accentColor: string;
  textColor: string;
  // ...
}
```

### 2.3 问题
- 背景与书籍内容无关联
- 无法体现书籍的视觉特征
- 用户希望封面元素（如小王子的星空）能融入卡片

---

## 3. 新架构设计

### 3.1 三级降级系统

```
┌─────────────────────────────────────────────────────────┐
│                    渲染卡片背景                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Tier 1: Douban API 获取封面                             │
│  - 调用书籍搜索 API                                       │
│  - 获取封面图片 URL                                       │
│  - Canvas 像素分析提取主色                                │
│  - 识别视觉元素（星星/纹理/几何等）                        │
│  - 生成背景（主色渐变 + 元素重组 + 遮罩）                  │
└─────────────────────────────────────────────────────────┘
                          │ 失败
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Tier 2: 内置纹理库                                      │
│  - 10 种中式纹理（宣纸/绢布/木纹/石纹等）                 │
│  - 按书名哈希值确定性选择                                 │
│  - 绘制纹理 + 遮罩                                        │
└─────────────────────────────────────────────────────────┘
                          │ 失败
                          ▼
┌─────────────────────────────────────────────────────────┐
│  Tier 3: 默认渐变                                        │
│  - 使用现有 STYLES 配置                                   │
│  - 保持当前视觉风格                                       │
└─────────────────────────────────────────────────────────┘
```

### 3.2 组件结构

```
src/
├── utils/
│   ├── coverExtractor.ts       [新增] 封面提取工具
│   │   ├── extractColors()     - Canvas 像素分析提取主色
│   │   ├── detectPattern()     - 识别视觉元素类型
│   │   ├── generateBackground() - 生成背景配置
│   │   └── fetchBookCover()    - Douban API 调用
│   │
│   └── cardRenderer.ts         [修改] 集成背景系统
│       └── renderCardToCanvas() - 增加背景参数
│
├── components/
│   └── CardCanvas.tsx          [修改] 加载状态管理
│       └── useEffect - 背景加载 + 错误处理
│
└── public/
    └── textures/               [新增] 内置纹理资源
        ├── xuan-paper.png      - 宣纸纹
        ├── juan-fabric.png     - 绢布纹
        ├── mu-wood.png         - 木纹
        ├── shi-stone.png       - 石纹
        ├── zhu-bamboo.png      - 竹纹
        ├── yun-cloud.png       - 云纹
        ├── shui-water.png      - 水纹
        ├── shan-mountain.png   - 山纹
        ├── hua-niao.png        - 花鸟纹
        └── ji-geometric.png    - 几何纹
```

### 3.3 状态变量 (CardCanvas)

| 状态名 | 类型 | 说明 |
|--------|------|------|
| `backgroundLoaded` | `boolean` | 背景是否加载完成 |
| `backgroundTier` | `1 | 2 | 3` | 当前使用的降级层级 |
| `backgroundError` | `string | null` | 加载错误信息 |

### 3.4 数据结构

```typescript
// coverExtractor.ts
interface BackgroundConfig {
  type: 'cover' | 'texture' | 'gradient';
  colors: string[];        // 主色数组
  pattern: PatternType;    // 视觉元素类型
  textureName?: string;    // Tier 2 纹理名称
  maskOpacity: number;     // 遮罩不透明度 (0.6-0.7)
}

type PatternType =
  | 'stars'      // 星空元素（如小王子）
  | 'texture'    // 纸质纹理（如红楼梦）
  | 'geometric'  // 几何图案（如 1984）
  | 'sparkle'    // 闪烁效果（如绿野仙踪）
  | 'minimal';  // 极简风格（如白夜行）
```

---

## 4. 关键流程

### 4.1 背景加载流程

```typescript
// CardCanvas.tsx useEffect
const loadBackground = async (bookTitle: string) => {
  // 1. 检查缓存
  const cached = backgroundCache.get(bookTitle);
  if (cached) return cached;

  // 2. Tier 1: 尝试 API
  try {
    const coverUrl = await fetchBookCover(bookTitle);
    const config = await extractColors(coverUrl);
    config.type = 'cover';
    backgroundCache.set(bookTitle, config);
    return config;
  } catch (err) {
    console.warn('Tier 1 failed:', err);
  }

  // 3. Tier 2: 内置纹理
  try {
    const textureIndex = getTextureIndex(bookTitle);
    const textureName = TEXTURES[textureIndex];
    const config = await loadTexture(textureName);
    config.type = 'texture';
    backgroundCache.set(bookTitle, config);
    return config;
  } catch (err) {
    console.warn('Tier 2 failed:', err);
  }

  // 4. Tier 3: 默认渐变
  const config = getDefaultGradient();
  config.type = 'gradient';
  backgroundCache.set(bookTitle, config);
  return config;
};
```

### 4.2 书名哈希计算

```typescript
function getTextureIndex(bookTitle: string): number {
  let hash = 0;
  for (let i = 0; i < bookTitle.length; i++) {
    hash = ((hash << 5) - hash) + bookTitle.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % TEXTURES.length;
}
```

### 4.3 颜色提取算法

```typescript
async function extractColors(imageUrl: string): Promise<string[]> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  await new Promise((resolve) => {
    img.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = 100;  // 缩小加速
  canvas.height = 140;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, 100, 140);

  const imageData = ctx.getImageData(0, 0, 100, 140);
  const pixels = imageData.data;

  // 简化：采样 5 个区域的平均色
  const colors = [];
  const regions = [
    { y: 0, h: 28 },    // 顶部
    { y: 28, h: 28 },   // 中上
    { y: 56, h: 28 },   // 中部
    { y: 84, h: 28 },   // 中下
    { y: 112, h: 28 },  // 底部
  ];

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

---

## 5. 错误处理

### 5.1 API 失败场景

| 错误类型 | 处理 |
|----------|------|
| 网络错误 | 降级到 Tier 2 |
| CORS 限制 | 降级到 Tier 2 |
| 无搜索结果 | 降级到 Tier 2 |
| 图片加载失败 | 降级到 Tier 2 |

### 5.2 纹理加载失败

| 错误类型 | 处理 |
|----------|------|
| 图片资源不存在 | 降级到 Tier 3 |
| Canvas 绘制失败 | 降级到 Tier 3 |

### 5.3 用户提示

- 加载期间：显示骨架屏/Loading 指示器
- 降级发生：静默降级，不打扰用户
- 全部失败：使用默认渐变（兜底）

---

## 6. 缓存策略

### 6.1 内存缓存

```typescript
class BackgroundCache {
  private cache = new Map<string, BackgroundConfig>();
  private ttl = 1000 * 60 * 60; // 1 小时

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

  set(key: string, config: BackgroundConfig): void {
    this.cache.set(key, { config, timestamp: Date.now() });
  }
}
```

### 6.2 缓存键

- 主键：`bookTitle`
- 备选：`bookTitle + author`（更精确）

---

## 7. 配置设计

### 7.1 全局开关

```typescript
// Settings 接口
interface AppSettings {
  enableBookCoverBackground: boolean;  // 新增
  // ... existing settings
}

// 设置页 UI
<Checkbox
  label="启用书籍封面背景"
  checked={settings.enableBookCoverBackground}
  onChange={(checked) => updateSettings({ enableBookCoverBackground: checked })}
/>
```

### 7.2 默认值

```typescript
const DEFAULT_SETTINGS: AppSettings = {
  enableBookCoverBackground: true,  // 默认启用
  // ...
};
```

---

## 8. 性能优化

### 8.1 图片加载优化

- 使用 `crossOrigin = 'anonymous'` 处理 CORS
- 缩小 Canvas 尺寸（100x140）进行颜色提取
- 采样时跳像素（step = 4）减少计算量

### 8.2 纹理优化

- 使用 Base64 内联小尺寸纹理（<5KB）
- 或使用 CSS 生成纹理（噪点 + 渐变）

### 8.3 渲染优化

- 背景与画布分层渲染
- 背景层可复用（同一本书不重绘）

---

## 9. UI/UX 细节

### 9.1 加载状态

```tsx
{!backgroundLoaded && (
  <div className="absolute inset-0 flex items-center justify-center">
    <LoadingSpinner />
  </div>
)}
```

### 9.2 遮罩层

- 渐变不透明度：顶部 75% → 中部 55% → 底部 65%
- 确保文字区域对比度 ≥ 4.5:1

### 9.3 纹理选择表

| 序号 | 纹理名称 | 适配书籍类型 |
|------|----------|--------------|
| 1 | 宣纸纹 | 古典文学、诗词 |
| 2 | 绢布纹 | 历史、传记 |
| 3 | 木纹 | 哲学、社科 |
| 4 | 石纹 | 学术、理论 |
| 5 | 竹纹 | 散文、随笔 |
| 6 | 云纹 | 奇幻、武侠 |
| 7 | 水纹 | 文学小说 |
| 8 | 山纹 | 历史、地理 |
| 9 | 花鸟纹 | 女性文学 |
| 10 | 几何纹 | 科幻、推理 |

---

## 10. 测试要点

### 10.1 功能测试

- [ ] API 成功场景
- [ ] API 失败降级场景
- [ ] 纹理加载场景
- [ ] 默认渐变兜底场景
- [ ] 缓存命中场景

### 10.2 边界测试

- [ ] 书名包含特殊字符
- [ ] 书名超长
- [ ] 书名重复（不同作者）
- [ ] 无书名场景

### 10.3 性能测试

- [ ] 首次加载时间 < 2s
- [ ] 缓存命中加载 < 100ms
- [ ] 内存占用 < 10MB

---

## 11. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/utils/coverExtractor.ts` | 新增 | 封面提取核心逻辑 |
| `src/utils/cardRenderer.ts` | 修改 | 支持背景配置参数 |
| `src/components/CardCanvas.tsx` | 修改 | 加载状态管理 |
| `src/components/Settings.tsx` | 修改 | 新增全局开关 |
| `src/types/index.ts` | 修改 | 新增 BackgroundConfig 类型 |
| `public/textures/*.png` | 新增 | 10 种纹理图片 |
| `src/utils/backgroundCache.ts` | 新增 | 缓存管理 |

---

## 12. 验收标准

1. ✅ 启用开关后，卡片背景与书籍关联
2. ✅ API 失败时静默降级，不影响使用
3. ✅ 文字清晰可读（对比度达标）
4. ✅ 缓存生效，重复书籍不重复请求
5. ✅ 关闭开关后恢复纯色背景

---

## 13. 后续优化建议

1. **本地缓存**: 使用 localStorage 持久化缓存
2. **纹理扩展**: 更多纹理类型（中国风、现代风等）
3. **元素识别**: 更智能的图案检测（ML 模型）
4. **用户自定义**: 允许用户上传封面图片
