import { useEffect, useRef } from 'react';
import { CardData } from '@/types';
import { STYLES } from './StylePicker.data';
import { renderCardToCanvas } from '@/utils/cardRenderer';

interface CardCanvasProps {
  data: CardData;
}

export function CardCanvas({ data }: CardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const style = STYLES.find(s => s.id === data.styleId) || STYLES[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on content and orientation
    const dimensions = getCanvasDimensions(ctx, data);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

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

// ─── 从 cardSizeCalculator 导入维度计算工具 ──────────────────────────────────
import {
  getCanvasDimensions,
} from '@/utils/cardSizeCalculator';