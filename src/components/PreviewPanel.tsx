/**
 * 预览面板组件
 *
 * 显示书摘卡片的实时预览，提供宽高比选择、保存和复制功能。
 * 用户可以在右侧面板看到卡片的即时渲染效果。
 *
 * @package src/components
 */

import { useRef } from 'react';
import { CardData } from '@/types';
import { CardCanvas } from './CardCanvas';
import { copyCanvasToClipboard, downloadCanvas } from './PreviewPanel.actions';
import { Button } from '@/components/ui/button';
import { ASPECT_RATIOS, AspectRatio } from '@/utils/cardSizeCalculator';

/** 预览面板组件的属性 */
interface PreviewPanelProps {
  /** 当前卡片数据 */
  data: CardData;

  /** 数据变化回调 */
  onDataChange: (data: Partial<CardData>) => void;
}

/**
 * 预览面板组件
 *
 * 位于应用右侧，提供以下功能：
 * - 卡片预览：使用 CardCanvas 实时渲染
 * - 宽高比选择：竖屏 3:4 / 方形 1:1 / 横屏 4:3
 * - 保存到本地：下载 PNG 图片
 * - 复制图片：复制到剪贴板
 *
 * 空状态处理：当用户未输入书摘时，显示占位提示。
 *
 * @param props - 组件属性
 */
export function PreviewPanel({ data, onDataChange }: PreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /** 保存卡片到本地 */
  const handleSave = async () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    // 文件名中使用书名和前 10 个字符的书摘
    const sanitize = (s: string) => s.replace(/[<>:"/\\|？*]/g, '_');
    const filename = `${sanitize(data.bookTitle)}_${sanitize(data.quote.slice(0, 10))}.png`;
    await downloadCanvas(canvas, filename);
  };

  /** 复制卡片到剪贴板 */
  const handleCopy = async () => {
    const canvas = containerRef.current?.querySelector('canvas');
    if (!canvas) return;
    await copyCanvasToClipboard(canvas);
  };

  // 获取当前宽高比（兼容旧数据）
  const currentAspectRatio: AspectRatio =
    data.aspectRatio ??
    (data.orientation === 'horizontal' ? '4:3' : '3:4');

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* 顶部 Tab */}
      <div className="flex border-b border-[#2a2a2a] px-4 py-2">
        <span className="text-sm text-gold font-medium">预览</span>
      </div>

      {/* 宽高比选择器 */}
      <div className="flex justify-center py-2 border-b border-[#2a2a2a]">
        <div className="relative">
          <select
            value={currentAspectRatio}
            onChange={(e) => onDataChange({ aspectRatio: e.target.value as AspectRatio })}
            className="appearance-none bg-[#1a1a1a] border border-[#2a2a2a] text-gray-100 text-sm rounded-lg px-4 py-2 pr-8 focus:outline-none focus:border-gold cursor-pointer"
          >
            {Object.entries(ASPECT_RATIOS).map(([key, { name }]) => (
              <option key={key} value={key}>
                {name} {key}
              </option>
            ))}
          </select>
          {/* 下拉箭头 */}
          <svg
            className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 卡片预览区 */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div ref={containerRef}>
          {(() => {
            // 检查是否有内容：书摘或书名任一不为空则显示卡片
            const hasContent = data.quote.trim() || data.bookTitle.trim();

            if (hasContent) {
              return <CardCanvas data={data} />;
            }

            // 空状态：显示占位提示
            return (
              <div className="text-gray-600 text-sm">输入书摘句子后，预览将显示在这里</div>
            );
          })()}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="flex gap-4 p-4 border-t border-[#2a2a2a] justify-end">
        <Button
          variant="outline"
          size="sm"
          className="border-[#333] text-gray-400 hover:text-white"
          onClick={handleSave}
        >
          保存到本地
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-[#333] text-gray-400 hover:text-white"
          onClick={handleCopy}
        >
          复制图片
        </Button>
      </div>
    </div>
  );
}
