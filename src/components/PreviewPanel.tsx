/**
 * 预览面板组件
 *
 * 显示书摘卡片的实时预览，提供方向选择、保存和复制功能。
 * 用户可以在右侧面板看到卡片的即时渲染效果。
 *
 * @package src/components
 */

import { useRef } from 'react';
import { CardData } from '@/types';
import { CardCanvas } from './CardCanvas';
import { copyCanvasToClipboard, downloadCanvas } from './PreviewPanel.actions';
import { Button } from '@/components/ui/button';

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
 * - 方向切换：竖屏/横屏/自动
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

  return (
    <div className="flex flex-col h-full bg-[#0f0f0f]">
      {/* 顶部 Tab */}
      <div className="flex border-b border-[#2a2a2a] px-4 py-2">
        <span className="text-sm text-gold font-medium">预览</span>
      </div>

      {/* 方向选择器 */}
      <div className="flex justify-center py-2 border-b border-[#2a2a2a]">
        <div className="inline-flex bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1">
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              data.orientation === 'vertical'
                ? 'bg-gold text-black'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => onDataChange({ orientation: 'vertical' })}
          >
            竖屏
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              data.orientation === 'horizontal'
                ? 'bg-gold text-black'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => onDataChange({ orientation: 'horizontal' })}
          >
            横屏
          </button>
          <button
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              !data.orientation || data.orientation === 'auto'
                ? 'bg-gold text-black'
                : 'text-gray-400 hover:text-white'
            }`}
            onClick={() => onDataChange({ orientation: 'auto' })}
          >
            自动
          </button>
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
