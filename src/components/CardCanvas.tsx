/**
 * 卡片画布组件
 *
 * 使用 HTML5 Canvas 渲染书摘卡片。
 * 根据输入数据（书摘、书名、作者）和选择的风格，
 * 动态计算画布尺寸并绘制精美的书摘卡片。
 *
 * @package src/components
 */

import { useEffect, useRef } from 'react';
import { CardData } from '@/types';
import { STYLES } from './StylePicker.data';
import { renderCardToCanvas } from '@/utils/cardRenderer';
import { getCanvasDimensions } from '@/utils/cardSizeCalculator';

/** 卡片画布组件的属性 */
interface CardCanvasProps {
  /** 卡片数据：包含书摘、书名、作者和风格选择 */
  data: CardData;
}

/**
 * 卡片画布组件
 *
 * 封装 Canvas 渲染逻辑的 React 组件。
 * 当数据或风格变化时，自动重新计算尺寸并重新绘制。
 *
 * @example
 * ```tsx
 * <CardCanvas data={{
 *   quote: "书摘内容",
 *   bookTitle: "书名",
 *   author: "作者",
 *   styleId: 'dark-gold'
 * }} />
 * ```
 */
export function CardCanvas({ data }: CardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const style = STYLES.find(s => s.id === data.styleId) || STYLES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 根据内容和方向计算画布尺寸
    const dimensions = getCanvasDimensions(ctx, data);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // 在 Canvas 上绘制完整卡片
    renderCardToCanvas(canvas, data, style, dimensions.quoteStartY, dimensions.openQuoteY);
  }, [data, style]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto"
      style={{ maxWidth: '400px', height: 'auto' }}
    />
  );
}