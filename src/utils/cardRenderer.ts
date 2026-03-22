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
 * 用 actualBoundingBoxRight 让文字墨迹右边缘精确对齐到 rightEdge，
 * 避免中文标点 side-bearing 造成的视觉偏移。
 */
function fillTextAlignRight(
  ctx: CanvasRenderingContext2D,
  text: string,
  rightEdge: number,
  y: number
): void {
  const metrics = ctx.measureText(text);
  const inkRight = metrics.actualBoundingBoxRight ?? metrics.width;
  ctx.fillText(text, rightEdge - inkRight, y);
}

/**
 * 贪心折行，返回 string[]。
 * 不做首行缩进——调用方统一左对齐，视觉更整洁。
 */
function buildLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const chars = text.split('');
  const lines: string[] = [];
  let line = '';

  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      lines.push(line);
      line = ch;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * 孤行修复：若最后一行字数 <= orphanThreshold，
 * 把倒数第二行的最后一个字移到最后一行，消除孤行。
 */
function fixOrphan(lines: string[], orphanThreshold = 2): string[] {
  if (lines.length < 2) return lines;
  const last = lines[lines.length - 1];
  if (last.length <= orphanThreshold) {
    const prev = lines[lines.length - 2];
    // 把倒数第二行最后一字移过来
    lines[lines.length - 2] = prev.slice(0, -1);
    lines[lines.length - 1] = prev.slice(-1) + last;
  }
  return lines;
}

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

/**
 * 绘制背景
 */
function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  style: CardStyle
): void {
  const gradient = parseGradient(style.background, ctx, height);
  ctx.fillStyle = gradient ?? style.background;
  ctx.fillRect(0, 0, width, height);
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
 * 3. 正文（自动换行，贪心算法 + 孤行修复）
 * 4. 分隔线（黄金比例宽度，右对齐）
 * 5. 书名（带书名号，手写字体，右对齐）
 * 6. 作者（手写字体，右对齐，使用 actualBoundingBoxRight 精确对齐）
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

  // 绘制背景
  drawBackground(ctx, width, height, style);

  ctx.restore();

  const textAreaWidth = width - 2 * CONTENT_START_X - SAFE_MARGIN;
  const rightEdge = width - CONTENT_START_X;
  let quoteEndY = quoteStartY;

  if (data.quote.trim()) {
    const quotes = getQuotes(data.quote);

    // ── 开引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font = BODY_FONT(OPENING_QUOTE_SIZE, data.fontFamily);
    ctx.fillText(quotes.open, CONTENT_START_X, openQuoteY);

    // ── 正文（使用贪心折行 + 孤行修复）───────────────────────────────────────
    ctx.fillStyle = style.textColor;
    ctx.font = BODY_FONT(FONT_SIZE, data.fontFamily);

    const lines = buildLines(ctx, data.quote, textAreaWidth);
    const fixedLines = fixOrphan(lines);
    const lineHeight = FONT_SIZE * LINE_HEIGHT_MULTIPLIER;

    fixedLines.forEach((line, i) => {
      ctx.fillText(line, CONTENT_START_X, quoteStartY + i * lineHeight);
    });

    quoteEndY = quoteStartY + (fixedLines.length - 1) * lineHeight;
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
  // 使用 actualBoundingBoxRight 实现精确的右边缘对齐
  const titleY = dividerY + DIVIDER_TO_TITLE_GAP;

  if (data.bookTitle?.trim()) {
    ctx.fillStyle = style.accentColor;

    // 书名号使用中文正文字体
    const bracketFont = `${BOOK_TITLE_SIZE}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    // 书名使用手写字体
    const titleFont = HANDWRITING_FONT(BOOK_TITLE_SIZE, data.handwritingFont);

    // 测量书名号《》宽度（使用 bracketFont）
    ctx.font = bracketFont;
    const openBracketW = ctx.measureText('《').width;

    // 测量书名宽度（使用 titleFont）
    ctx.font = titleFont;
    const titleW = ctx.measureText(data.bookTitle).width;

    // 计算书名整体宽度（《 + 书名 + 》）
    // 注意：》使用 actualBoundingBoxRight 来精确测量墨迹右边缘
    ctx.font = bracketFont;
    const closeBracketMetrics = ctx.measureText('》');
    const closeBracketInkRight = closeBracketMetrics.actualBoundingBoxRight ?? closeBracketMetrics.width;

    const totalTitleW = openBracketW + titleW + closeBracketInkRight;

    // 整体右边缘对齐到 rightEdge
    const titleBaseX = rightEdge - totalTitleW;

    // 绘制《
    ctx.font = bracketFont;
    ctx.fillText('《', titleBaseX, titleY);

    // 绘制书名
    ctx.font = titleFont;
    ctx.fillText(data.bookTitle, titleBaseX + openBracketW, titleY);

    // 绘制》（使用 fillTextAlignRight 确保精确右对齐）
    ctx.font = bracketFont;
    const closeX = titleBaseX + openBracketW + titleW;
    // 》的右边缘应该对齐到 titleBaseX + openBracketW + titleW + closeBracketInkRight
    // 所以我们用 fillTextAlignRight 从 closeX + closeBracketInkRight 的位置开始
    fillTextAlignRight(ctx, '》', closeX + closeBracketInkRight, titleY);
  }

  // ── 作者（手写斜体，右对齐：与书名号》的右边缘视觉对齐）────────────────────
  if (data.author?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font = HANDWRITING_FONT(AUTHOR_SIZE, data.handwritingFont);

    const authorY = dividerY + DIVIDER_TO_TITLE_GAP + BOOK_TITLE_SIZE + TITLE_TO_AUTHOR_GAP;

    // 使用 fillTextAlignRight 实现精确的右边缘对齐
    fillTextAlignRight(ctx, data.author, rightEdge, authorY);
  }
}