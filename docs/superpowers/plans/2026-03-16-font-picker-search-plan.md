# 字体选择器搜索和分页功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为系统字体选择弹窗添加实时搜索和分页加载功能，优化用户浏览大量字体的体验。

**Architecture:** 在现有 FontPicker 组件内添加搜索框和分页状态管理，通过 filter 和 slice 实现前端搜索和分页，所有逻辑封装在组件内部。

**Tech Stack:** React 18 + TypeScript + TailwindCSS

---

## 文件结构

**修改文件：**
- `src/components/FontPicker.tsx` - 添加搜索框 UI、分页状态、过滤逻辑

**无需修改：**
- 类型定义（复用现有 SystemFont 接口）
- Tauri 后端（字体数据已一次性加载）
- 其他组件（功能封装在 FontPicker 内）

---

## 任务分解

### Task 1: 添加状态变量和导入

**Files:**
- Modify: `src/components/FontPicker.tsx:1-40`

- [ ] **Step 1: 更新 React 导入**

在文件第 9 行，将导入改为：
```typescript
import { useState, useEffect, useRef } from 'react';
```

- [ ] **Step 2: 添加新的状态变量**

在 `loadingFonts` 状态后（第 39 行后）添加：
```typescript
const [displayCount, setDisplayCount] = useState(5);         // 当前显示数量
const [searchQuery, setSearchQuery] = useState('');          // 搜索关键词
const searchInputRef = useRef<HTMLInputElement>(null);       // 搜索框引用
```

- [ ] **Step 3: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: 添加字体搜索和分页状态变量"
```

---

### Task 2: 实现过滤和分页逻辑

**Files:**
- Modify: `src/components/FontPicker.tsx:40-65`

- [ ] **Step 1: 添加过滤逻辑**

在 `handleLoadSystemFonts` 函数后添加：
```typescript
// 过滤字体（支持名称和族名搜索）
const filteredFonts = systemFonts.filter(font =>
  font.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
  font.family.toLowerCase().includes(searchQuery.trim().toLowerCase())
);

// 分页显示
const displayedFonts = filteredFonts.slice(0, displayCount);
```

- [ ] **Step 2: 添加事件处理函数**

添加以下函数：
```typescript
// 搜索时重置分页
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchQuery(e.target.value);
  setDisplayCount(5); // 重置为初始数量
};

// 加载更多
const handleLoadMore = () => setDisplayCount(prev => prev + 5);

// 关闭弹窗时重置状态
const handleCloseModal = () => {
  setShowSystemFonts(false);
  setDisplayCount(5);
  setSearchQuery('');
};
```

- [ ] **Step 3: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: 实现字体过滤和分页逻辑"
```

---

### Task 3: 修改弹窗关闭逻辑（在添加搜索框前完成）

**Files:**
- Modify: `src/components/FontPicker.tsx:116-118`

- [ ] **Step 1: 修改弹窗遮罩层点击事件**

将第 117 行的：
```typescript
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowSystemFonts(false)}>
```

改为：
```typescript
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
```

- [ ] **Step 2: 修改弹窗内容阻止冒泡**

确保第 118 行有：
```typescript
<div ... onClick={(e) => e.stopPropagation()}>
```

- [ ] **Step 3: 添加 ESC 键关闭功能**

在组件体内 return 之前添加：
```typescript
// ESC 键关闭弹窗
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

- [ ] **Step 4: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "refactor: 统一处理弹窗关闭逻辑并添加 ESC 键支持"
```

---

### Task 4: 添加搜索框 UI

**Files:**
- Modify: `src/components/FontPicker.tsx:118-135`

- [ ] **Step 1: 修改弹窗头部**

将第 120 行的头部 div 修改为：
```typescript
{/* 头部 + 搜索框 */}
<div className="flex flex-col gap-3 p-4 border-b border-[#2a2a2a]">
  <div className="flex justify-between items-center">
    <h3 className="text-sm font-medium text-gray-100">选择系统字体</h3>
    <button
      className="text-gray-400 hover:text-gray-200"
      onClick={handleCloseModal}
      type="button"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>

  {/* 搜索框 */}
  <div className="relative">
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input
      ref={searchInputRef}
      type="text"
      placeholder="搜索字体名称或族名..."
      className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold"
      value={searchQuery}
      onChange={handleSearchChange}
    />
  </div>
</div>
```

- [ ] **Step 2: 删除原有的独立头部代码**

删除原有的第 120-130 行（旧的头部结构）

- [ ] **Step 3: 添加自动聚焦 useEffect**

在组件体内 return 之前添加：
```typescript
// 打开弹窗时自动聚焦搜索框
useEffect(() => {
  if (showSystemFonts && searchInputRef.current) {
    searchInputRef.current.focus();
  }
}, [showSystemFonts]);
```

- [ ] **Step 4: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 5: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: 添加搜索框 UI 组件"
```

---

### Task 5: 修改字体列表渲染逻辑

**Files:**
- Modify: `src/components/FontPicker.tsx:133-158`

- [ ] **Step 1: 修改列表渲染使用 displayedFonts**

将第 139 行的：
```typescript
{systemFonts.map((font, index) => (
```

改为：
```typescript
{displayedFonts.map((font, index) => (
```

- [ ] **Step 2: 添加空状态提示**

在第 134-137 行，将条件渲染改为：
```typescript
{loadingFonts ? (
  <div className="text-center text-gray-400 py-8">加载中...</div>
) : searchQuery && filteredFonts.length === 0 ? (
  <div className="text-center text-gray-400 py-8">
    未找到包含"{searchQuery}"的字体
  </div>
) : systemFonts.length === 0 ? (
  <div className="text-center text-gray-400 py-8">未找到系统字体</div>
) : (
```

- [ ] **Step 3: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 4: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: 修改字体列表为分页渲染并添加空状态"
```

---

### Task 6: 添加"加载更多"按钮

**Files:**
- Modify: `src/components/FontPicker.tsx:160-170`

- [ ] **Step 1: 修改底部按钮区域**

将第 161-168 行的底部 div 替换为：
```typescript
{/* 底部按钮 */}
<div className="flex gap-2 p-4 border-t border-[#2a2a2a]">
  {/* 加载更多按钮 - 仅当还有更多字体时显示 */}
  {displayCount < filteredFonts.length && (
    <button
      className="flex-1 bg-gold hover:bg-gold-hover text-black text-sm font-medium py-2 rounded"
      onClick={handleLoadMore}
      type="button"
    >
      加载更多 5 个
    </button>
  )}

  {/* 取消按钮 */}
  <button
    className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-100 text-sm py-2 rounded"
    onClick={handleCloseModal}
    type="button"
  >
    取消
  </button>
</div>
```

- [ ] **Step 2: 运行 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/FontPicker.tsx
git commit -m "feat: 添加加载更多按钮并条件渲染"
```

---

### Task 7: 最终验证

**Files:**
- All modified files

- [ ] **Step 1: 运行完整 TypeScript 检查**

```bash
npx tsc --noEmit
```
Expected: 无错误

- [ ] **Step 2: 运行构建**

```bash
npm run build
```
Expected: 构建成功

- [ ] **Step 3: 手动测试功能**

启动应用测试：
```bash
npm run dev
```

测试场景：
1. 点击字体选择器的"更多系统字体..."按钮
2. 验证默认显示 5 个字体
3. 在搜索框输入，验证实时过滤
4. 点击"加载更多 5 个"，验证追加显示
5. 显示全部后，验证"加载更多"按钮隐藏
6. 选择字体，验证应用到卡片并关闭弹窗

- [ ] **Step 4: 查看所有提交**

```bash
git log --oneline -6
```
Expected: 看到 6 个相关提交

---

## 实现检查清单

- [ ] Task 1: 添加状态变量和导入
- [ ] Task 2: 实现过滤和分页逻辑
- [ ] Task 3: 修改弹窗关闭逻辑（添加 ESC 键支持）
- [ ] Task 4: 添加搜索框 UI
- [ ] Task 5: 修改字体列表渲染逻辑
- [ ] Task 6: 添加"加载更多"按钮
- [ ] Task 7: 最终验证

---

## 预期最终效果

1. **默认显示**：打开弹窗显示 5 个系统字体
2. **实时搜索**：输入时即时过滤字体（名称或族名匹配）
3. **分页加载**：每次点击"加载更多"追加 5 个字体
4. **智能隐藏**：显示全部字体后自动隐藏"加载更多"按钮
5. **状态重置**：关闭弹窗时重置搜索和分页状态
