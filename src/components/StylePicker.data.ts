/**
 * 风格配置数据
 *
 * 定义四种内置风格的完整配置：
 * - 暗金：深色背景 + 金色文字
 * - 羊皮纸：浅色背景 + 深棕色文字
 * - 墨绿：深绿背景 + 浅绿文字
 * - 纯黑：纯黑背景 + 银灰文字
 *
 * 所有风格使用统一的 accentColor 作为书名、作者、分隔线的颜色。
 *
 * @package src/components
 */

import { CardStyle } from '@/types';

/** 四种内置风格的配置数组 */
export const STYLES: CardStyle[] = [
  {
    /** 暗金风格 - 深色背景配金色文字 */
    id: 'dark-gold',
    name: '暗金',
    background: 'linear-gradient(135deg, #1a1510 0%, #0d0d0d 100%)',
    border: '#2a2520',
    accentColor: '#d0b87c',  // 金色
    textColor: '#d0b87c',
    quoteColor: '#d0b87c',
  },
  {
    /** 羊皮纸风格 - 复古浅色背景配深棕色文字 */
    id: 'parchment',
    name: '羊皮纸',
    background: 'linear-gradient(135deg, #f5f0e6 0%, #e8e0d0 100%)',
    border: '#d4c9b8',
    accentColor: '#2a1810',  // 深棕色
    textColor: '#0b0800',
    quoteColor: '#0b0800',
  },
  {
    /** 墨绿风格 - 深绿背景配浅绿文字 */
    id: 'ink-green',
    name: '墨绿',
    background: 'linear-gradient(135deg, #1a2f2a 0%, #0d1a16 100%)',
    border: '#2a3f3a',
    accentColor: '#81c1a1',  // 浅绿色
    textColor: '#81c1a1',
    quoteColor: '#81c1a1',
  },
  {
    /** 纯黑风格 - 纯黑背景配银灰文字 */
    id: 'pure-black',
    name: '纯黑',
    background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
    border: '#2a2a2a',
    accentColor: '#c1c1c1',  // 银灰色
    textColor: '#c1c1c1',
    quoteColor: '#c1c1c1',
  },
];
