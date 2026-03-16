# 风格选择器分页签改造设计

## 概述

将现有的平铺式风格选择器改造为分组 Tab 分页式，提升界面简洁度并支持未来扩展。

## 当前问题

- 10 个风格按钮横向平铺，占用空间大
- 视觉负担重，用户难以快速定位
- 不支持优雅扩展（新增风格会加剧拥挤）

## 设计方案

### 方案 C：Tab + 网格紧凑式

**核心交互：**
1. 顶部 Tab 导航栏展示 3 个风格分组
2. 点击 Tab 切换当前激活分组
3. 内容区以网格布局展示当前分组的风格按钮
4. 默认激活"经典四色"分组

**视觉规范：**
- Tab 激活状态：文字 `#e8e0d0`（暖白色）+ 下划线同色
- Tab 未激活：文字 `#6b7280`（灰色）
- 风格按钮选中：边框 `#e8e0d0` + 风格自身文字色
- 风格按钮未选中：边框 `#2a2a2a` + 风格自身文字色

### 数据结构

**新增分组配置：**

```typescript
export interface StyleGroup {
  id: string;
  name: string;
  styles: CardStyleId[];
}

export const STYLE_GROUPS: StyleGroup[] = [
  {
    id: 'classic',
    name: '经典四色',
    styles: ['dark-gold', 'parchment', 'ink-green', 'pure-black']
  },
  {
    id: 'chinese',
    name: '中式气质',
    styles: ['ink-wash', 'xuan-paper', 'night-ink']
  },
  {
    id: 'seasonal',
    name: '季节感',
    styles: ['deep-autumn', 'first-snow', 'spring-day']
  }
];
```

**STYLES 保持现状：** `StylePicker.data.ts` 中的 `STYLES` 数组保持不变，作为风格定义的单一数据源。

### 组件结构

**StylePicker 组件改造：**

```tsx
export function StylePicker({ selectedStyle, onStyleChange }: StylePickerProps) {
  const [activeTab, setActiveTab] = useState<string>('classic'); // 默认经典四色

  const currentGroup = STYLE_GROUPS.find(g => g.id === activeTab);
  const currentStyles = currentGroup?.styles.map(id => STYLES.find(s => s.id === id)).filter(Boolean);

  return (
    <div>
      {/* Tab 导航 */}
      <div className="flex border-b border-gray-700 mb-3">
        {STYLE_GROUPS.map(group => (
          <button
            key={group.id}
            className={`px-3 py-1.5 text-xs ${
              activeTab === group.id
                ? 'text-[#e8e0d0] border-b-2 border-[#e8e0d0]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(group.id)}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* 风格按钮网格 */}
      <div className="grid grid-cols-4 gap-2">
        {currentStyles?.map(style => (
          <button
            key={style.id}
            className={`px-2 py-2 text-xs rounded border text-center ${
              selectedStyle === style.id
                ? 'border-[#e8e0d0]'
                : 'border-[#2a2a2a]'
            }`}
            style={{
              background: style.background,
              color: style.textColor,
            }}
            onClick={() => onStyleChange(style.id)}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/types/index.ts` | 新增 | 添加 `StyleGroup` 接口 |
| `src/components/StylePicker.data.ts` | 新增 | 添加 `STYLE_GROUPS` 配置数组 |
| `src/components/StylePicker.tsx` | 修改 | 添加 Tab 状态管理，改造渲染逻辑 |

### 行为细节

1. **Tab 切换**：点击 Tab 仅切换显示内容，不改变当前选中的风格
2. **跨 Tab 选择**：如果用户在"经典四色"选中"暗金"，切换到"中式气质"后，"暗金"仍然是当前选中的风格（通过父组件的 `selectedStyle` 保持）
3. **视觉反馈**：当前选中的风格始终有 `#e8e0d0` 边框高亮，无论在哪一个 Tab 下

### 扩展性

- 新增风格：在 `STYLES` 中添加，并在对应分组的 `styles` 数组中引用
- 新增分组：在 `STYLE_GROUPS` 中添加新对象
- 网格列数：可通过 Tailwind 类调整（当前 `grid-cols-4`）
