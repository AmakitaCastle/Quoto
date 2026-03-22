/**
 * 卡片画布组件
 *
 * 使用 HTML5 Canvas 渲染书摘卡片。
 * 根据输入数据（书摘、书名、作者）和选择的风格，
 * 动态计算画布尺寸并绘制精美的书摘卡片。
 *
 * @package src/components
 */

import { useState, useEffect, useRef } from 'react';
import { CardData, BackgroundConfig } from '@/types';
import { STYLES } from './StylePicker.data';
import { renderCardToCanvas } from '@/utils/cardRenderer';
import { getCanvasDimensionsV2 } from '@/utils/cardSizeCalculator';
import { backgroundCache } from '@/utils/backgroundCache';
import { loadBackgroundFromUpload, getDefaultGradient } from '@/utils/coverExtractor';

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

  const [backgroundConfig, setBackgroundConfig] = useState<BackgroundConfig | null>(null);
  const [backgroundLoading, setBackgroundLoading] = useState(false);

  // 加载背景配置（优先使用上传的图片）
  useEffect(() => {
    const loadBackground = async () => {
      // 如果有上传的背景图片，直接使用
      if (data.uploadedBackground) {
        setBackgroundLoading(true);
        const config = await loadBackgroundFromUpload(data.uploadedBackground);
        backgroundCache.set(data.bookTitle, config);
        setBackgroundConfig(config);
        setBackgroundLoading(false);
        return;
      }

      // 检查缓存
      const cached = backgroundCache.get(data.bookTitle);
      if (cached) {
        setBackgroundConfig(cached);
        return;
      }

      // 没有上传图片时使用默认渐变
      const config = getDefaultGradient();
      backgroundCache.set(data.bookTitle, config);
      setBackgroundConfig(config);
    };

    loadBackground();
  }, [data.bookTitle, data.uploadedBackground]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 根据宽高比计算画布尺寸（使用 Standard 700px 作为基准宽度）
    const dimensions = getCanvasDimensionsV2(ctx, data, 700);
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // 在 Canvas 上绘制完整卡片
    renderCardToCanvas(canvas, data, style, dimensions.quoteStartY, dimensions.openQuoteY, backgroundConfig ?? undefined);
  }, [data, style, backgroundConfig]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        style={{ maxWidth: '400px', height: 'auto' }}
      />
      {backgroundLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
          <div className="w-6 h-6 border-2 border-[#d4a044] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}