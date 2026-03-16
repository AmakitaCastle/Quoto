# Font Picker Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在风格选择器下方添加字体选择器，支持正文和书名/作者分别配置不同字体，并能识别用户电脑上的已安装字体。

**Architecture:**
- 使用 Tauri 系统命令获取完整字体列表（方案 B）
- 预设精选字体配置存储在 `fonts.json` 中
- 添加 `FontPicker` 组件，支持正文字体和手写字体分别选择
- 扩展 `CardData` 类型，添加字体配置字段

**Tech Stack:** Tauri 2.x, React 18, TypeScript, Rust (系统字体检测)

---

## Chunk 1: 类型定义和字体配置

### Task 1: 扩展 CardData 类型

**Files:**
- Modify: `src/types/index.ts:16-36`

- [ ] **Step 1: 修改 CardData 接口**

在 `src/types/index.ts` 中为 `CardData` 添加字体字段：

```typescript
export interface CardData {
  /** 书摘句子内容（必填） */
  quote: string;

  /** 书名（必填，渲染时会自动添加书名号《》） */
  bookTitle: string;

  /** 作者（可选） */
  author?: string;

  /** 风格 ID，决定卡片的配色方案 */
  styleId: CardStyleId;

  /**
   * 卡片方向（可选）
   * - 'vertical': 竖版卡片（宽度 800px）
   * - 'horizontal': 横版卡片（宽度 1000px）
   * - 'auto': 自动根据内容选择（默认）
   */
  orientation?: 'vertical' | 'horizontal' | 'auto';

  /**
   * 正文字体（可选）
   * 默认使用系统字体 "PingFang SC", "Microsoft YaHei", sans-serif
   */
  fontFamily?: string;

  /**
   * 书名/作者字体（可选）
   * 默认使用手写字体 "ZCOOL QingKe HuangYou", "Caveat", cursive
   */
  handwritingFont?: string;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS（无错误）

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat(types): 为 CardData 添加字体配置字段"
```

---

### Task 2: 创建字体配置文件

**Files:**
- Create: `src/data/fonts.json`
- Create: `src/data/fonts.json.d.ts`

- [ ] **Step 1: 创建 fonts.json**

```json
{
  "bodyFonts": [
    {
      "id": "system",
      "name": "系统默认",
      "family": "\"PingFang SC\", \"Microsoft YaHei\", sans-serif",
      "preview": "系统默认字体"
    },
    {
      "id": "songti",
      "name": "思源宋体",
      "family": "\"Noto Serif SC\", serif",
      "preview": "思源宋体是一种专门针对中文印刷设计的字体"
    },
    {
      "id": "kaiti",
      "name": "楷体",
      "family": "\"KaiTi\", \"STKaiti\", cursive",
      "preview": "楷体是汉字书法的印刷字体"
    },
    {
      "id": "fangsong",
      "name": "仿宋",
      "family": "\"FangSong\", \"STFangSong\", cursive",
      "preview": "仿宋是一种传统的印刷字体风格"
    },
    {
      "id": "heiti",
      "name": "黑体",
      "family": "\"Heiti SC\", \"Microsoft YaHei\", sans-serif",
      "preview": "黑体是一种无衬线的印刷字体"
    }
  ],
  "handwritingFonts": [
    {
      "id": "zcool",
      "name": "站酷庆科黄油体",
      "family": "\"ZCOOL QingKe HuangYou\", cursive",
      "preview": "站酷庆科黄油体"
    },
    {
      "id": "caveat",
      "name": "Caveat",
      "family": "\"Caveat\", cursive",
      "preview": "Caveat"
    },
    {
      "id": "dancing",
      "name": "Dancing Script",
      "family": "\"Dancing Script\", cursive",
      "preview": "Dancing Script"
    },
    {
      "id": "greatvibes",
      "name": "Great Vibes",
      "family": "\"Great Vibes\", cursive",
      "preview": "Great Vibes"
    },
    {
      "id": "yesteryear",
      "name": "Yesteryear",
      "family": "\"Yesteryear\", cursive",
      "preview": "Yesteryear"
    }
  ]
}
```

- [ ] **Step 2: 创建类型声明文件**

```typescript
import { FontConfig } from '@/types';

export interface FontsData {
  bodyFonts: FontConfig[];
  handwritingFonts: FontConfig[];
}

declare const fonts: FontsData;
export default fonts;
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS（无错误）

- [ ] **Step 4: 提交**

```bash
git add src/data/fonts.json src/data/fonts.json.d.ts
git commit -m "feat(data): 添加预设字体配置文件"
```

---

### Task 3: 添加 FontConfig 类型

**Files:**
- Modify: `src/types/index.ts:124-124`

- [ ] **Step 1: 在 StyleGroup 接口后添加 FontConfig 接口**

```typescript
/**
 * 风格分组配置接口
 *
 * 用于将风格按类别分组展示，支持 Tab 分页式选择器。
 */
export interface StyleGroup {
  /** 分组唯一标识 */
  id: string;

  /** 分组显示名称，如"经典四色"、"中式气质" */
  name: string;

  /** 该分组包含的风格 ID 列表 */
  styles: CardStyleId[];
}

/**
 * 字体配置接口
 *
 * 用于定义可选字体的配置信息。
 */
export interface FontConfig {
  /** 字体唯一标识 */
  id: string;

  /** 字体显示名称 */
  name: string;

  /** CSS font-family 值 */
  family: string;

  /** 预览文字 */
  preview: string;
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/types/index.ts
git commit -m "feat(types): 添加 FontConfig 接口"
```

---

## Chunk 2: Tauri 系统字体检测

### Task 4: 添加 Tauri 系统字体检测命令

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 添加系统字体依赖**

在 `src-tauri/Cargo.toml` 中添加：

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
tauri-plugin-clipboard-manager = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
base64 = "0.21"
# 新增：系统字体检测
dirs = "5.0"
```

- [ ] **Step 2: 添加 get_system_fonts 命令**

在 `src-tauri/src/main.rs` 中添加：

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;

#[derive(Serialize)]
struct FontInfo {
    name: String,
    family: String,
    is_system: bool,
}

#[tauri::command]
fn get_system_fonts() -> Result<Vec<FontInfo>, String> {
    // macOS: 使用 fontconfig 或系统 API
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;

        // 使用 system_profiler 获取字体列表
        let output = Command::new("system_profiler")
            .arg("SPFontsDataType")
            .output()
            .map_err(|e| format!("Failed to execute system_profiler: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);

        // 解析输出，提取字体名称
        let mut fonts = Vec::new();
        for line in output_str.lines() {
            if line.contains("Name:") {
                let name = line.split(':').nth(1)
                    .unwrap_or("")
                    .trim()
                    .to_string();
                if !name.is_empty() {
                    fonts.push(FontInfo {
                        name: name.clone(),
                        family: name,
                        is_system: true,
                    });
                }
            }
        }

        // 限制返回数量，避免列表过长
        fonts.truncate(500);
        return Ok(fonts);
    }

    // Linux: 使用 fc-list
    #[cfg(target_os = "linux")]
    {
        use std::process::Command;

        let output = Command::new("fc-list")
            .arg("--format=%{family}\\n")
            .output()
            .map_err(|e| format!("Failed to execute fc-list: {}", e))?;

        let output_str = String::from_utf8_lossy(&output.stdout);
        let mut fonts = Vec::new();
        let mut seen = std::collections::HashSet::new();

        for line in output_str.lines() {
            let family = line.trim();
            if !family.is_empty() && seen.insert(family.to_string()) {
                fonts.push(FontInfo {
                    name: family.to_string(),
                    family: family.to_string(),
                    is_system: true,
                });
            }
        }

        fonts.truncate(500);
        return Ok(fonts);
    }

    // Windows: 从注册表读取
    #[cfg(target_os = "windows")]
    {
        // 简化实现：返回常见 Windows 字体
        return Ok(vec![
            FontInfo { name: "Microsoft YaHei".to_string(), family: "Microsoft YaHei".to_string(), is_system: true },
            FontInfo { name: "SimSun".to_string(), family: "SimSun".to_string(), is_system: true },
            FontInfo { name: "SimHei".to_string(), family: "SimHei".to_string(), is_system: true },
            FontInfo { name: "KaiTi".to_string(), family: "KaiTi".to_string(), is_system: true },
            FontInfo { name: "FangSong".to_string(), family: "FangSong".to_string(), is_system: true },
        ]);
    }

    #[cfg(not(any(target_os = "macos", target_os = "linux", target_os = "windows")))]
    {
        Ok(vec![])
    }
}

#[tauri::command]
async fn save_image(
    app_handle: tauri::AppHandle,
    data_url: String,
    filename: String,
) -> Result<String, String> {
    // ... 现有代码保持不变
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![save_image, get_system_fonts])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 3: 构建 Tauri 应用验证 Rust 代码**

```bash
cd src-tauri && cargo check
```
Expected: PASS（可能有 warning，但无 error）

- [ ] **Step 4: 提交**

```bash
git add src-tauri/Cargo.toml src-tauri/src/main.rs
git commit -m "feat(rust): 添加 get_system_fonts 系统命令"
```

---

## Chunk 3: React 字体检测 Hook

### Task 5: 创建字体检测 Hook

**Files:**
- Create: `src/hooks/useFontDetector.ts`

- [ ] **Step 1: 创建 useFontDetector Hook**

```typescript
/**
 * 字体检测 Hook
 *
 * 调用 Tauri 系统命令获取用户电脑上已安装的字体列表。
 *
 * @package src/hooks
 */

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

/** 字体信息 */
export interface SystemFont {
  /** 字体名称 */
  name: string;

  /** CSS font-family 值 */
  family: string;

  /** 是否为系统字体 */
  is_system: boolean;
}

/**
 * 字体检测器 Hook
 * @returns 字体列表、加载状态、错误信息
 */
export function useFontDetector() {
  const [fonts, setFonts] = useState<SystemFont[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFonts() {
      try {
        const result = await invoke<SystemFont[]>('get_system_fonts');
        setFonts(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fonts');
      } finally {
        setLoading(false);
      }
    }

    loadFonts();
  }, []);

  return { fonts, loading, error };
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/hooks/useFontDetector.ts
git commit -m "feat(hooks): 添加 useFontDetector 字体检测 Hook"
```

---

## Chunk 4: FontPicker 组件

### Task 6: 创建 FontPicker 组件

**Files:**
- Create: `src/components/FontPicker.tsx`

- [ ] **Step 1: 创建 FontPicker 组件**

```typescript
/**
 * 字体选择器组件
 *
 * 提供正文字体和手写字体两种选择器，支持预设字体和系统字体。
 *
 * @package src/components
 */

import { useState } from 'react';
import { FontConfig } from '@/types';
import fontsData from '@/data/fonts.json';

/** FontPicker 组件的属性 */
interface FontPickerProps {
  /** 字体类型 */
  type: 'body' | 'handwriting';

  /** 当前选中的字体 ID */
  selectedFont: string;

  /** 字体变化回调 */
  onFontChange: (fontFamily: string) => void;
}

/**
 * 字体选择器组件
 *
 * 支持两种模式：
 * - body: 正文字体选择（宋体、黑体、楷体等）
 * - handwriting: 书名/作者手写体选择（站酷、Caveat 等）
 *
 * 字体列表包含：
 * - 预设精选字体（来自 fonts.json）
 * - 系统已安装字体（通过 Tauri 命令获取，可选扩展）
 *
 * @param props - 组件属性
 */
export function FontPicker({ type, selectedFont, onFontChange }: FontPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根据类型获取字体列表
  const fontList = type === 'body' ? fontsData.bodyFonts : fontsData.handwritingFonts;

  // 获取当前选中的字体名称
  const selectedFontConfig = fontList.find((f) => f.family === selectedFont);
  const selectedFontName = selectedFontConfig?.name || '自定义';

  const label = type === 'body' ? '正文字体' : '书名/作者字体';

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>

      {/* 当前选中字体显示 */}
      <div className="relative">
        <button
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 text-left flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontFamily: selectedFont }}
        >
          <span>{selectedFontName}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 下拉字体列表 */}
        {isExpanded && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg max-h-64 overflow-y-auto">
            {fontList.map((font) => (
              <button
                key={font.id}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] ${
                  selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
                }`}
                style={{ fontFamily: font.family }}
                onClick={() => {
                  onFontChange(font.family);
                  setIsExpanded(false);
                }}
              >
                <div className="font-medium">{font.name}</div>
                <div className="text-xs text-gray-500 truncate">{font.preview}</div>
              </button>
            ))}

            {/* 系统字体入口（可选扩展） */}
            <div className="border-t border-[#2a2a2a] mt-1 pt-1">
              <button
                className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
                onClick={() => {
                  // 后续扩展：打开系统字体选择器
                }}
              >
                更多系统字体...
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat(components): 添加 FontPicker 字体选择器组件"
```

---

## Chunk 5: 集成到 InputPanel

### Task 7: 更新 App.tsx 添加字体状态

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: 修改 App.tsx**

```typescript
/**
 * 字句应用主入口
 *
 * 书摘卡片生成应用的主界面。
 * 左侧为输入面板（包含风格选择器、字体选择器），右侧为预览面板。
 * 使用可调节宽度的分栏布局。
 *
 * @package src
 */

import { useState } from 'react';
import { Resizable } from 're-resizable';
import { InputPanel } from './components/InputPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { CardData } from './types';

/**
 * 应用根组件
 *
 * 管理全局状态（cardData），协调左右两栏的交互：
 * - 左栏：输入面板（书摘、书名、作者、风格、字体选择器）
 * - 右栏：预览面板（实时预览、保存、复制）
 *
 * 布局特点：
 * - 左栏可拖动调节宽度（300px - 600px）
 * - 右栏自动填充剩余空间
 * - 深色主题配色
 */
function App() {
  // 卡片数据状态（包含字体配置）
  const [cardData, setCardData] = useState<CardData>({
    quote: '',
    bookTitle: '',
    author: '',
    styleId: 'dark-gold',
    fontFamily: '"PingFang SC", "Microsoft YaHei", sans-serif',
    handwritingFont: '"ZCOOL QingKe HuangYou", "Caveat", cursive',
  });

  /**
   * 更新卡片数据
   * @param data - 部分更新数据
   */
  const handleDataChange = (data: Partial<CardData>) => {
    setCardData((prev) => ({ ...prev, ...data }));
  };

  /** 保存卡片回调（目前为空，由 PreviewPanel 直接处理下载） */
  const handleSave = () => {};

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0f0f]">
      {/* 左栏 - 可调节宽度 */}
      <Resizable
        defaultSize={{ width: '42%', height: '100%' }}
        minWidth={300}
        maxWidth={600}
        handleClasses={{
          right: 'w-1 bg-[#2a2a2a] hover:bg-gold transition-colors cursor-col-resize',
        }}
      >
        <InputPanel
          data={cardData}
          onDataChange={handleDataChange}
          onSave={handleSave}
          onStyleChange={(styleId) => handleDataChange({ styleId })}
          onFontChange={(type, fontFamily) =>
            handleDataChange(type === 'body' ? { fontFamily } : { handwritingFont: fontFamily })
          }
        />
      </Resizable>

      {/* 右栏 - 预览区 */}
      <div className="flex-1">
        <PreviewPanel data={cardData} onDataChange={handleDataChange} />
      </div>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/App.tsx
git commit -m "feat(app): 添加字体状态管理"
```

---

### Task 8: 更新 InputPanel 添加字体选择器

**Files:**
- Modify: `src/components/InputPanel.tsx`

- [ ] **Step 1: 修改 InputPanel.tsx**

```typescript
/**
 * 输入面板组件
 *
 * 提供用户输入书摘信息的表单界面。
 * 包含句子、书名、作者三个输入字段，以及风格选择器、字体选择器和保存按钮。
 *
 * @package src/components
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardData } from '@/types';
import { SAMPLE_QUOTES } from '@/data/sampleQuotes';
import { StylePicker } from './StylePicker';
import { FontPicker } from './FontPicker';

/** 输入面板组件的属性 */
interface InputPanelProps {
  /** 当前卡片数据 */
  data: CardData;

  /** 数据变化回调，接收部分更新 */
  onDataChange: (data: Partial<CardData>) => void;

  /** 保存按钮点击回调 */
  onSave: () => void;

  /** 风格变化回调 */
  onStyleChange?: (styleId: CardData['styleId']) => void;

  /** 字体变化回调 */
  onFontChange?: (type: 'body' | 'handwriting', fontFamily: string) => void;
}

/**
 * 输入面板组件
 *
 * 位于应用左侧的输入区域，用户可以：
 * - 输入或粘贴书摘句子
 * - 输入书名和作者
 * - 点击"填充示例"快速填入预设内容
 * - 选择风格、字体
 * - 点击"保存卡片"生成并下载图片
 *
 * @param props - 组件属性
 */
export function InputPanel({
  data,
  onDataChange,
  onSave,
  onStyleChange,
  onFontChange,
}: InputPanelProps) {
  /** 填充示例数据 */
  const handleFillSample = () => {
    const randomQuote = SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)];
    onDataChange(randomQuote);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4">
      {/* 句子输入 */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-500">摘抄句子</label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-gold hover:text-gold-hover"
            onClick={handleFillSample}
          >
            填充示例
          </Button>
        </div>
        <textarea
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gold min-h-[100px] resize-none"
          placeholder="写下让你停下来的那句话"
          value={data.quote}
          onChange={(e) => onDataChange({ quote: e.target.value })}
        />
      </div>

      {/* 书名输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">书名</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="书名"
          value={data.bookTitle}
          onChange={(e) => onDataChange({ bookTitle: e.target.value })}
        />
      </div>

      {/* 作者输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">作者</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="作者（选填）"
          value={data.author || ''}
          onChange={(e) => onDataChange({ author: e.target.value })}
        />
      </div>

      {/* 风格选择器 */}
      <div className="mb-4 flex-shrink-0">
        <StylePicker
          selectedStyle={data.styleId}
          onStyleChange={onStyleChange || ((styleId) => onDataChange({ styleId }))}
        />
      </div>

      {/* 正文字体选择器 */}
      <div className="mb-4 flex-shrink-0">
        <FontPicker
          type="body"
          selectedFont={data.fontFamily || '"PingFang SC", "Microsoft YaHei", sans-serif'}
          onFontChange={(fontFamily) => onFontChange?.('body', fontFamily)}
        />
      </div>

      {/* 书名/作者字体选择器 */}
      <div className="mb-4 flex-shrink-0">
        <FontPicker
          type="handwriting"
          selectedFont={data.handwritingFont || '"ZCOOL QingKe HuangYou", "Caveat", cursive'}
          onFontChange={(fontFamily) => onFontChange?.('handwriting', fontFamily)}
        />
      </div>

      {/* 保存按钮 */}
      <div className="mt-auto flex-shrink-0">
        <Button
          className="w-full bg-gold hover:bg-gold-hover text-black font-semibold"
          onClick={onSave}
        >
          保存卡片
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/components/InputPanel.tsx
git commit -m "feat(components): 在 InputPanel 中添加字体选择器"
```

---

## Chunk 6: 渲染器集成

### Task 9: 更新 cardSizeCalculator 使用用户字体

**Files:**
- Modify: `src/utils/cardSizeCalculator.ts:17-38`

- [ ] **Step 1: 修改字体函数，支持自定义字体**

```typescript
/**
 * 正文字体配置
 * @param size - 字体大小（像素）
 * @param fontFamily - 自定义字体（可选）
 * @returns Canvas font 字符串
 */
export const BODY_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `${size}px ${fontFamily}`;
  }
  return `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
};

/**
 * 标题字体配置（中等字重）
 * @param size - 字体大小（像素）
 * @param fontFamily - 自定义字体（可选）
 * @returns Canvas font 字符串
 */
export const TITLE_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `500 ${size}px ${fontFamily}`;
  }
  return `500 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
};

/**
 * 手写字体配置（用于书名和作者）
 * @param size - 字体大小（像素）
 * @param fontFamily - 自定义字体（可选）
 * @returns Canvas font 字符串
 */
export const HANDWRITING_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `italic ${size}px ${fontFamily}`;
  }
  return `italic ${size}px "ZCOOL QingKe HuangYou", "Caveat", cursive`;
};
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add src/utils/cardSizeCalculator.ts
git commit -m "feat(renderer): 为字体函数添加自定义字体支持"
```

---

### Task 10: 更新 cardRenderer 使用用户字体

**Files:**
- Modify: `src/utils/cardRenderer.ts`

- [ ] **Step 1: 修改 renderCardToCanvas 函数签名**

```typescript
/**
 * 在 Canvas 上绘制完整的书摘卡片
 *
 * @param canvas - HTML Canvas 元素
 * @param data - 卡片数据（书摘、书名、作者等）
 * @param style - 风格配置（颜色、背景等）
 * @param quoteStartY - 正文起始 Y 坐标
 * @param openQuoteY - 开引号起始 Y 坐标
 */
export function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  data: CardData,
  style: CardStyle,
  quoteStartY: number,
  openQuoteY: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

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

  const gradient = parseGradient(style.background, ctx, height);
  ctx.fillStyle = gradient ?? style.background;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const textAreaWidth = width - 2 * CONTENT_START_X - SAFE_MARGIN;
  let quoteEndY = quoteStartY;

  if (data.quote.trim()) {
    const quotes = getQuotes(data.quote);

    // ── 开引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font = BODY_FONT(OPENING_QUOTE_SIZE, data.fontFamily);
    ctx.fillText(quotes.open, CONTENT_START_X, openQuoteY);

    // ── 正文 ────────────────────────────────────────────────────────────────
    ctx.fillStyle = style.textColor;
    ctx.font = BODY_FONT(FONT_SIZE, data.fontFamily);
    quoteEndY = wrapText(
      ctx,
      data.quote,
      CONTENT_START_X,
      quoteStartY,
      textAreaWidth,
      FONT_SIZE,
      data.fontFamily
    );

    // ── 闭引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font = BODY_FONT(OPENING_QUOTE_SIZE * 0.75, data.fontFamily);
    ctx.fillText(quotes.close, CONTENT_START_X, quoteEndY + OPENING_QUOTE_SIZE * 0.5);
  }

  // ── 分隔线 ──────────────────────────────────────────────────────────────
  const dividerY = quoteEndY + TEXT_TO_DIVIDER_GAP;
  const dividerWidth = (width - 2 * CONTENT_START_X) * 0.618;
  const dividerStartX = width - CONTENT_START_X - dividerWidth;

  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dividerStartX, dividerY);
  ctx.lineTo(width - CONTENT_START_X, dividerY);
  ctx.stroke();

  // ── 书名 ────────────────────────────────────────────────────────────────
  if (data.bookTitle?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font = HANDWRITING_FONT(BOOK_TITLE_SIZE, data.handwritingFont);

    const openBracketW = ctx.measureText('《').width;
    const titleW = ctx.measureText(data.bookTitle).width;
    const closeBracketW = ctx.measureText('》').width;
    const totalTitleW = openBracketW + titleW + closeBracketW;

    const titleBaseX = width - CONTENT_START_X - totalTitleW;
    const titleY = dividerY + DIVIDER_TO_TITLE_GAP;

    ctx.fillText('《', titleBaseX, titleY);
    ctx.fillText(data.bookTitle, titleBaseX + openBracketW, titleY);
    ctx.fillText('》', titleBaseX + openBracketW + titleW, titleY);
  }

  // ── 作者 ────────────────────────────────────────────────────────────────
  if (data.author?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font = HANDWRITING_FONT(AUTHOR_SIZE, data.handwritingFont);
    const authorW = ctx.measureText(data.author).width;
    ctx.fillText(
      data.author,
      width - CONTENT_START_X - authorW,
      dividerY + DIVIDER_TO_TITLE_GAP + BOOK_TITLE_SIZE + TITLE_TO_AUTHOR_GAP
    );
  }
}
```

- [ ] **Step 2: 修改 wrapText 函数签名**

```typescript
/**
 * 自动换行文本渲染
 *
 * @param ctx - Canvas 2D 上下文
 * @param text - 要渲染的文本
 * @param x - 起始 X 坐标
 * @param y - 起始 Y 坐标
 * @param maxWidth - 最大可用宽度
 * @param fontSize - 字号
 * @param fontFamily - 字体（可选）
 * @param indent - 首行缩进量，默认 2 倍字号
 * @returns 文本结束时的 Y 坐标
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontFamily?: string,
  indent: number = fontSize * 2
): number {
  const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
  const PERIOD = '。';
  const segments = text.split(PERIOD).filter(s => s.trim());
  let currentY = y;

  ctx.font = BODY_FONT(fontSize, fontFamily);

  for (const segment of segments) {
    const firstLineX = x + indent;
    const firstLineWidth = maxWidth - indent;
    const restLineX = x;
    const restLineWidth = maxWidth;

    const chars = segment.split('');
    let line = '';
    let lineX = firstLineX;
    let lineWidth = firstLineWidth;

    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > lineWidth - SAFE_MARGIN && line.length > 0) {
        ctx.fillText(line, lineX, currentY);
        currentY += lineHeight;
        line = chars[i];
        lineX = restLineX;
        lineWidth = restLineWidth;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line, lineX, currentY);
      const lastLineW = ctx.measureText(line).width;
      ctx.fillText(PERIOD, lineX + lastLineW, currentY);
      currentY += lineHeight;
    }
  }

  return currentY;
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/utils/cardRenderer.ts
git commit -m "feat(renderer): 在渲染器中使用用户选择的字体"
```

---

### Task 11: 更新 getCanvasDimensions 使用用户字体

**Files:**
- Modify: `src/utils/cardSizeCalculator.ts:139-191`

- [ ] **Step 1: 修改 getCanvasDimensions 函数**

```typescript
/**
 * 计算 Canvas 尺寸和关键坐标
 *
 * @param ctx - Canvas 2D 上下文（用于测量文字宽度）
 * @param data - 卡片数据
 * @returns Canvas 尺寸和关键坐标
 */
export function getCanvasDimensions(
  ctx: CanvasRenderingContext2D,
  data: CardData
): CanvasDimensions {
  const orientation = data.orientation || 'auto';
  const canvasWidth = orientation === 'horizontal' ? 1000 : 800;
  const lineHeight = FONT_SIZE * LINE_HEIGHT_MULTIPLIER;
  const textAreaWidth = canvasWidth - 2 * CONTENT_START_X - SAFE_MARGIN;

  ctx.font = BODY_FONT(FONT_SIZE, data.fontFamily);

  const { lineCount } = calculateWrapText(
    ctx,
    data.quote,
    textAreaWidth,
    lineHeight,
    FONT_SIZE,
    data.fontFamily
  );

  const quoteHeight = lineCount * lineHeight;

  const metaHeight =
    TEXT_TO_DIVIDER_GAP +
    DIVIDER_TO_TITLE_GAP +
    BOOK_TITLE_SIZE +
    TITLE_TO_AUTHOR_GAP +
    AUTHOR_SIZE;

  const openQuoteY = VERTICAL_MARGIN + OPENING_QUOTE_SIZE;
  const quoteStartY = openQuoteY + OPENING_QUOTE_TO_TEXT + FONT_SIZE;

  const totalHeight =
    VERTICAL_MARGIN +
    OPENING_QUOTE_SIZE +
    OPENING_QUOTE_TO_TEXT +
    FONT_SIZE +
    quoteHeight +
    metaHeight +
    VERTICAL_MARGIN;

  return {
    width: canvasWidth,
    height: Math.round(totalHeight),
    quoteStartY: Math.round(quoteStartY),
    openQuoteY: Math.round(openQuoteY),
  };
}
```

- [ ] **Step 2: 修改 calculateWrapText 函数**

```typescript
/**
 * 计算文本换行后的行数和总高度
 *
 * @param ctx - Canvas 2D 上下文
 * @param text - 要测量的文本
 * @param maxWidth - 最大可用宽度
 * @param lineHeight - 行高
 * @param fontSize - 字号
 * @param fontFamily - 字体（可选）
 * @returns 行数和总高度
 */
export function calculateWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  fontSize: number = 32,
  fontFamily?: string
): { lineCount: number; totalHeight: number } {
  ctx.font = BODY_FONT(fontSize, fontFamily);

  const characters = text.split('');
  let line = '';
  let lineCount = 0;

  for (let i = 0; i < characters.length; i++) {
    const testLine = line + characters[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth - SAFE_MARGIN && line.length > 0) {
      lineCount++;
      line = characters[i];
    } else {
      line = testLine;
    }
  }

  if (line) lineCount++;

  return {
    lineCount,
    totalHeight: lineCount * lineHeight,
  };
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```
Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add src/utils/cardSizeCalculator.ts
git commit -m "feat(renderer): 在尺寸计算中使用用户字体"
```

---

## Chunk 7: 测试和验证

### Task 12: 端到端测试

**Files:**
- 无需修改文件

- [ ] **Step 1: 启动开发服务器**

```bash
npm run dev
```
Expected: 应用正常启动，无编译错误

- [ ] **Step 2: 验证 UI 布局**

检查 InputPanel 的显示顺序：
1. 摘抄句子（带"填充示例"按钮）
2. 书名
3. 作者
4. 风格选择器
5. **正文字体选择器** ← 新增
6. **书名/作者字体选择器** ← 新增
7. 保存卡片

- [ ] **Step 3: 验证字体选择功能**

1. 点击正文字体下拉，确认预设字体列表显示正常
2. 选择不同字体，确认选中状态正确更新
3. 点击书名/作者字体下拉，确认手写字体列表显示正常
4. 选择不同字体，确认选中状态正确更新

- [ ] **Step 4: 验证渲染效果**

1. 在输入面板填写书摘内容
2. 选择不同的正文字体，观察右侧预览变化
3. 选择不同的书名/作者字体，观察右侧预览变化
4. 确认保存的卡片使用正确的字体

- [ ] **Step 5: 验证 Tauri 构建**

```bash
npm run tauri build
```
Expected: 构建成功，生成可执行文件

---

## 总结

本计划共 12 个任务，分为 7 个 Chunk：

| Chunk | 任务数 | 描述 |
|-------|--------|------|
| 1. 类型定义和字体配置 | 3 | CardData 扩展、fonts.json 配置、FontConfig 类型 |
| 2. Tauri 系统字体检测 | 1 | Rust 命令实现 |
| 3. React 字体检测 Hook | 1 | useFontDetector Hook |
| 4. FontPicker 组件 | 1 | 字体选择器 UI |
| 5. 集成到 InputPanel | 2 | App.tsx、InputPanel.tsx |
| 6. 渲染器集成 | 3 | cardRenderer、cardSizeCalculator |
| 7. 测试和验证 | 1 | 端到端测试 |

预计完成时间：约 60-90 分钟
