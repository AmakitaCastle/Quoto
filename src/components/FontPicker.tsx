/**
 * 字体选择器组件
 *
 * 提供正文字体和手写字体两种选择器，支持预设字体和系统字体。
 *
 * @package src/components
 */

import { useState } from 'react';
import fontsData from '@/data/fonts.json';

/** FontPicker 组件的属性 */
interface FontPickerProps {
  /** 字体类型 */
  type: 'body' | 'handwriting';

  /** 当前选中的字体 family */
  selectedFont: string;

  /** 字体变化回调 */
  onFontChange: (fontFamily: string) => void;
}

/**
 * 字体选择器组件
 */
export function FontPicker({ type, selectedFont, onFontChange }: FontPickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 根据类型获取字体列表
  const fontList = type === 'body' ? fontsData.bodyFonts : fontsData.handwritingFonts;

  // 获取当前选中的字体名称
  const selectedFontConfig = fontList.find((f) => f.family === selectedFont);
  const selectedFontName = selectedFontConfig?.name || '自定义';

  const label = type === 'body' ? '正文字体' : '书名/作者字体';

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>

      <div className="relative">
        <button
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 text-left flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontFamily: selectedFont }}
        >
          <span>{selectedFontName}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg max-h-64 overflow-y-auto">
            {fontList.map((font) => (
              <button
                key={font.id}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] ${
                  selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
                }`}
                style={{ fontFamily: font.family }}
                onClick={() => {
                  onFontChange(font.family);
                  setIsExpanded(false);
                }}
              >
                <div className="font-medium">{font.name}</div>
                <div className="text-xs text-gray-500 truncate">{font.preview}</div>
              </button>
            ))}

            <div className="border-t border-[#2a2a2a] mt-1 pt-1">
              <button
                className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
                onClick={() => {
                  // 后续扩展：打开系统字体选择器
                }}
              >
                更多系统字体...
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
