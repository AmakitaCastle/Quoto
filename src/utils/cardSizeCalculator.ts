/**
 * 卡片尺寸计算器
 *
 * 负责计算书摘卡片的 Canvas 尺寸和各元素的垂直坐标位置。
 * 根据用户输入的内容长度和方向设置，动态计算合适的画布高度，
 * 确保内容不会被截断，同时保持统一的视觉边距。
 *
 * @package src/utils
 */

import { CardData } from '@/types';

// ============================================================================
// 字体配置
// ============================================================================

/**
 * 正文字体配置
 * @param size - 字体大小（像素）
 * @returns Canvas font 字符串
 */
export const BODY_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `${size}px ${fontFamily}`;
  }
  return `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
};

/**
 * 标题字体配置（中等字重）
 * @param size - 字体大小（像素）
 * @returns Canvas font 字符串
 */
export const TITLE_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `500 ${size}px ${fontFamily}`;
  }
  return `500 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
};

/**
 * 手写字体配置（用于书名和作者）
 * 使用 ZCOOL QingKe HuangYou 字体， fallback 到 Caveat
 * @param size - 字体大小（像素）
 * @returns Canvas font 字符串
 */
export const HANDWRITING_FONT = (size: number, fontFamily?: string) => {
  if (fontFamily) {
    return `italic ${size}px ${fontFamily}`;
  }
  return `italic ${size}px "ZCOOL QingKe HuangYou", "Caveat", cursive`;
};

// ============================================================================
// 布局常量
// ============================================================================

/** 内容左侧起始位置（左右对称） */
export const CONTENT_START_X = 60;

/** 安全边距，用于防止文字贴边 */
export const SAFE_MARGIN = 6;

/** 正文字号（像素） */
export const FONT_SIZE = 32;

/** 书名字号（像素） */
export const BOOK_TITLE_SIZE = 26;

/** 作者名号（像素） */
export const AUTHOR_SIZE = 22;

/** 开引号大小（像素） */
export const OPENING_QUOTE_SIZE = 48;

/**
 * 开引号底部到正文第一行顶部的间距（像素）
 * 必须保持正值，负值会导致 totalHeight 计算偏小，底部内容被截断
 */
export const OPENING_QUOTE_TO_TEXT = 8;

/** 正文最后一行到分隔线的间距（像素） */
export const TEXT_TO_DIVIDER_GAP = 24;

/** 分隔线到书名的间距（像素） */
export const DIVIDER_TO_TITLE_GAP = 32;

/** 书名基线到作者基线的间距（像素） */
export const TITLE_TO_AUTHOR_GAP = 14;

/** 行高倍数（相对于字号） */
export const LINE_HEIGHT_MULTIPLIER = 1.75;

/**
 * 上下边距（像素）
 *
 * 职责说明：
 * - 控制"画布顶部到开引号顶部"的距离
 * - 同时等于"作者文字底部到画布底部"的距离
 * - 值小 → 引号整体上移，更靠近画布顶部
 * - 值大 → 四周留白更多，更透气
 */
export const VERTICAL_MARGIN = 48;

// ============================================================================
// 类型定义
// ============================================================================

/**
 * Canvas 尺寸和关键坐标
 *
 * 由 getCanvasDimensions 函数返回，用于设置 Canvas 宽度和定位元素
 */
export interface CanvasDimensions {
  /** Canvas 宽度（像素） */
  width: number;

  /** Canvas 高度（像素） */
  height: number;

  /** 正文起始 Y 坐标（第一行文字的基线位置） */
  quoteStartY: number;

  /** 开引号起始 Y 坐标（引号底部位置） */
  openQuoteY: number;
}

// ============================================================================
// 核心函数
// ============================================================================

/**
 * 计算 Canvas 尺寸和关键坐标
 *
 * 根据用户输入的内容长度和方向设置，动态计算 Canvas 的合适尺寸。
 * 确保所有内容（书摘、分隔线、书名、作者）都能完整显示，不会被截断。
 *
 * 垂直方向布局（从上到下）：
 * ```
 * VERTICAL_MARGIN (48)         ← 上边距
 * OPENING_QUOTE_SIZE (48)      ← 开引号（顶部到基线）
 * OPENING_QUOTE_TO_TEXT (8)    ← 开引号基线到正文顶部（必须 >= 0）
 * FONT_SIZE (32)               ← 正文第一行顶部到基线
 * quoteHeight                  ← 正文（从第一行基线往下累加）
 * metaHeight (118)             ← 分隔线 + 书名 + 作者
 * VERTICAL_MARGIN (48)         ← 下边距
 * ```
 *
 * @param ctx - Canvas 2D 上下文（用于测量文字宽度）
 * @param data - 卡片数据
 * @returns Canvas 尺寸和关键坐标
 */
export function getCanvasDimensions(
  ctx: CanvasRenderingContext2D,
  data: CardData
): CanvasDimensions {
  // 根据方向决定宽度：横版 1000px，竖版 800px
  const orientation = data.orientation || 'auto';
  const canvasWidth = orientation === 'horizontal' ? 1000 : 800;
  const lineHeight = FONT_SIZE * LINE_HEIGHT_MULTIPLIER;
  const textAreaWidth = canvasWidth - 2 * CONTENT_START_X - SAFE_MARGIN;

  ctx.font = BODY_FONT(FONT_SIZE, data.fontFamily);

  // 计算正文需要多少行
  const { lineCount } = calculateWrapText(
    ctx,
    data.quote,
    textAreaWidth,
    lineHeight,
    FONT_SIZE,
    data.fontFamily
  );

  const quoteHeight = lineCount * lineHeight;

  // meta 区高度：从正文最后一行基线，到作者文字底部
  const metaHeight =
    TEXT_TO_DIVIDER_GAP +    // 24  正文 → 分隔线
    DIVIDER_TO_TITLE_GAP +   // 32  分隔线 → 书名基线
    BOOK_TITLE_SIZE +        // 26  书名字号
    TITLE_TO_AUTHOR_GAP +    // 14  书名基线 → 作者基线
    AUTHOR_SIZE;             // 22  作者字号
                             // = 118px

  // 坐标计算
  const openQuoteY = VERTICAL_MARGIN + OPENING_QUOTE_SIZE;
  const quoteStartY = openQuoteY + OPENING_QUOTE_TO_TEXT + FONT_SIZE;

  // 总高度 = 上边距 + 引号 + 间距 + 正文 + meta 区 + 下边距
  const totalHeight =
    VERTICAL_MARGIN +
    OPENING_QUOTE_SIZE +
    OPENING_QUOTE_TO_TEXT +
    FONT_SIZE +
    quoteHeight +
    metaHeight +
    VERTICAL_MARGIN;

  return {
    width: canvasWidth,
    height: Math.round(totalHeight),
    quoteStartY: Math.round(quoteStartY),
    openQuoteY: Math.round(openQuoteY),
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 计算文本换行后的行数和总高度
 *
 * 逐字测量文本宽度，当超过最大宽度时自动换行。
 * 用于预估正文需要占用多少垂直空间。
 *
 * @param ctx - Canvas 2D 上下文
 * @param text - 要测量的文本
 * @param maxWidth - 最大可用宽度（像素）
 * @param lineHeight - 行高（像素）
 * @param fontSize - 字号（像素），默认 32
 * @param fontFamily - 自定义字体族（可选）
 * @returns 行数和总高度
 */
export function calculateWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  fontSize: number = 32,
  fontFamily?: string
): { lineCount: number; totalHeight: number } {
  ctx.font = BODY_FONT(fontSize, fontFamily);

  const characters = text.split('');
  let line = '';
  let lineCount = 0;

  // 逐字累加，超过宽度就换行
  for (let i = 0; i < characters.length; i++) {
    const testLine = line + characters[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth - SAFE_MARGIN && line.length > 0) {
      lineCount++;
      line = characters[i];
    } else {
      line = testLine;
    }
  }

  // 最后一行
  if (line) lineCount++;

  return {
    lineCount,
    totalHeight: lineCount * lineHeight,
  };
}

/**
 * 测量多行文本的最大宽度
 *
 * 遍历所有行，返回最宽那一行的宽度。
 * 用于需要知道文本块最大宽度的场景。
 *
 * @param ctx - Canvas 2D 上下文
 * @param text - 文本（用 \n 分隔多行）
 * @param fontSize - 字号（像素）
 * @returns 最大行宽（像素）
 */
export function measureMaxLineWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number
): number {
  ctx.font = BODY_FONT(fontSize);
  const lines = text.split('\n');
  let maxWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxWidth) maxWidth = w;
  }
  return maxWidth;
}

/**
 * 检测文本语言
 *
 * 根据中文字符的比例判断文本是中文还是英文。
 * 中文字符比例 > 30% 则判定为中文。
 *
 * @param text - 要检测的文本
 * @returns 'cn'（中文）或 'en'（英文）
 */
export function detectLanguage(text: string): 'cn' | 'en' {
  const totalChars = text.replace(/\s/g, '').length;
  if (totalChars === 0) return 'en';
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return chineseCount / totalChars > 0.3 ? 'cn' : 'en';
}

/**
 * 获取适合文本语言的引号
 *
 * 根据文本语言返回对应的开引号和闭引号。
 * 目前中文和英文使用相同的引号字符（"）。
 *
 * @param text - 要引用的文本
 * @returns 包含 open 和 close 属性的对象
 */
export function getQuotes(text: string): { open: string; close: string } {
  const lang = detectLanguage(text);
  return lang === 'cn'
    ? { open: '\u201c', close: '' }
    : { open: '\u201c', close: '' };
}