# 字句 (Quoto) 📚

生成精美书摘卡片的桌面应用

## 功能

- ✨ 10 种内置风格：经典四色、中式气质、季节感
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
│   ├── data/               # 数据文件
│   │   ├── styles.json         # 风格配置（只需编辑此文件）
│   │   └── sampleQuotes.ts     # 示例书摘数据
│   └── lib/                # 基础库
├── src-tauri/              # Rust 后端
│   ├── src/main.rs         # Tauri 入口
│   └── Cargo.toml
└── package.json
```

## 添加新风格

编辑 `src/data/styles.json` 文件，在 `styles` 数组中添加新的风格配置：

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

**保存即可生效**，无需重启开发服务器（Vite 会自动热更新）。

### 配置字段说明

| 字段 | 说明 | 示例 |
|------|------|------|
| `id` | 风格唯一标识（英文 + 短横线格式） | `dark-gold` |
| `name` | 显示名称（中文） | `暗金` |
| `background` | CSS 渐变背景 | `linear-gradient(135deg, #1a1510 0%, #0d0d0d 100%)` |
| `border` | 边框颜色（预留） | `#2a2520` |
| `accentColor` | 强调色（书名、作者、分隔线） | `#d0b87c` |
| `textColor` | 正文颜色 | `#d0b87c` |
| `quoteColor` | 引号颜色（可选） | `#d0b87c` |

## 颜色一致性

所有书摘卡片元素使用统一的 `accentColor` 颜色系统：
- 书名：accentColor（带书名号《》）
- 作者：accentColor
- 引号：quoteColor 或 accentColor
- 分隔线：accentColor

### 内置风格配色

| 风格分类 | 风格名称 | accentColor | 效果描述 |
|----------|----------|-------------|----------|
| 经典四色 | 暗金 | #d0b87c | 金色 |
| 经典四色 | 羊皮纸 | #2a1810 | 深棕色 |
| 经典四色 | 墨绿 | #81c1a1 | 浅绿色 |
| 经典四色 | 纯黑 | #c1c1c1 | 银灰色 |
| 中式气质 | 水墨 | #1e1408 | 墨黑 |
| 中式气质 | 宣纸 | #a05014 | 朱砂红 |
| 中式气质 | 夜墨 | #8c78dc | 紫色 |
| 季节感 | 深秋 | #c87828 | 橙铜色 |
| 季节感 | 初雪 | #6478b4 | 蓝灰色 |
| 季节感 | 春日 | #4a8c3c | 草绿色 |

## License

MIT
