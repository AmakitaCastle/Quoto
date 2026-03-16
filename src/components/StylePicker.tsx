/**
 * 风格选择器组件
 *
 * 提供分组 Tab 分页式的风格切换功能。
 * 每个风格按钮显示对应风格的背景渐变和文字颜色预览。
 *
 * @package src/components
 */

import { useState } from 'react';
import { CardStyleId } from '@/types';
import { STYLES, STYLE_GROUPS } from './StylePicker.data';

/** 风格选择器组件的属性 */
interface StylePickerProps {
  /** 当前选中的风格 ID */
  selectedStyle: CardStyleId;

  /** 风格变化回调 */
  onStyleChange: (styleId: CardStyleId) => void;
}

/**
 * 风格选择器组件
 *
 * 使用 Tab 分页式展示风格分组，用户可以点击 Tab 切换分组，
 * 然后点击风格按钮进行选择。
 *
 * 分组结构：
 * - 经典四色：暗金、羊皮纸、墨绿、纯黑
 * - 中式气质：水墨、宣纸、夜墨
 * - 季节感：深秋、初雪、春日
 *
 * 默认激活"经典四色"分组。
 * 选中的风格按钮使用暖白色 (#e8e0d0) 边框高亮。
 * 激活的 Tab 使用暖白色文字和下划线高亮。
 *
 * @param props - 组件属性
 */
export function StylePicker({ selectedStyle, onStyleChange }: StylePickerProps) {
  const [activeTab, setActiveTab] = useState<string>('classic');

  const currentGroup = STYLE_GROUPS.find((g) => g.id === activeTab);
  const currentStyles = currentGroup?.styles
    .map((id) => STYLES.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">风格</label>

      {/* Tab 导航 */}
      <div className="flex border-b border-gray-700 mb-3">
        {STYLE_GROUPS.map((group) => (
          <button
            key={group.id}
            className={`px-3 py-1.5 text-xs transition-colors ${
              activeTab === group.id
                ? 'text-[#e8e0d0] border-b-2 border-[#e8e0d0]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(group.id)}
          >
            {group.name}
          </button>
        ))}
      </div>

      {/* 风格按钮网格 */}
      <div className="grid grid-cols-4 gap-2">
        {currentStyles?.map((style) => (
          <button
            key={style.id}
            className={`px-2 py-2 text-xs rounded border text-center transition-colors ${
              selectedStyle === style.id
                ? 'border-[#e8e0d0]'
                : 'border-[#2a2a2a] hover:border-gray-500'
            }`}
            style={{
              background: style.background,
              color: style.textColor,
            }}
            onClick={() => onStyleChange(style.id)}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
}
