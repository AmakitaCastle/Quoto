# JSON 风格配置迁移 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将风格配置从 TypeScript 文件迁移到 JSON 文件，实现配置与代码分离，新增风格时只需修改 JSON 文件。

**Architecture:** 创建 `src/data/styles.json` 存储风格数据，修改 `StylePicker.data.ts` 从 JSON 导入并导出类型化数组。

**Tech Stack:** JSON, TypeScript, Vite (处理 JSON 导入)

---

## Chunk 1: 创建 JSON 配置文件

### Task 1: 创建 styles.json 文件

**Files:**
- Create: `src/data/styles.json`
- Modify: `src/components/StylePicker.data.ts`

- [ ] **Step 1: 创建 src/data/ 目录**

```bash
mkdir -p src/data
```

- [ ] **Step 2: 创建 styles.json 文件**

将当前 `StylePicker.data.ts` 中的 10 种风格配置迁移到 JSON 格式：

```json
{
  "styles": [
    {
      "id": "dark-gold",
      "name": "暗金",
      "background": "linear-gradient(135deg, #1a1510 0%, #0d0d0d 100%)",
      "border": "#2a2520",
      "accentColor": "#d0b87c",
      "textColor": "#d0b87c",
      "quoteColor": "#d0b87c"
    },
    {
      "id": "parchment",
      "name": "羊皮纸",
      "background": "linear-gradient(135deg, #f5f0e6 0%, #e8e0d0 100%)",
      "border": "#d4c9b8",
      "accentColor": "#2a1810",
      "textColor": "#0b0800",
      "quoteColor": "#0b0800"
    },
    {
      "id": "ink-green",
      "name": "墨绿",
      "background": "linear-gradient(135deg, #1a2f2a 0%, #0d1a16 100%)",
      "border": "#2a3f3a",
      "accentColor": "#81c1a1",
      "textColor": "#81c1a1",
      "quoteColor": "#81c1a1"
    },
    {
      "id": "pure-black",
      "name": "纯黑",
      "background": "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)",
      "border": "#2a2a2a",
      "accentColor": "#c1c1c1",
      "textColor": "#c1c1c1",
      "quoteColor": "#c1c1c1"
    },
    {
      "id": "ink-wash",
      "name": "水墨",
      "background": "linear-gradient(135deg, #f7f4ef 0%, #ede9e2 100%)",
      "border": "#d8d4cc",
      "accentColor": "#1e1408",
      "textColor": "#1e1408",
      "quoteColor": "rgba(20,15,8,0.45)"
    },
    {
      "id": "xuan-paper",
      "name": "宣纸",
      "background": "linear-gradient(135deg, #f0e8d8 0%, #e4d8c4 100%)",
      "border": "#ccc0a8",
      "accentColor": "#a05014",
      "textColor": "#2a1808",
      "quoteColor": "#a05014"
    },
    {
      "id": "night-ink",
      "name": "夜墨",
      "background": "linear-gradient(135deg, #0e0e14 0%, #080810 100%)",
      "border": "#1e1e2a",
      "accentColor": "#8c78dc",
      "textColor": "#c8c4e0",
      "quoteColor": "#8c78dc"
    },
    {
      "id": "deep-autumn",
      "name": "深秋",
      "background": "linear-gradient(135deg, #1c1208 0%, #100a04 100%)",
      "border": "#2c1e10",
      "accentColor": "#c87828",
      "textColor": "#e0c89a",
      "quoteColor": "#c87828"
    },
    {
      "id": "first-snow",
      "name": "初雪",
      "background": "linear-gradient(135deg, #f8f8fc 0%, #eeeef6 100%)",
      "border": "#d8d8e8",
      "accentColor": "#6478b4",
      "textColor": "#1a1e2e",
      "quoteColor": "rgba(100,120,180,0.55)"
    },
    {
      "id": "spring-day",
      "name": "春日",
      "background": "linear-gradient(135deg, #f4f8ee 0%, #e8f0e0 100%)",
      "border": "#c8d8b8",
      "accentColor": "#4a8c3c",
      "textColor": "#1a2414",
      "quoteColor": "rgba(74,140,60,0.6)"
    }
  ]
}
```

- [ ] **Step 3: 创建 styles.json.d.ts 类型声明文件**

创建 `src/data/styles.json.d.ts` 提供 TypeScript 类型支持：

```typescript
import { CardStyle } from '@/types';

export interface StylesData {
  styles: CardStyle[];
}

declare const styles: StylesData;
export default styles;
```

- [ ] **Step 4: 修改 StylePicker.data.ts 从 JSON 导入**

```typescript
/**
 * 风格配置数据
 *
 * 从 JSON 配置文件导入风格数据。
 * 新增风格时只需编辑 src/data/styles.json，无需修改此文件。
 *
 * @package src/components
 */

import stylesData from '@/data/styles.json';
import { CardStyle } from '@/types';

/**
 * 内置风格配置数组
 *
 * 风格顺序即为 StylePicker 选择器的展示顺序。
 */
export const STYLES: CardStyle[] = stylesData.styles;
```

- [ ] **Step 5: 运行 TypeScript 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无错误

- [ ] **Step 6: 运行项目验证**

```bash
npm run dev
```

Expected: 项目正常启动，风格选择器显示 10 种风格

- [ ] **Step 7: 提交**

```bash
git add src/data/styles.json src/data/styles.json.d.ts src/components/StylePicker.data.ts
git commit -m "refactor: migrate style config to JSON for easier customization"
```

---

## Chunk 2: 更新文档

### Task 2: 更新 README 和项目文档

**Files:**
- Modify: `README.md`

- [ ] **Step 1: 更新 README.md 添加新风格添加说明**

在"添加新风格"章节更新说明：

```markdown
## 添加新风格

编辑 `src/data/styles.json`，添加新的风格配置：

```json
{
  "styles": [
    {
      "id": "your-style-id",
      "name": "风格名称",
      "background": "linear-gradient(135deg, #start 0%, #end 100%)",
      "border": "#xxxxxx",
      "accentColor": "#xxxxxx",
      "textColor": "#xxxxxx",
      "quoteColor": "#xxxxxx"
    }
  ]
}
```

保存即可生效，无需重启开发服务器（Vite 会自动热更新）。

**配置字段说明：**
- `id`: 风格唯一标识（英文 + 短横线格式）
- `name`: 显示名称（中文）
- `background`: CSS 渐变背景
- `border`: 边框颜色（预留）
- `accentColor`: 强调色（书名、作者、分隔线）
- `textColor`: 正文颜色
- `quoteColor`: 引号颜色（可选）
```

- [ ] **Step 2: 提交**

```bash
git add README.md
git commit -m "docs: update style customization guide for JSON config"
```

---

## Verification

完成后验证：
1. 风格选择器正常显示 10 种风格
2. 点击风格按钮正常切换
3. 卡片渲染颜色正确
