# 字句 (Quoto) 📚

生成精美书摘卡片的桌面应用

## 功能

- ✨ 4 种内置风格：暗金、羊皮纸、墨绿、纯黑
- 🎨 实时预览，所见即所得
- 📋 一键复制到剪贴板
- 🔧 可调节的左右分栏布局
- 🎯 书名号自动添加
- ✒️ 手写字体支持

## 技术栈

- **Tauri 2.x** - 桌面应用框架
- **React 18** - 前端框架
- **shadcn/ui** - UI 组件库
- **Tailwind CSS** - 样式
- **HTML Canvas** - 卡片渲染

## 快速开始

### 环境要求

- Node.js 18+
- Rust 1.70+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run tauri dev
```

### 构建发布版

```bash
npm run tauri build
```

## 项目结构

```
ziju/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   │   ├── CardCanvas.tsx     # 卡片画布组件
│   │   ├── InputPanel.tsx     # 输入面板组件
│   │   ├── PreviewPanel.tsx   # 预览面板组件
│   │   └── StylePicker.tsx    # 风格选择器
│   ├── utils/              # 工具函数
│   │   ├── cardRenderer.ts         # 卡片渲染逻辑
│   │   └── cardSizeCalculator.ts   # 尺寸计算
│   ├── types/              # TypeScript 类型
│   └── data/               # 示例数据
├── src-tauri/              # Rust 后端
│   ├── src/main.rs         # Tauri 入口
│   └── Cargo.toml
└── package.json
```

## 添加新风格

编辑 `src/components/StylePicker.data.ts`，添加新的风格配置：

```typescript
{
  id: 'your-style-id',
  name: '风格名称',
  background: 'linear-gradient(...)',
  border: '#xxxxxx',
  accentColor: '#xxxxxx',
  textColor: '#xxxxxx',
  quoteColor: '#xxxxxx',
}
```

## 颜色一致性

所有书摘卡片元素使用统一的 `accentColor` 颜色系统：
- 书名：accentColor（带书名号《》）
- 作者：accentColor
- 引号：quoteColor 或 accentColor
- 分隔线：accentColor

### 内置风格配色

| 风格 | accentColor | 效果 |
|------|-------------|------|
| 暗金 | #d0b87c | 金色 |
| 羊皮纸 | #2a1810 | 深棕色 |
| 墨绿 | #81c1a1 | 浅绿色 |
| 纯黑 | #c1c1c1 | 银灰色 |

## License

MIT
