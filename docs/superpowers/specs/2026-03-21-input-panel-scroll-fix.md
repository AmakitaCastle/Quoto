# 输入面板滚动功能设计文档

**日期**: 2026-03-21
**作者**: Claude
**状态**: 待实现

---

## 1. 概述

### 1.1 背景
当用户将浏览器窗口高度拉低后，左侧输入面板中的"保存卡片"按钮会被挤出可视区域。原因是字体选择器下拉框展开时，所有不可收缩的输入项总高度超过了窗口高度。

### 1.2 目标
使输入面板在窗口高度不足时可以滚动，确保用户始终能够访问"保存卡片"按钮。

### 1.3 范围
- 修改 `InputPanel.tsx` 组件
- 添加垂直滚动功能
- 保持现有布局结构不变

---

## 2. 问题分析

### 2.1 当前布局
```tsx
<div className="flex flex-col h-full ... p-4">  ← 容器，无滚动
  <div className="mb-4 flex-shrink-0">...</div>  ← 句子输入
  <div className="mb-4 flex-shrink-0">...</div>  ← 书名输入
  <div className="mb-4 flex-shrink-0">...</div>  ← 作者输入
  <div className="mb-4 flex-shrink-0">...</div>  ← 风格选择器
  <div className="mb-4 flex-shrink-0">...</div>  ← 正文字体选择器
  <div className="mb-4 flex-shrink-0">...</div>  ← 手写字体选择器
  <div className="mt-auto flex-shrink-0">...</div>  ← 保存按钮
</div>
```

### 2.2 问题原因
- 所有子元素都是 `flex-shrink-0`，不会自动收缩
- 容器没有 `overflow-y-auto`，无法滚动
- 当字体选择器下拉框展开时，总高度超过窗口高度
- 保存按钮被挤出可视区域

---

## 3. 解决方案

### 3.1 方案对比

| 方案 | 描述 | 优点 | 缺点 |
|------|------|------|------|
| A | 保存按钮固定在底部 | 按钮始终可见 | 需要重构布局 |
| B | 整个面板可滚动 | 改动最小，风险低 | 需要滚动才能看到按钮 |

### 3.2 选择方案 B

**理由：**
- 改动最小（只需添加一个 CSS 类）
- 保持现有布局结构
- 风险最低
- 用户滚动后仍可访问保存按钮

---

## 4. 实现细节

### 4.1 修改内容

**文件：** `src/components/InputPanel.tsx`

**修改位置：** 第 54 行

```tsx
// 修改前
<div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4">

// 修改后
<div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4 overflow-y-auto">
```

### 4.2 滚动条样式

复用项目现有的滚动条样式（已在 `src/index.css` 中定义）：

```css
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #4a4a4a;
  border-radius: 4px;
}
```

### 4.3 与其他功能的兼容性

- **字体选择器下拉框 sticky 定位**：兼容，sticky 定位仍然有效
- **右侧预览面板**：不受影响
- **可调节宽度的分栏布局**：不受影响

---

## 5. 测试要点

### 5.1 功能测试
- [ ] 窗口高度正常时，输入面板无滚动条（内容未溢出）
- [ ] 窗口高度拉低后，输入面板出现滚动条
- [ ] 滚动后可以看见并点击"保存卡片"按钮
- [ ] 字体选择器下拉框展开时，sticky 定位仍然有效

### 5.2 兼容性测试
- [ ] macOS 上滚动条样式正确
- [ ] Windows 上滚动条样式正确
- [ ] Linux 上滚动条样式正确

---

## 6. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/InputPanel.tsx` | 修改 | 添加 `overflow-y-auto` 类 |

---

## 7. 验收标准

1. 窗口高度不足时，输入面板出现垂直滚动条
2. 用户可以滚动看到并点击"保存卡片"按钮
3. 字体选择器下拉框的 sticky 定位仍然有效
4. 不影响右侧预览面板的功能
5. 不影响可调节宽度的分栏布局

---

## 8. 后续优化建议

1. **自定义滚动条样式**：可以添加与项目风格一致的滚动条样式
2. **响应式高度调整**：可以根据窗口高度动态调整输入项的间距
3. **快捷键支持**：添加 `Cmd/Ctrl + S` 快捷键保存
