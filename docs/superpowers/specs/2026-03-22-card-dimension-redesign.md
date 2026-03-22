# 卡片尺寸系统重设计方案

**日期**: 2026-03-22
**作者**: Claude
**状态**: 待实现

---

## 1. 概述

### 1.1 背景
当前卡片系统存在以下问题：
- 宽度只有两档（800px/1000px），缺少灵活性
- Auto 模式未真正实现
- 宽高比不固定，高度纯动态计算
- 预览失真

### 1.2 目标
重新设计卡片尺寸系统，采用固定宽高比 + 三档分辨率的方案。

### 1.3 设计决策
基于用户选择：
- **宽高比切换**: 下拉选择器（竖屏 3:4 / 方形 1:1 / 横屏 4:3）
- **分辨率**: 隐藏配置，导出时提供选项
- **默认比例**: 竖屏 3:4

---

## 2. 新尺寸系统

### 2.1 宽高比定义

| 比例 | 名称 | 宽度 | 高度 | 适用场景 |
|------|------|------|------|----------|
| 3:4 | 竖屏 | 基准宽度 | 基准宽度 × 4/3 | 手机阅读、长文本 |
| 1:1 | 方形 | 基准宽度 | 基准宽度 | 社交媒体、Instagram |
| 4:3 | 横屏 | 基准宽度 | 基准宽度 × 3/4 | 宽屏展示、短文本 |

### 2.2 分辨率档位（导出时选择）

| 档位 | 基准宽度 | 用途 |
|------|----------|------|
| Compact | 500px | 社交媒体、快速分享 |
| Standard | 700px | 通用场景、默认推荐 |
| Large | 900px | 打印、高清展示 |

### 2.3 Canvas 渲染逻辑

```typescript
// 渲染分辨率 = 基准宽度 × 2 (Retina 优化)
const renderWidth = baseWidth * 2;
const renderHeight = baseWidth * aspectRatio * 2;

// CSS 显示尺寸自适应
// 通过 CSS aspect-ratio 保持比例
```

---

## 3. 界面设计

### 3.1 方向选择器（下拉菜单）

```
[竖屏 3:4 ▼]
  ├─ 竖屏 3:4  📱
  ├─ 方形 1:1  ⬜
  └─ 横屏 4:3  🖥️
```

**位置**: PreviewPanel 顶部，替换现有的三个按钮

**交互**:
- 点击展开下拉菜单
- 选择后自动重新渲染卡片
- 记住用户上次选择（localStorage）

### 3.2 导出分辨率选择（保存对话框）

```
保存图片
━━━━━━━━━━━━━━
文件名: 书摘_论语.png

分辨率:
○ 小 (500px)    - 适合社交媒体
● 中 (700px)    - 推荐
○ 大 (900px)    - 高清打印

[取消]  [保存]
```

---

## 4. 数据结构变更

### 4.1 CardData 类型

```typescript
interface CardData {
  quote: string;
  bookTitle: string;
  author?: string;
  styleId: CardStyleId;

  // 新字段
  aspectRatio: '3:4' | '1:1' | '4:3';  // 默认 '3:4'

  // 废弃字段（保留兼容）
  orientation?: 'vertical' | 'horizontal' | 'auto';  // 废弃
}
```

### 4.2 尺寸计算器

```typescript
// 根据宽高比计算尺寸
function getCardDimensions(
  baseWidth: number,
  aspectRatio: '3:4' | '1:1' | '4:3'
): { width: number; height: number } {
  const ratios = {
    '3:4': 4/3,
    '1:1': 1,
    '4:3': 3/4
  };

  return {
    width: baseWidth,
    height: Math.round(baseWidth * ratios[aspectRatio])
  };
}
```

---

## 5. 实现细节

### 5.1 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/index.ts` | 修改 | 更新 CardData 接口 |
| `src/utils/cardSizeCalculator.ts` | 修改 | 新增尺寸计算函数 |
| `src/components/PreviewPanel.tsx` | 修改 | 替换方向选择器为下拉菜单 |
| `src/components/CardCanvas.tsx` | 修改 | 更新渲染逻辑 |
| `src/components/ExportDialog.tsx` | 新增 | 导出分辨率选择对话框 |

### 5.2 CSS 自适应显示

```css
.card-canvas {
  max-width: 100%;
  height: auto;
  aspect-ratio: var(--card-aspect-ratio);
}
```

### 5.3 迁移策略

1. 保留 `orientation` 字段兼容旧数据
2. 旧数据映射：`vertical` → `3:4`, `horizontal` → `4:3`, `auto` → `3:4`
3. 新版本发布后逐步清理兼容代码

---

## 6. 验收标准

- [ ] 下拉选择器显示三个宽高比选项
- [ ] 切换宽高比后卡片实时重新渲染
- [ ] 默认使用竖屏 3:4 比例
- [ ] 导出时弹出分辨率选择对话框
- [ ] 三种分辨率档位正常工作
- [ ] 卡片显示自适应容器宽度
- [ ] 旧数据兼容正常

---

## 7. 后续优化

1. **手势支持**: 左右滑动切换宽高比
2. **预设模板**: 常用尺寸组合保存为模板
3. **批量导出**: 同一书摘导出多种尺寸
