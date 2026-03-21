# 输入面板滚动功能实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使输入面板在窗口高度不足时可以滚动，确保用户始终能够访问"保存卡片"按钮

**Architecture:** 给 InputPanel 容器添加 `overflow-y-auto` 类，并添加自定义滚动条样式与项目设计保持一致

**Tech Stack:** React 18, TypeScript, Tailwind CSS

---

## Chunk 1: 实现滚动功能

### Task 1: 修改 InputPanel 容器添加滚动功能

**Files:**
- Modify: `src/components/InputPanel.tsx:54`

**当前代码（第 54 行）：**
```tsx
<div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4">
```

**修改后：**
```tsx
<div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4 overflow-y-auto">
```

- [ ] **Step 1: 修改 InputPanel 容器类名**

在第 54 行的 className 中添加 `overflow-y-auto`：

```tsx
<div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4 overflow-y-auto">
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npm run build 2>&1 | head -20
```

预期：无错误

- [ ] **Step 3: 提交**

```bash
git add src/components/InputPanel.tsx
git commit -m "feat: add scroll support to InputPanel"
```

---

### Task 2: 添加滚动条样式

**Files:**
- Modify: `src/index.css`

**设计：** 复用 `.font-picker-dropdown` 滚动条样式模式，添加 InputPanel 专用样式

- [ ] **Step 1: 在 src/index.css 末尾添加滚动条样式**

在现有 `.font-picker-dropdown` 样式之后（第 59 行后）添加：

```css
/* InputPanel 滚动条样式 */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #141414;  /* 与 InputPanel 背景色一致 */
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #5a5a5a;
}
```

- [ ] **Step 2: 验证 CSS 编译**

```bash
npm run build 2>&1 | tail -10
```

预期：构建成功

- [ ] **Step 3: 提交**

```bash
git add src/index.css
git commit -m "style: add custom scrollbar styles for InputPanel"
```

---

## Chunk 2: 验证功能

### Task 3: 功能验证

**Files:**
- N/A (手动测试)

- [ ] **Step 1: 启动开发服务器**

```bash
npm run tauri dev
```

- [ ] **Step 2: 测试窗口高度正常时的行为**

验证：
- [ ] 输入面板内容未溢出时无滚动条
- [ ] 所有输入项正常显示
- [ ] 保存按钮可见

- [ ] **Step 3: 测试窗口高度拉低后的行为**

调整浏览器窗口高度至约 500px，验证：
- [ ] 输入面板出现垂直滚动条
- [ ] 滚动条样式正确（深色背景，灰色滑块）
- [ ] 滚动流畅无卡顿

- [ ] **Step 4: 测试保存按钮可见性**

验证：
- [ ] 滚动到底部可以看见"保存卡片"按钮
- [ ] 点击"保存卡片"按钮可以正常触发保存

- [ ] **Step 5: 测试与字体选择器的兼容性**

打开字体选择器下拉框，验证：
- [ ] "更多系统字体"按钮 sticky 定位有效
- [ ] 下拉框展开时滚动面板，下拉框保持 fixed 定位
- [ ] 视觉无错位

- [ ] **Step 6: 测试边界情况**

验证：
- [ ] 窗口高度极小时（约 300px），滚动区域仍然可用
- [ ] 滚动条出现时内容宽度不受影响

- [ ] **Step 7: 记录任何问题**

如果发现问题，记录在下方：
```
问题描述：
复现步骤：
预期行为：
实际行为：
```

---

### Task 4: 最终清理

**Files:**
- 可能需要修改：`src/components/InputPanel.tsx`

- [ ] **Step 1: 运行完整构建**

```bash
npm run build
```

- [ ] **Step 2: 检查 git 状态**

```bash
git status
```

- [ ] **Step 3: 提交最终更改（如果有）**

```bash
git add .
git commit -m "chore: final cleanup for input panel scroll feature"
```

---

## 总结

### 提交历史预期

完成此计划后，应该有 2-3 个新提交：

1. `feat: add scroll support to InputPanel`
2. `style: add custom scrollbar styles for InputPanel`
3. `chore: final cleanup for input panel scroll feature` (可选)

### 验收检查

- [ ] 窗口高度不足时，输入面板出现垂直滚动条
- [ ] 用户可以滚动看到并点击"保存卡片"按钮
- [ ] 字体选择器下拉框的 sticky 定位仍然有效
- [ ] 不影响右侧预览面板的功能
- [ ] 不影响可调节宽度的分栏布局
- [ ] 滚动条样式与项目设计一致

---

**Plan complete. Ready to execute?**
