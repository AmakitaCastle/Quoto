/**
 * 风格选择器组件
 *
 * 提供十种内置风格的切换按钮。
 * 每个按钮显示对应风格的背景渐变和文字颜色预览。
 *
 * @package src/components
 */

import { CardStyleId } from '@/types';
import { STYLES } from './StylePicker.data';

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
 * 渲染一排风格切换按钮，用户可以点击切换 10 种风格：
 *
 * 经典四色：暗金、羊皮纸、墨绿、纯黑
 * 中式气质：水墨、宣纸、夜墨
 * 季节感：深秋、初雪、春日
 *
 * 每个按钮使用对应风格的背景渐变和文字颜色，
 * 选中的按钮有金色边框高亮。
 *
 * @param props - 组件属性
 */
export function StylePicker({ selectedStyle, onStyleChange }: StylePickerProps) {
  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">风格</label>
      <div className="flex gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              selectedStyle === style.id
                ? 'border-gold text-gold'
                : 'border-[#2a2a2a] text-gray-400 hover:border-gray-500'
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
