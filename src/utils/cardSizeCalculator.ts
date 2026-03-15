import { CardData } from '@/types';

// ─── 字体统一管理 ─────────────────────────────────────────────────────────────
export const BODY_FONT  = (size: number) => `${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
export const TITLE_FONT = (size: number) => `500 ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
export const HANDWRITING_FONT = (size: number) =>
  `italic ${size}px "ZCOOL QingKe HuangYou", "Caveat", cursive`
// ─── 布局常量 ────────────────────────────────────────────────────────────────
export const CONTENT_START_X        = 60;
export const SAFE_MARGIN            = 6;
export const FONT_SIZE              = 32;
export const BOOK_TITLE_SIZE        = 26;
export const AUTHOR_SIZE            = 22;
export const OPENING_QUOTE_SIZE     = 48;

// 开引号底部到正文第一行顶部的间距
// 必须是正值，负值会导致 totalHeight 算偏小，底部内容被截断
// 如果想让引号和正文更近，减小这个值（最小为 0）
// 如果想让引号更靠近画布顶部，减小 VERTICAL_MARGIN
export const OPENING_QUOTE_TO_TEXT  = 8;

export const TEXT_TO_DIVIDER_GAP    = 24;
export const DIVIDER_TO_TITLE_GAP   = 32;
export const TITLE_TO_AUTHOR_GAP    = 14;
export const LINE_HEIGHT_MULTIPLIER = 1.75;

// ─── 核心边距常量 ─────────────────────────────────────────────────────────────
//
// 上下边距的职责说明：
//
//   VERTICAL_MARGIN  → 控制"画布顶部到开引号顶部"的距离
//                      同时也等于"作者文字底部到画布底部"的距离
//                      这个值小 → 引号整体上移，更靠近画布顶部
//                      这个值大 → 四周留白更多，更透气
//
// 原来用负的 OPENING_QUOTE_TO_TEXT 来把引号拉近正文是错的：
//   OPENING_QUOTE_TO_TEXT 参与 totalHeight 计算，
//   负值会导致 canvas 高度偏小，底部书名/作者被截断
//
// 正确做法：
//   想让引号靠近画布顶部 → 减小 VERTICAL_MARGIN
//   想让引号靠近正文     → 减小 OPENING_QUOTE_TO_TEXT（但不能为负）
export const VERTICAL_MARGIN = 48;   // 从 80/100 缩小到 48，引号更靠近画布顶部

// ─── 类型 ────────────────────────────────────────────────────────────────────
export interface CanvasDimensions {
  width: number;
  height: number;
  quoteStartY: number;
  openQuoteY: number;
}

// ─── getCanvasDimensions ─────────────────────────────────────────────────────
export function getCanvasDimensions(
  ctx: CanvasRenderingContext2D,
  data: CardData
): CanvasDimensions {
  const orientation   = data.orientation || 'auto';
  const canvasWidth   = orientation === 'horizontal' ? 1000 : 800;
  const lineHeight    = FONT_SIZE * LINE_HEIGHT_MULTIPLIER;
  const textAreaWidth = canvasWidth - 2 * CONTENT_START_X - SAFE_MARGIN;

  ctx.font = BODY_FONT(FONT_SIZE);

  const { lineCount } = calculateWrapText(
    ctx,
    data.quote,
    textAreaWidth,
    lineHeight,
    FONT_SIZE
  );

  const quoteHeight = lineCount * lineHeight;

  // meta 区：从正文最后一行基线，到作者文字底部
  const metaHeight =
    TEXT_TO_DIVIDER_GAP  +   // 24  正文 → 分隔线
    DIVIDER_TO_TITLE_GAP +   // 32  分隔线 → 书名基线
    BOOK_TITLE_SIZE      +   // 26  书名字号
    TITLE_TO_AUTHOR_GAP  +   // 14  书名基线 → 作者基线
    AUTHOR_SIZE;             // 22  作者字号
                             // = 118px

  // ── 坐标计算 ─────────────────────────────────────────────────────────────
  //
  // 垂直方向布局（从上到下）：
  //
  //  VERTICAL_MARGIN (48)         ← 上边距
  //  OPENING_QUOTE_SIZE (48)      ← 开引号（顶部到基线）
  //  OPENING_QUOTE_TO_TEXT (8)    ← 开引号基线到正文顶部（必须 >= 0）
  //  FONT_SIZE (32)               ← 正文第一行顶部到基线
  //  quoteHeight                  ← 正文（从第一行基线往下累加）
  //  metaHeight (118)             ← 分隔线 + 书名 + 作者
  //  VERTICAL_MARGIN (48)         ← 下边距

  const openQuoteY  = VERTICAL_MARGIN + OPENING_QUOTE_SIZE;
  const quoteStartY = openQuoteY + OPENING_QUOTE_TO_TEXT + FONT_SIZE;

  const totalHeight =
    VERTICAL_MARGIN       +
    OPENING_QUOTE_SIZE    +
    OPENING_QUOTE_TO_TEXT +
    FONT_SIZE             +
    quoteHeight           +
    metaHeight            +
    VERTICAL_MARGIN;

  return {
    width:       canvasWidth,
    height:      Math.round(totalHeight),
    quoteStartY: Math.round(quoteStartY),
    openQuoteY:  Math.round(openQuoteY),
  };
}

// ─── calculateWrapText ───────────────────────────────────────────────────────
export function calculateWrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
  fontSize: number = 32
): { lineCount: number; totalHeight: number } {
  ctx.font = BODY_FONT(fontSize);

  const characters = text.split('');
  let line      = '';
  let lineCount = 0;

  for (let i = 0; i < characters.length; i++) {
    const testLine = line + characters[i];
    const metrics  = ctx.measureText(testLine);

    if (metrics.width > maxWidth - SAFE_MARGIN && line.length > 0) {
      lineCount++;
      line = characters[i];
    } else {
      line = testLine;
    }
  }

  if (line) lineCount++;

  return {
    lineCount,
    totalHeight: lineCount * lineHeight,
  };
}

// ─── measureMaxLineWidth ─────────────────────────────────────────────────────
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

// ─── detectLanguage ──────────────────────────────────────────────────────────
export function detectLanguage(text: string): 'cn' | 'en' {
  const totalChars   = text.replace(/\s/g, '').length;
  if (totalChars === 0) return 'en';
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  return chineseCount / totalChars > 0.3 ? 'cn' : 'en';
}

// ─── getQuotes ───────────────────────────────────────────────────────────────
export function getQuotes(text: string): { open: string; close: string } {
  const lang = detectLanguage(text);
  return lang === 'cn'
    ? { open: '\u201c', close: '' }
    : { open: '\u201c', close: '' };
}