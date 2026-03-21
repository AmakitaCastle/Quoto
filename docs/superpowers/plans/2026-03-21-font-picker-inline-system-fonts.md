# 字体选择器系统字体内联分批加载实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将字体选择器的"更多系统字体"功能从模态对话框改为下拉列表内联分批显示

**Architecture:**
- 移除模态对话框组件和相关的状态管理
- 在下拉列表中添加系统字体内联显示逻辑
- 使用滚动事件监听实现分批加载（每批 20 个字体）
- 利用 `loadingSystemFonts` 状态作为天然防抖标志位

**Tech Stack:** React 18, TypeScript, Tauri v2

---

## Chunk 1: 清理组件状态和类型定义

### Task 1: 更新组件状态变量

**Files:**
- Modify: `src/components/FontPicker.tsx`

**当前状态变量（需要清理）:**
```typescript
const [showSystemFonts, setShowSystemFonts] = useState(false);      // ❌ 移除
const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);   // ✅ 保留
const [loadingFonts, setLoadingFonts] = useState(false);            // ⚠️ 重命名为 loadingSystemFonts
const [displayCount, setDisplayCount] = useState(5);                // ⚠️ 重命名为 systemFontDisplayCount，初始值改为 20
const [searchQuery, setSearchQuery] = useState('');                 // ❌ 移除（搜索功能）
```

**新状态变量:**
```typescript
const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);
const [loadingSystemFonts, setLoadingSystemFonts] = useState(false);
const [systemFontDisplayCount, setSystemFontDisplayCount] = useState(20);
```

- [ ] **Step 1: 移除 `showSystemFonts` 和 `searchQuery` 状态**

删除：
```typescript
const [showSystemFonts, setShowSystemFonts] = useState(false);
const [searchQuery, setSearchQuery] = useState('');
```

- [ ] **Step 2: 重命名 `loadingFonts` → `loadingSystemFonts`**

全局替换：
- `loadingFonts` → `loadingSystemFonts`
- `setLoadingFonts` → `setLoadingSystemFonts`

- [ ] **Step 3: 重命名 `displayCount` → `systemFontDisplayCount` 并修改初始值**

```typescript
// 修改前
const [displayCount, setDisplayCount] = useState(5);

// 修改后
const [systemFontDisplayCount, setSystemFontDisplayCount] = useState(20);
```

- [ ] **Step 4: 移除搜索相关的 ref**

删除：
```typescript
const searchInputRef = useRef<HTMLInputElement>(null);
```

- [ ] **Step 5: 运行 TypeScript 检查是否有类型错误**

```bash
npm run build 2>&1 | head -50
```

预期：可能有未使用的导入或引用错误，暂时忽略

- [ ] **Step 6: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "refactor: clean up unused state variables for inline system fonts"
```

---

### Task 2: 移除模态对话框相关逻辑

**Files:**
- Modify: `src/components/FontPicker.tsx`

- [ ] **Step 1: 移除 `handleSearchChange` 函数**

删除：
```typescript
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchQuery(e.target.value);
  setDisplayCount(5);
};
```

- [ ] **Step 2: 移除 `handleCloseModal` 函数**

删除：
```typescript
const handleCloseModal = () => {
  setShowSystemFonts(false);
  setDisplayCount(5);
  setSearchQuery('');
};
```

- [ ] **Step 3: 移除 ESC 键监听弹窗的 useEffect**

删除：
```typescript
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && showSystemFonts) {
      handleCloseModal();
    }
  };
  document.addEventListener('keydown', handleEsc);
  return () => document.removeEventListener('keydown', handleEsc);
}, [showSystemFonts, handleCloseModal]);
```

- [ ] **Step 4: 移除聚焦搜索框的 useEffect**

删除：
```typescript
useEffect(() => {
  if (showSystemFonts && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [showSystemFonts]);
```

- [ ] **Step 5: 移除过滤字体的逻辑**

删除：
```typescript
const filteredFonts = systemFonts.filter(font =>
  font.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
  font.family.toLowerCase().includes(searchQuery.trim().toLowerCase())
);
```

- [ ] **Step 6: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "refactor: remove modal dialog related logic"
```

---

### Task 3: 更新 `handleLoadSystemFonts` 函数

**Files:**
- Modify: `src/components/FontPicker.tsx`

- [ ] **Step 1: 更新函数签名和逻辑**

```typescript
// 修改前
const handleLoadSystemFonts = async () => {
  setLoadingFonts(true);
  try {
    const fonts = await invoke<SystemFont[]>('get_system_fonts');
    setSystemFonts(fonts);
  } catch (err) {
    console.error('Failed to load system fonts:', err);
  } finally {
    setLoadingFonts(false);
  }
};

// 修改后
const handleLoadSystemFonts = async () => {
  if (loadingSystemFonts) return; // 防止重复点击

  setLoadingSystemFonts(true);
  try {
    const fonts = await invoke<SystemFont[]>('get_system_fonts');
    // 按字母顺序排序
    const sortedFonts = fonts.sort((a, b) =>
      a.name.localeCompare(b.name, 'zh-Hans-CN')
    );
    setSystemFonts(sortedFonts);
    setSystemFontDisplayCount(INITIAL_DISPLAY_COUNT);
  } catch (err) {
    console.error('Failed to load system fonts:', err);
    // 加载失败时重置状态，允许用户重试
    setSystemFontDisplayCount(0);
  } finally {
    setLoadingSystemFonts(false);
  }
};
```

- [ ] **Step 2: 添加常量定义**

在组件函数内部添加：
```typescript
// 每批显示数量
const BATCH_SIZE = 20;

// 初始显示数量
const INITIAL_DISPLAY_COUNT = 20;
```

- [ ] **Step 3: 添加 `handleLoadMoreSystemFonts` 函数**

```typescript
const handleLoadMoreSystemFonts = () => {
  setSystemFontDisplayCount(prev =>
    Math.min(prev + BATCH_SIZE, systemFonts.length)
  );
};
```

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: update handleLoadSystemFonts with sorting and batch display"
```

---

## Chunk 2: 实现滚动加载和 UI 渲染

### Task 4: 添加滚动监听逻辑

**Files:**
- Modify: `src/components/FontPicker.tsx`

- [ ] **Step 1: 添加 `handleScroll` 函数**

```typescript
// 滚动监听 - 自动加载更多
// 使用 loadingSystemFonts 作为天然防抖标志位
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  if (loadingSystemFonts) return; // 加载中不触发

  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
  // 距离底部 50px 时触发加载
  if (scrollHeight - scrollTop - clientHeight < 50 &&
      systemFontDisplayCount < systemFonts.length) {
    handleLoadMoreSystemFonts();
  }
};
```

- [ ] **Step 2: 在下拉列表容器上添加 `onScroll` 事件**

找到下拉列表容器（第 145-151 行）：
```tsx
<div
  className="fixed z-[100] w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg max-h-64 overflow-y-auto font-picker-dropdown"
  style={{...}}
  onScroll={handleScroll}  // ← 添加这行
>
```

- [ ] **Step 3: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: add scroll listener for lazy loading system fonts"
```

---

### Task 5: 重构 UI 渲染逻辑 - 移除模态对话框

**Files:**
- Modify: `src/components/FontPicker.tsx`

- [ ] **Step 1: 移除模态对话框条件渲染**

删除整个模态对话框块（第 182-278 行）：
```tsx
{/* 系统字体选择弹窗 */}
{showSystemFonts && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
    ...整个模态对话框内容...
  </div>
)}
```

- [ ] **Step 2: 修改"更多系统字体"按钮逻辑**

修改第 170-180 行的按钮：
```tsx
{/* 修改前 */}
<div className="border-t border-[#2a2a2a] mt-1 pt-1">
  <button
    className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
    onClick={async () => {
      await handleLoadSystemFonts();
      setShowSystemFonts(true);
    }}
  >
    更多系统字体...
  </button>
</div>

{/* 修改后 - 条件渲染：根据加载状态显示不同文字 */}
{systemFonts.length === 0 && !loadingSystemFonts && (
  <div className="border-t border-[#2a2a2a] mt-1 pt-1">
    <button
      className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
      onClick={handleLoadSystemFonts}
    >
      更多系统字体...
    </button>
  </div>
)}

{loadingSystemFonts && (
  <div className="border-t border-[#2a2a2a] mt-1 pt-1">
    <button
      className="w-full px-3 py-2 text-xs text-gray-400 text-left cursor-not-allowed"
      disabled
    >
      正在加载...
    </button>
  </div>
)}
```

- [ ] **Step 3: 添加系统字体列表渲染**

在"更多系统字体"按钮后面添加系统字体列表：
```tsx
{/* 系统字体列表 - 内联显示 */}
{systemFonts.length > 0 && (
  <>
    {systemFonts.slice(0, systemFontDisplayCount).map((font, index) => (
      <button
        key={`${font.family}-${index}`}
        className={`w-full px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] ${
          selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
        }`}
        style={{ fontFamily: font.family }}
        onClick={() => {
          onFontChange(font.family);
          setIsExpanded(false);
        }}
      >
        {font.name}
      </button>
    ))}

    {/* 加载更多提示 - 当还有更多字体时显示 */}
    {systemFontDisplayCount < systemFonts.length && (
      <div className="px-3 py-2 text-xs text-gray-500 text-center">
        滚动加载更多...
      </div>
    )}
  </>
)}
```

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: render system fonts inline with batch display"
```

---

### Task 6: 清理未使用的导入和代码

**Files:**
- Modify: `src/components/FontPicker.tsx`

- [ ] **Step 1: 检查并移除未使用的导入**

检查 `useEffect` 是否还需要（应该不再需要了，因为移除了 ESC 和聚焦逻辑）：
```typescript
import { useState, useEffect, useRef } from 'react';

// 如果 useEffect 不再使用，改为：
import { useState, useRef } from 'react';
```

- [ ] **Step 2: 移除未使用的 ref**

如果 `triggerButtonRef` 仍用于下拉框位置计算则保留，否则移除。

- [ ] **Step 3: 运行 TypeScript 编译检查**

```bash
npm run build 2>&1 | grep -E "(error|warning)" | head -20
```

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "chore: clean up unused imports and refs"
```

---

## Chunk 3: 验证和测试

### Task 7: 功能验证

**Files:**
- N/A (手动测试)

- [ ] **Step 1: 启动开发服务器**

```bash
npm run tauri dev
```

- [ ] **Step 2: 验证基本功能**

测试清单：
- [ ] 点击字体选择器，下拉列表正常展开
- [ ] 预设字体列表正常显示
- [ ] "更多系统字体..."按钮显示在底部
- [ ] 点击"更多系统字体..."后显示"正在加载..."
- [ ] 系统字体加载完成后按字母顺序显示前 20 个
- [ ] 滚动到底部时自动加载更多字体
- [ ] 点击系统字体后下拉列表关闭，字体正确应用
- [ ] 系统字体为空时不显示"更多系统字体"按钮

- [ ] **Step 3: 验证边界情况**

- [ ] 快速滚动时不会重复触发加载
- [ ] 加载失败时"更多系统字体"按钮恢复可点击状态

- [ ] **Step 4: 记录任何问题**

如果发现问题，记录在下方：
```
问题描述：
复现步骤：
预期行为：
实际行为：
```

---

### Task 8: 最终清理

**Files:**
- Modify: `src/index.css` (如果需要)

- [ ] **Step 1: 检查 CSS 是否需要清理**

确认 `.font-picker-dropdown` 滚动条样式是否仍在使用：
```css
.font-picker-dropdown::-webkit-scrollbar {
  width: 8px;
}
/* ... 应该保留，因为下拉列表仍在使用 */
```

- [ ] **Step 2: 运行完整的 TypeScript 检查**

```bash
npm run build
```

- [ ] **Step 3: 提交最终更改**

```bash
git add .
git commit -m "chore: final cleanup for inline system fonts feature"
```

---

## 总结

### 提交历史预期

完成此计划后，应该有 7 个新提交：

1. `refactor: clean up unused state variables for inline system fonts`
2. `refactor: remove modal dialog related logic`
3. `feat: update handleLoadSystemFonts with sorting and batch display`
4. `feat: add scroll listener for lazy loading system fonts`
5. `feat: render system fonts inline with batch display`
6. `chore: clean up unused imports and refs`
7. `chore: final cleanup for inline system fonts feature`

### 验收检查

- [ ] 不再显示模态对话框
- [ ] 系统字体在下拉列表中内联显示
- [ ] 滚动加载更多功能正常
- [ ] 加载状态正确显示
- [ ] 字体选择功能正常

---

**Plan complete. Ready to execute?**
