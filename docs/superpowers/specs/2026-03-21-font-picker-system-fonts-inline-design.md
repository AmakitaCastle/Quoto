# 字体选择器系统字体内联分批加载设计文档

**日期**: 2026-03-21
**作者**: Claude
**状态**: 待实现

---

## 1. 概述

### 1.1 背景
当前字体选择器的"更多系统字体"功能使用模态对话框展示系统字体列表。这种设计增加了用户操作的认知负担，需要在一个新的弹窗中完成选择，然后再关闭弹窗回到主界面。

### 1.2 目标
将系统字体列表集成到原有的下拉列表中，通过分批加载方式逐步显示系统字体，移除模态对话框，提供更流畅的用户体验。

### 1.3 范围
- 修改 `FontPicker.tsx` 组件
- 移除模态对话框 UI 和交互逻辑
- 移除搜索框功能（当前模态对话框中的搜索）
- 实现下拉列表内的分批显示机制（一次性加载，分批显示）
- 保持后端 `get_system_fonts` 命令不变

### 1.4 术语说明
本文档中"懒加载"指"分批显示"（lazy rendering），即：
- 前端一次性获取所有系统字体
- 初始只渲染前 N 个字体
- 滚动时逐步增加渲染数量

这与后端分页加载不同，本设计中后端接口一次性返回全部数据。

---

## 2. 当前架构

### 2.1 组件结构
```
FontPicker
├── 触发按钮 (当前选中字体)
└── 下拉列表 (绝对定位，max-h-64，带滚动)
    ├── 预设字体列表 (来自 fonts.json)
    ├── 分隔线
    └── "更多系统字体..."按钮 → 点击后内联加载系统字体
```

### 2.2 数据流
```
用户点击"更多系统字体"
  → handleLoadSystemFonts()
  → invoke('get_system_fonts') [Tauri Command]
  → 后端执行 system_profiler / fc-list
  → 返回 FontInfo[] 数组
  → 存储在 systemFonts 状态
  → 在下拉列表中内联显示（分批渲染）
```

---

## 3. 新架构设计

### 3.1 组件结构（修改后）
```
FontPicker
├── 触发按钮 (当前选中字体)
└── 下拉列表 (绝对定位，带滚动)
    ├── 预设字体列表 (来自 fonts.json)
    ├── 分隔线
    ├── 系统字体列表 (懒加载)
    └── "更多系统字体..." / "正在加载..." / "加载更多"按钮
```

### 3.2 状态变量

| 状态名 | 类型 | 说明 |
|--------|------|------|
| `systemFonts` | `SystemFont[]` | 已加载的系统字体列表（一次性加载全部） |
| `loadingSystemFonts` | `boolean` | 是否正在加载中（兼作防抖标志位） |
| `systemFontDisplayCount` | `number` | 当前显示的系统字体数量 |

**移除的状态变量**（相对于审查前版本）：
- `systemFontsLoaded` - 冗余状态，通过 `systemFonts.length > 0` 或 `!loadingSystemFonts` 可推导
- `hasMoreSystemFonts` - 冗余状态，通过 `systemFontDisplayCount < systemFonts.length` 可推导

### 3.3 交互流程

```
┌─────────────────────────────────────────────────────────┐
│                     下拉列表展开                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 思源宋体                                         │   │
│  │ 楷体                                             │   │
│  │ 仿宋                                             │   │
│  │ 黑体                                             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 更多系统字体... ← 用户点击                       │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     下拉列表展开                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 思源宋体                                         │   │
│  │ 楷体                                             │   │
│  │ 仿宋                                             │   │
│  │ 黑体                                             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ 正在加载... ← 加载状态，禁用点击                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     下拉列表展开                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 思源宋体                                         │   │
│  │ 楷体                                             │   │
│  │ 仿宋                                             │   │
│  │ 黑体                                             │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ Arial                                            │   │
│  │ Arial Narrow                                     │   │
│  │ Helvetica                                        │   │
│  │ ... (最多显示 20 个系统字体)                      │   │
│  │ 加载更多... ← 滚动到底部自动触发                 │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 3.4 分批加载逻辑

```typescript
// 每批显示数量
const BATCH_SIZE = 20;

// 初始显示数量
const INITIAL_DISPLAY_COUNT = 20;

// 加载系统字体（一次性获取全部，分批显示）
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

// 加载更多（增加显示数量）
const handleLoadMoreSystemFonts = () => {
  setSystemFontDisplayCount(prev =>
    Math.min(prev + BATCH_SIZE, systemFonts.length)
  );
};

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

**设计说明**：
- 不使用额外的 debounce/throttle，利用 `loadingSystemFonts` 状态自然防止重复触发
- 加载失败时重置 `systemFontDisplayCount` 为 0，用户可以重新点击"更多系统字体"重试
- 初始显示 20 个字体（不是一次加载 5 个）

### 3.5 数据结构

后端返回的 `FontInfo` 结构保持不变：

```rust
#[derive(Serialize)]
struct FontInfo {
    name: String,      // 字体显示名称
    family: String,    // 字体族名（用于 CSS font-family）
    is_system: bool,   // 是否为系统字体
}
```

前端显示时只使用 `name` 字段，选择时使用 `family` 字段。

---

## 4. 错误处理

### 4.1 加载失败
- 如果 `get_system_fonts` 调用失败，在控制台输出错误日志
- 加载失败时重置 `systemFontDisplayCount` 为 0
- "更多系统字体"按钮恢复为可点击状态，用户可以重试

### 4.2 空状态
- 如果系统字体列表为空（`systemFonts.length === 0`），不显示"更多系统字体"按钮
- 分隔线也不显示

### 4.3 加载中状态
- 加载期间按钮显示"正在加载..."并禁用点击
- 利用 `loadingSystemFonts` 状态防止重复触发

### 4.4 滚动冲突处理
- 下拉列表容器设置固定 `max-h-64`（160px）
- 当系统字体内容高度超过容器高度时，容器本身出现滚动条
- 滚动事件绑定在容器上，不会与内部字体列表产生滚动冲突

---

## 5. 边界情况

### 5.1 系统字体数量少于预设值
- 如果系统字体总数少于 `BATCH_SIZE`，一次性显示所有字体
- 不显示"加载更多"按钮

### 5.2 用户快速滚动
- 利用 `loadingSystemFonts` 标志位防止重复触发
- 滚动事件中先检查 `if (loadingSystemFonts) return`

### 5.3 字体名称重复
- 后端已使用 `HashSet` 去重（Linux）
- macOS 和 Windows 返回的字体列表理论上不重复

### 5.4 下拉列表容器高度
- 容器 `max-h-64` (160px) 保持不变
- 当系统字体展开后，如果内容超过容器高度，容器出现滚动条
- 初始显示 20 个字体，约占据 600-800px 高度（取决于字体项高度）
- 用户需要滚动才能看到更多字体，滚动时自动加载更多

---

## 6. UI/UX 细节

### 6.1 滚动条样式
复用现有的 `.font-picker-dropdown` 滚动条样式：

```css
.font-picker-dropdown::-webkit-scrollbar {
  width: 8px;
}
.font-picker-dropdown::-webkit-scrollbar-thumb {
  background: #4a4a4a;
}
```

### 6.2 分隔线
预设字体和系统字体之间保持现有的分隔线样式：

```tsx
<div className="border-t border-[#2a2a2a] mt-1 pt-1">
```

### 6.3 按钮样式
"更多系统字体"、"正在加载..."、"加载更多"使用相同的样式：

```tsx
className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
```

---

## 7. 测试要点

### 7.1 功能测试
- [ ] 点击"更多系统字体"能正确触发加载
- [ ] 加载状态正确显示和隐藏
- [ ] 系统字体按字母顺序排序
- [ ] 滚动到底部自动加载更多
- [ ] 选择系统字体后正确应用到预览

### 7.2 边界测试
- [ ] 系统字体为空时的表现
- [ ] 系统字体很少（少于一批）时的表现
- [ ] 快速滚动时的加载行为

### 7.3 兼容性测试
- [ ] macOS 系统字体加载
- [ ] Linux 系统字体加载
- [ ] Windows 系统字体加载

---

## 8. 文件修改清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/FontPicker.tsx` | 修改 | 移除模态对话框，实现懒加载逻辑 |
| `src/index.css` | 无需修改 | 现有滚动条样式复用 |
| `src-tauri/src/main.rs` | 无需修改 | 后端接口保持不变 |

---

## 9. 验收标准

1. 用户点击"更多系统字体"后，不弹出模态对话框
2. 系统字体直接在下拉列表中展开显示
3. 初始加载只显示前 20 个系统字体
4. 滚动到底部时自动加载更多系统字体
5. 系统字体按名称字母顺序排序
6. 加载过程中有明确的加载状态提示
7. 选择系统字体后，下拉列表关闭，字体正确应用

---

## 10. 后续优化建议

1. **搜索功能**: 当前版本移除了搜索框，后续可以在下拉列表顶部添加搜索框，支持快速过滤系统字体
2. **最近使用**: 记录用户最近使用的系统字体，在下次打开时优先显示
3. **字体预览**: 在系统字体名称下方显示预览文字（和预设字体一致）
4. **真正的后端分页**: 如果系统字体数量非常大（>1000），可以考虑修改后端接口支持分页参数
