/**
 * 输入面板组件
 *
 * 提供用户输入书摘信息的表单界面。
 * 包含句子、书名、作者三个输入字段，以及风格选择器和保存按钮。
 *
 * @package src/components
 */

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardData } from '@/types';
import { SAMPLE_QUOTES } from '@/data/sampleQuotes';
import { StylePicker } from './StylePicker';
import { FontPicker } from './FontPicker';

/** 输入面板组件的属性 */
interface InputPanelProps {
  /** 当前卡片数据 */
  data: CardData;

  /** 数据变化回调，接收部分更新 */
  onDataChange: (data: Partial<CardData>) => void;

  /** 保存按钮点击回调 */
  onSave: () => void;

  /** 风格变化回调 */
  onStyleChange?: (styleId: CardData['styleId']) => void;

  /** 字体变化回调 */
  onFontChange?: (type: 'body' | 'handwriting', fontFamily: string) => void;
}

/**
 * 输入面板组件
 *
 * 位于应用左侧的输入区域，用户可以：
 * - 输入或粘贴书摘句子
 * - 输入书名和作者
 * - 点击"填充示例"快速填入预设内容
 * - 点击"保存卡片"生成并下载图片
 *
 * @param props - 组件属性
 */
export function InputPanel({ data, onDataChange, onSave, onStyleChange, onFontChange }: InputPanelProps) {
  /** 填充示例数据 */
  const handleFillSample = () => {
    const randomQuote = SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)];
    onDataChange(randomQuote);
  };

  /** 处理图片上传 */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onDataChange({ uploadedBackground: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /** 处理拖放上传 */
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onDataChange({ uploadedBackground: event.target.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  /** 处理拖放阻止默认行为 */
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  /** 移除背景图片 */
  const handleRemoveBackground = () => {
    onDataChange({ uploadedBackground: undefined });
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4 overflow-y-auto">
      {/* 背景图片上传 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">背景图片</label>
        <div
          className={`border-2 border-dashed rounded-md p-4 text-center transition-colors ${
            data.uploadedBackground
              ? 'border-gold bg-[#1a1a1a]'
              : 'border-[#2a2a2a] hover:border-gold-hover'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {data.uploadedBackground ? (
            <div className="relative">
              <img
                src={data.uploadedBackground}
                alt="Background preview"
                className="max-h-32 mx-auto rounded-md object-cover"
              />
              <button
                onClick={handleRemoveBackground}
                className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white rounded-full p-1 text-xs"
                title="移除背景"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p className="text-xs text-gray-500 mt-2">点击"保存卡片"时使用此背景</p>
            </div>
          ) : (
            <div>
              <svg className="mx-auto h-8 w-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-400 mt-2">拖拽图片到此处或点击选择</p>
              <label className="mt-2 inline-block px-3 py-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-md text-xs text-gold cursor-pointer">
                选择图片
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
          )}
        </div>
      </div>
      {/* 句子输入 */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-500">摘抄句子</label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-gold hover:text-gold-hover"
            onClick={handleFillSample}
          >
            填充示例
          </Button>
        </div>
        <textarea
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gold min-h-[100px] resize-none"
          placeholder="写下让你停下来的那句话"
          value={data.quote}
          onChange={(e) => onDataChange({ quote: e.target.value })}
        />
      </div>

      {/* 书名输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">书名</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="书名"
          value={data.bookTitle}
          onChange={(e) => onDataChange({ bookTitle: e.target.value })}
        />
      </div>

      {/* 作者输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">作者</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="作者（选填）"
          value={data.author || ''}
          onChange={(e) => onDataChange({ author: e.target.value })}
        />
      </div>

      {/* 风格选择器 */}
      <div className="mb-4 flex-shrink-0">
        <StylePicker
          selectedStyle={data.styleId}
          onStyleChange={onStyleChange || ((styleId) => onDataChange({ styleId }))}
        />
      </div>

      {/* 正文字体选择器 */}
      <div className="mb-4 flex-shrink-0">
        <FontPicker
          type="body"
          selectedFont={data.fontFamily || '"PingFang SC", "Microsoft YaHei", sans-serif'}
          onFontChange={(fontFamily) => onFontChange?.('body', fontFamily)}
        />
      </div>

      {/* 手写字体选择器 */}
      <div className="mb-4 flex-shrink-0">
        <FontPicker
          type="handwriting"
          selectedFont={data.handwritingFont || '"ZCOOL QingKe HuangYou", "Caveat", cursive'}
          onFontChange={(fontFamily) => onFontChange?.('handwriting', fontFamily)}
        />
      </div>

      {/* 保存按钮 */}
      <div className="mt-auto flex-shrink-0">
        <Button
          className="w-full bg-gold hover:bg-gold-hover text-black font-semibold"
          onClick={onSave}
        >
          保存卡片
        </Button>
      </div>
    </div>
  );
}
