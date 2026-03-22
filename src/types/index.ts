/**
 * 字句应用的核心类型定义
 *
 * 本文件定义了书摘卡片应用的所有核心数据类型：
 * - CardData: 卡片渲染所需的数据结构
 * - CardStyleId: 十种内置风格的唯一标识
 * - CardStyle: 每种风格的视觉配置
 */

/**
 * 书摘卡片数据接口
 *
 * 用于存储和传递渲染书摘卡片所需的全部数据。
 * 在 InputPanel 中输入，通过 PreviewPanel 预览，最终由 CardCanvas 渲染。
 */
export interface CardData {
  /** 书摘句子内容（必填） */
  quote: string;

  /** 书名（必填，渲染时会自动添加书名号《》） */
  bookTitle: string;

  /** 作者（可选） */
  author?: string;

  /** 风格 ID，决定卡片的配色方案 */
  styleId: CardStyleId;

  /**
   * 卡片宽高比（可选，默认 '3:4'）
   * - '3:4': 竖屏（宽度 : 高度 = 3 : 4）
   * - '1:1': 方形（宽度 = 高度）
   * - '4:3': 横屏（宽度 : 高度 = 4 : 3）
   */
  aspectRatio?: '3:4' | '1:1' | '4:3';

  /**
   * 卡片方向（已废弃，使用 aspectRatio 替代）
   * @deprecated 请使用 aspectRatio
   */
  orientation?: 'vertical' | 'horizontal' | 'auto';

  /** 正文字体（可选） */
  fontFamily?: string;

  /** 书名/作者字体（可选） */
  handwritingFont?: string;

  /** 用户上传的背景图片（可选） */
  uploadedBackground?: string;
}

/**
 * 卡片风格 ID 类型
 *
 * 十种内置风格的唯一标识符：
 *
 * 经典四色：
 * - 'dark-gold': 暗金风格，金色 accentColor (#d0b87c)
 * - 'parchment': 羊皮纸风格，深棕色 accentColor (#2a1810)
 * - 'ink-green': 墨绿风格，浅绿色 accentColor (#81c1a1)
 * - 'pure-black': 纯黑风格，银灰色 accentColor (#c1c1c1)
 *
 * 中式气质：
 * - 'ink-wash': 水墨风格，墨黑 accentColor (#1e1408)
 * - 'xuan-paper': 宣纸风格，朱砂红 accentColor (#a05014)
 * - 'night-ink': 夜墨风格，紫色 accentColor (#8c78dc)
 *
 * 季节感：
 * - 'deep-autumn': 深秋风格，橙铜色 accentColor (#c87828)
 * - 'first-snow': 初雪风格，蓝灰 accentColor (#6478b4)
 * - 'spring-day': 春日风格，草绿 accentColor (#4a8c3c)
 */
export type CardStyleId =
  | 'dark-gold'
  | 'parchment'
  | 'ink-green'
  | 'pure-black'
  | 'ink-wash'
  | 'xuan-paper'
  | 'night-ink'
  | 'deep-autumn'
  | 'first-snow'
  | 'spring-day';

/**
 * 卡片风格配置接口
 *
 * 定义每种风格的视觉属性。所有风格共享同一套配置结构，
 * 但具体的颜色值和渐变背景不同。
 */
export interface CardStyle {
  /** 风格唯一标识，与 CardStyleId 对应 */
  id: CardStyleId;

  /** 风格显示名称，如"暗金"、"羊皮纸" */
  name: string;

  /**
   * 背景样式，使用 CSS linear-gradient 语法
   * 例如："linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
   */
  background: string;

  /** 边框颜色（目前未使用，预留扩展） */
  border: string;

  /**
   * 强调色（accent color）
   * 用于书名、作者、分隔线等关键元素，保持视觉一致性
   */
  accentColor: string;

  /** 正文书摘文字的颜色 */
  textColor: string;

  /**
   * 引号颜色（可选）
   * 如果未设置，会自动使用 accentColor
   */
  quoteColor?: string;
}

/**
 * 风格分组配置接口
 *
 * 用于将风格按类别分组展示，支持 Tab 分页式选择器。
 */
export interface StyleGroup {
  /** 分组唯一标识 */
  id: string;

  /** 分组显示名称，如"经典四色"、"中式气质" */
  name: string;

  /** 该分组包含的风格 ID 列表 */
  styles: CardStyleId[];
}

/**
 * 字体配置接口
 *
 * 用于定义可用字体的配置信息，包括字体 ID、名称、CSS 字体族和预览文本。
 */
export interface FontConfig {
  /** 字体唯一标识 */
  id: string;

  /** 字体显示名称 */
  name: string;

  /** CSS font-family 值 */
  family: string;

  /** 预览文本 */
  preview: string;
}

/**
 * 背景配置接口
 *
 * 用于书籍封面背景系统的配置
 */
export interface BackgroundConfig {
  /** 背景类型 */
  type: 'cover' | 'gradient';
  /** 主色数组（3-5 个颜色） */
  colors: string[];
  /** 视觉元素类型 */
  pattern: PatternType;
  /** 上传的图片 URL（仅 cover 类型） */
  imageUrl?: string;
  /** 遮罩不透明度 (0.6-0.7) */
  maskOpacity: number;
}

/**
 * 视觉元素类型
 *
 * 用于识别封面特征并生成对应的背景效果
 */
export type PatternType =
  | 'stars'      // 星空元素（如小王子）
  | 'texture'    // 纸质纹理（如红楼梦）
  | 'geometric'  // 几何图案（如 1984）
  | 'sparkle'    // 闪烁效果（如绿野仙踪）
  | 'minimal';  // 极简风格（如白夜行）
