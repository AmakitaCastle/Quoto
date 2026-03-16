/**
 * 卡片渲染器
 *
 * 核心渲染逻辑：在 HTML5 Canvas 上绘制书摘卡片。
 * 负责绘制背景、引号、正文、分隔线、书名和作者等所有视觉元素。
 *
 * @package src/utils
 */

import { CardData, CardStyle } from '@/types';
import {
  getQuotes,
  LINE_HEIGHT_MULTIPLIER,
  BODY_FONT,
  CONTENT_START_X,
  SAFE_MARGIN,
  FONT_SIZE,
  BOOK_TITLE_SIZE,
  AUTHOR_SIZE,
  OPENING_QUOTE_SIZE,
  TEXT_TO_DIVIDER_GAP,
  DIVIDER_TO_TITLE_GAP,
  TITLE_TO_AUTHOR_GAP,
  HANDWRITING_FONT,
} from '@/utils/cardSizeCalculator';

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 解析 CSS 渐变字符串并创建 Canvas 渐变对象
 *
 * 支持 linear-gradient 语法解析，例如：
 * "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)"
 *
 * @param gradientStr - CSS 渐变字符串
 * @param ctx - Canvas 2D 上下文
 * @param height - Canvas 高度（用于设置渐变终点）
 * @returns CanvasGradient 对象，解析失败时返回 null
 */
function parseGradient(
  gradientStr: string,
  ctx: CanvasRenderingContext2D,
  height: number
): CanvasGradient | null {
  const match = gradientStr.match(
    /linear-gradient\((\d+)deg,\s*(#[a-fA-F0-9]+)\s*\d*%?,\s*(#[a-fA-F0-9]+)\s*\d*%?\)/
  );
  if (!match) return null;
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, match[2]);
  gradient.addColorStop(1, match[3]);
  return gradient;
}

// ============================================================================
// 核心渲染函数
// ============================================================================

/**
 * 在 Canvas 上绘制完整的书摘卡片
 *
 * 绘制顺序：
 * 1. 圆角背景（使用 clip() 确保渐变被正确裁剪）
 * 2. 开引号
 * 3. 正文（自动换行，按句号分段）
 * 4. 闭引号
 * 5. 分隔线（黄金比例宽度，右对齐）
 * 6. 书名（带书名号，手写字体，右对齐）
 * 7. 作者（手写字体，右对齐）
 *
 * @param canvas - HTML Canvas 元素
 * @param data - 卡片数据（书摘、书名、作者等）
 * @param style - 风格配置（颜色、背景等）
 * @param quoteStartY - 正文起始 Y 坐标
 * @param openQuoteY - 开引号起始 Y 坐标
 */
export function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  data: CardData,
  style: CardStyle,
  quoteStartY: number,
  openQuoteY: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // ── 圆角背景 ──────────────────────────────────────────────────────────────
  // 使用 quadraticCurveTo 绘制 20px 圆角矩形路径
  const cornerRadius = Math.min(20, width / 2, height / 2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cornerRadius, 0);
  ctx.lineTo(width - cornerRadius, 0);
  ctx.quadraticCurveTo(width, 0, width, cornerRadius);
  ctx.lineTo(width, height - cornerRadius);
  ctx.quadraticCurveTo(width, height, width - cornerRadius, height);
  ctx.lineTo(cornerRadius, height);
  ctx.quadraticCurveTo(0, height, 0, height - cornerRadius);
  ctx.lineTo(0, cornerRadius);
  ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
  ctx.closePath();
  ctx.clip();

  // 应用渐变背景
  const gradient = parseGradient(style.background, ctx, height);
  ctx.fillStyle = gradient ?? style.background;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  const textAreaWidth = width - 2 * CONTENT_START_X - SAFE_MARGIN;
  let quoteEndY = quoteStartY;

  if (data.quote.trim()) {
    const quotes = getQuotes(data.quote);

    // ── 开引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font = BODY_FONT(OPENING_QUOTE_SIZE, data.fontFamily);
    ctx.fillText(quotes.open, CONTENT_START_X, openQuoteY);

    // ── 正文 ────────────────────────────────────────────────────────────────
    ctx.fillStyle = style.textColor;
    ctx.font = BODY_FONT(FONT_SIZE, data.fontFamily);
    quoteEndY = wrapText(
      ctx,
      data.quote,
      CONTENT_START_X,
      quoteStartY,
      textAreaWidth,
      FONT_SIZE,
      data.fontFamily,
      FONT_SIZE * 2
    );

    // ── 闭引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font = BODY_FONT(OPENING_QUOTE_SIZE * 0.75, data.fontFamily);
    ctx.fillText(quotes.close, CONTENT_START_X, quoteEndY + OPENING_QUOTE_SIZE * 0.5);
  }

  // ── 分隔线（黄金比例宽度，右对齐）────────────────────────────────────────
  const dividerY = quoteEndY + TEXT_TO_DIVIDER_GAP;
  const dividerWidth = (width - 2 * CONTENT_START_X) * 0.618;
  const dividerStartX = width - CONTENT_START_X - dividerWidth;

  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(dividerStartX, dividerY);
  ctx.lineTo(width - CONTENT_START_X, dividerY);
  ctx.stroke();

  // ── 书名（手写斜体，右对齐，自动添加书名号）──────────────────────────────
  if (data.bookTitle?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font = HANDWRITING_FONT(BOOK_TITLE_SIZE, data.handwritingFont);

    // 测量《书名》各部分宽度，实现整体右对齐
    const openBracketW = ctx.measureText('《').width;
    const titleW = ctx.measureText(data.bookTitle).width;
    const closeBracketW = ctx.measureText('》').width;
    const totalTitleW = openBracketW + titleW + closeBracketW;

    // 整体右边缘对齐到 width - CONTENT_START_X
    const titleBaseX = width - CONTENT_START_X - totalTitleW;
    const titleY = dividerY + DIVIDER_TO_TITLE_GAP;

    ctx.fillText('《', titleBaseX, titleY);
    ctx.fillText(data.bookTitle, titleBaseX + openBracketW, titleY);
    ctx.fillText('》', titleBaseX + openBracketW + titleW, titleY);
  }

  // ── 作者（手写斜体，右对齐）──────────────────────────────────────────────
  if (data.author?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font = HANDWRITING_FONT(AUTHOR_SIZE, data.handwritingFont);
    const authorW = ctx.measureText(data.author).width;
    ctx.fillText(
      data.author,
      width - CONTENT_START_X - authorW,
      dividerY + DIVIDER_TO_TITLE_GAP + BOOK_TITLE_SIZE + TITLE_TO_AUTHOR_GAP
    );
  }
}

// ============================================================================
// 文本处理函数
// ============================================================================

/**
 * 自动换行文本渲染
 *
 * 按句号（.）分段，每段首行缩进 2 个字符宽度。
 * 当文本超过最大宽度时自动换行。
 *
 * @param ctx - Canvas 2D 上下文
 * @param text - 要渲染的文本
 * @param x - 起始 X 坐标
 * @param y - 起始 Y 坐标
 * @param maxWidth - 最大可用宽度
 * @param fontSize - 字号
 * @param fontFamily - 自定义字体族（可选）
 * @param indent - 首行缩进量，默认 2 倍字号
 * @returns 文本结束时的 Y 坐标
 */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontFamily?: string,
  indent: number = fontSize * 2
): number {
  const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
  const PERIOD = '。';
  const segments = text.split(PERIOD).filter(s => s.trim());
  let currentY = y;

  ctx.font = BODY_FONT(fontSize, fontFamily);

  for (const segment of segments) {
    const firstLineX = x + indent;
    const firstLineWidth = maxWidth - indent;
    const restLineX = x;
    const restLineWidth = maxWidth;

    const chars = segment.split('');
    let line = '';
    let lineX = firstLineX;
    let lineWidth = firstLineWidth;

    // 逐字累加，超过宽度就换行
    for (let i = 0; i < chars.length; i++) {
      const testLine = line + chars[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > lineWidth - SAFE_MARGIN && line.length > 0) {
        ctx.fillText(line, lineX, currentY);
        currentY += lineHeight;
        line = chars[i];
        lineX = restLineX;
        lineWidth = restLineWidth;
      } else {
        line = testLine;
      }
    }

    // 渲染最后一段
    if (line) {
      ctx.fillText(line, lineX, currentY);
      const lastLineW = ctx.measureText(line).width;
      ctx.fillText(PERIOD, lineX + lastLineW, currentY);
      currentY += lineHeight;
    }
  }

  return currentY;
}