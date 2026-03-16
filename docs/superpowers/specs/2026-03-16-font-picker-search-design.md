# 字体选择器搜索和分页功能设计

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为系统字体选择弹窗添加实时搜索和分页加载功能。

**Architecture:** 在现有 FontPicker 组件内添加搜索框和分页状态管理，通过 filter 和 slice 实现前端搜索和分页。

**Tech Stack:** React 18 + TypeScript + TailwindCSS

---

## 设计详情

### 1. 新增状态变量

```typescript
const [displayCount, setDisplayCount] = useState(5);         // 当前显示数量
const [searchQuery, setSearchQuery] = useState('');          // 搜索关键词
const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null); // 搜索框引用
```

### 2. 核心逻辑

**过滤字体：**
```typescript
const filteredFonts = systemFonts.filter(font =>
  font.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  font.family.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**分页显示：**
```typescript
const displayedFonts = filteredFonts.slice(0, displayCount);
```

**加载更多：**
```typescript
const handleLoadMore = () => setDisplayCount(prev => prev + 5);
```

**搜索时重置分页：**
```typescript
const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchQuery(e.target.value);
  setDisplayCount(5); // 重置为初始数量
};
```

### 3. UI 布局

```
┌─────────────────────────────────────┐
│  选择系统字体                    ✕  │  ← 头部（标题 + 关闭）
├─────────────────────────────────────┤
│  [🔍 搜索字体名称或族名...          ]│  ← 搜索框
├─────────────────────────────────────┤
│  ┌───────────┐ ┌───────────┐       │
│  │ 思源黑体  │ │ KaiTi     │       │
│  └───────────┘ └───────────┘       │  ← 两列网格字体列表
│  ┌───────────┐ ┌───────────┐       │
│  │ Arial     │ │ 楷体      │       │
│  └───────────┘ └───────────┘       │
├─────────────────────────────────────┤
│     [加载更多 5 个]  [取消]            │  ← 底部按钮
└─────────────────────────────────────┘
```

### 4. 交互细节

| 操作 | 行为 |
|------|------|
| 打开弹窗 | 自动聚焦搜索框，displayCount=5 |
| 输入搜索 | 实时过滤，重置 displayCount=5 |
| 点击字体 | 应用字体，关闭弹窗，重置状态 |
| 点击"加载更多" | displayCount + 5 |
| 显示全部字体后 | 隐藏"加载更多"按钮 |
| 点击"取消"或关闭 | 关闭弹窗，重置状态 |

### 5. 条件渲染

**"加载更多"按钮显示条件：**
```typescript
{displayCount < filteredFonts.length && (
  <button onClick={handleLoadMore}>加载更多 5 个</button>
)}
```

**空状态提示：**
```typescript
{filteredFonts.length === 0 && searchQuery && (
  <div className="text-center text-gray-400 py-8">
    未找到包含"{searchQuery}"的字体
  </div>
)}
```

### 6. 文件修改

**修改文件：**
- `src/components/FontPicker.tsx` - 添加搜索框、分页逻辑、按钮条件渲染

**无需修改：**
- 类型定义（复用现有 SystemFont 接口）
- Tauri 后端（字体数据已一次性加载）
- 其他组件（功能封装在 FontPicker 内）

### 7. 测试验证

**手动测试场景：**
1. 打开弹窗 → 默认显示 5 个字体
2. 输入搜索 → 实时过滤结果
3. 点击"加载更多" → 追加 5 个字体
4. 显示全部后 → "加载更多"按钮隐藏
5. 选择字体 → 应用到卡片并关闭弹窗

---

## 实现检查清单

- [ ] 添加 displayCount 和 searchQuery 状态
- [ ] 实现 filteredFonts 和 displayedFonts 计算逻辑
- [ ] 添加搜索框 UI（带图标和 placeholder）
- [ ] 实现 handleLoadMore 函数
- [ ] 条件渲染"加载更多"按钮
- [ ] 添加空状态提示
- [ ] 打开弹窗时自动聚焦搜索框
- [ ] TypeScript 编译通过
- [ ] 手动验证功能正常
