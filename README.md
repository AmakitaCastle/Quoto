# Book Quote Card 📚

生成精美书摘卡片的桌面应用

![Screenshot](./docs/screenshot.png)

## 功能

- ✨ 4 种内置风格：暗金、羊皮纸、墨绿、纯黑
- 🎨 实时预览，所见即所得
- 📋 一键复制到剪贴板
- 🔧 可调节的左右分栏布局

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
book-quote-card/
├── src/                    # React 前端
│   ├── components/         # UI 组件
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript 类型
│   ├── data/               # 示例数据
│   └── lib/                # Tauri API
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

## License

MIT
