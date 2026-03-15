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

// ─── 工具：解析渐变背景字符串 ────────────────────────────────────────────────
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

// ─── renderCardToCanvas ──────────────────────────────────────────────────────
//
// 调用方式（注意：需在调用前等待字体加载完成）：
//   await document.fonts.ready
//   const dims = getCanvasDimensions(ctx, data);
//   canvas.width  = dims.width;
//   canvas.height = dims.height;
//   renderCardToCanvas(canvas, data, style, dims.quoteStartY, dims.openQuoteY);
//
// Fix③: 移除了原来写在模块顶层的 `await document.fonts.ready`
//        顶层 await 会导致模块解析失败（除非明确配置了 top-level await）
//        字体加载由调用方在调用前处理
export function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  data: CardData,
  style: CardStyle,
  quoteStartY: number,
  openQuoteY: number,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width  = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  // ── 圆角背景 ──────────────────────────────────────────────────────────────
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
    ctx.font      = BODY_FONT(OPENING_QUOTE_SIZE);
    ctx.fillText(quotes.open, CONTENT_START_X, openQuoteY);

    // ── 正文 ────────────────────────────────────────────────────────────────
    ctx.fillStyle = style.textColor;
    ctx.font      = BODY_FONT(FONT_SIZE);
    quoteEndY = wrapText(
      ctx,
      data.quote,
      CONTENT_START_X,
      quoteStartY,
      textAreaWidth,
      FONT_SIZE
    );

    // ── 闭引号 ──────────────────────────────────────────────────────────────
    ctx.fillStyle = style.quoteColor ?? style.accentColor;
    ctx.font      = BODY_FONT(OPENING_QUOTE_SIZE * 0.75);
    ctx.fillText(quotes.close, CONTENT_START_X, quoteEndY + OPENING_QUOTE_SIZE * 0.5);
  }

  // ── 分隔线（黄金比例宽度，右对齐）────────────────────────────────────────
  const dividerY      = quoteEndY + TEXT_TO_DIVIDER_GAP;
  const dividerWidth  = (width - 2 * CONTENT_START_X) * 0.618;
  const dividerStartX = width - CONTENT_START_X - dividerWidth;

  ctx.strokeStyle = style.accentColor;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(dividerStartX, dividerY);
  ctx.lineTo(width - CONTENT_START_X, dividerY);
  ctx.stroke();

  // ── 书名（手写斜体，右对齐，自动添加书名号）──────────────────────────────
  if (data.bookTitle?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font      = HANDWRITING_FONT(BOOK_TITLE_SIZE);

    // Fix①②: 用 measureText 测量各部分实际宽度，不用硬编码偏移
    // 《书名》作为整体右对齐，三部分连续排列
    const openBracketW  = ctx.measureText('《').width;
    const titleW        = ctx.measureText(data.bookTitle).width;
    const closeBracketW = ctx.measureText('》').width;
    const totalTitleW   = openBracketW + titleW + closeBracketW;

    // 整体右边缘对齐到 width - CONTENT_START_X
    const titleBaseX = width - CONTENT_START_X - totalTitleW;
    const titleY     = dividerY + DIVIDER_TO_TITLE_GAP;

    ctx.fillText('《',             titleBaseX,                        titleY);
    ctx.fillText(data.bookTitle,   titleBaseX + openBracketW,         titleY);
    ctx.fillText('》',             titleBaseX + openBracketW + titleW, titleY);
  }

  // ── 作者（手写斜体，右对齐）──────────────────────────────────────────────
  if (data.author?.trim()) {
    ctx.fillStyle = style.accentColor;
    ctx.font      = HANDWRITING_FONT(AUTHOR_SIZE);
    const authorW = ctx.measureText(data.author).width;
    ctx.fillText(
      data.author,
      width - CONTENT_START_X - authorW,
      dividerY + DIVIDER_TO_TITLE_GAP + BOOK_TITLE_SIZE + TITLE_TO_AUTHOR_GAP
    );
  }
}

// ─── wrapText ────────────────────────────────────────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  indent: number = fontSize * 2
): number {
  const lineHeight = fontSize * LINE_HEIGHT_MULTIPLIER;
  const PERIOD     = '。';
  const segments   = text.split(PERIOD).filter(s => s.trim());
  let currentY     = y;

  for (const segment of segments) {
    const firstLineX     = x + indent;
    const firstLineWidth = maxWidth - indent;
    const restLineX      = x;
    const restLineWidth  = maxWidth;

    const chars   = segment.split('');
    let line      = '';
    let lineX     = firstLineX;
    let lineWidth = firstLineWidth;

    for (let i = 0; i < chars.length; i++) {
      const testLine  = line + chars[i];
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > lineWidth - SAFE_MARGIN && line.length > 0) {
        ctx.fillText(line, lineX, currentY);
        currentY  += lineHeight;
        line       = chars[i];
        lineX      = restLineX;
        lineWidth  = restLineWidth;
      } else {
        line = testLine;
      }
    }

    if (line) {
      ctx.fillText(line, lineX, currentY);
      const lastLineW = ctx.measureText(line).width;
      ctx.fillText(PERIOD, lineX + lastLineW, currentY);
      currentY += lineHeight;
    }
  }

  return currentY;
}