/**
 * 风格配置数据
 *
 * 定义十种内置风格的完整配置：
 *
 * 经典四色：
 * - 暗金：深色背景 + 金色文字
 * - 羊皮纸：浅色背景 + 深棕色文字
 * - 墨绿：深绿背景 + 浅绿文字
 * - 纯黑：纯黑背景 + 银灰文字
 *
 * 中式气质：
 * - 水墨：米白背景 + 墨黑文字，宋体气质
 * - 宣纸：暖黄背景 + 朱砂红点缀，古籍装帧感
 * - 夜墨：深蓝黑背景 + 紫色文字，中式夜境
 *
 * 季节感：
 * - 深秋：焦糖棕背景 + 橙铜色文字，厚重温暖
 * - 初雪：近白背景 + 蓝灰文字，清冷克制
 * - 春日：浅绿白背景 + 草绿文字，轻盈明朗
 *
 * 所有风格使用统一的 accentColor 作为书名、作者、分隔线的颜色。
 *
 * @package src/components
 */

import { CardStyle } from '@/types';

/**
 * 十种内置风格的配置数组
 *
 * 风格顺序即为 StylePicker 选择器的展示顺序。
 */
export const STYLES: CardStyle[] = [
  // ==================== 经典四色 ====================
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
  // ==================== 中式气质 ====================
  {
    /** 水墨风格 - 米白背景配墨黑文字，水墨画气质 */
    id: 'ink-wash',
    name: '水墨',
    background: 'linear-gradient(135deg, #f7f4ef 0%, #ede9e2 100%)',
    border: '#d8d4cc',
    accentColor: '#1e1408',   // 墨黑，用于书名、引号、分隔线
    textColor: '#1e1408',
    quoteColor: 'rgba(20,15,8,0.45)',  // 引号比正文稍淡，有墨迹晕染感
  },
  {
    /** 宣纸风格 - 暖黄背景配朱砂红点缀，古籍装帧感 */
    id: 'xuan-paper',
    name: '宣纸',
    background: 'linear-gradient(135deg, #f0e8d8 0%, #e4d8c4 100%)',
    border: '#ccc0a8',
    accentColor: '#a05014',   // 朱砂红，用于书名、引号、分隔线
    textColor: '#2a1808',     // 深棕，正文
    quoteColor: '#a05014',
  },
  {
    /** 夜墨风格 - 深蓝黑背景配紫色点缀，中式夜境 */
    id: 'night-ink',
    name: '夜墨',
    background: 'linear-gradient(135deg, #0e0e14 0%, #080810 100%)',
    border: '#1e1e2a',
    accentColor: '#8c78dc',   // 紫色，用于书名、引号、分隔线
    textColor: '#c8c4e0',     // 浅紫灰，正文
    quoteColor: '#8c78dc',
  },
  // ==================== 季节感 ====================
  {
    /** 深秋风格 - 焦糖棕背景配橙铜色文字，厚重温暖 */
    id: 'deep-autumn',
    name: '深秋',
    background: 'linear-gradient(135deg, #1c1208 0%, #100a04 100%)',
    border: '#2c1e10',
    accentColor: '#c87828',   // 橙铜色，用于书名、引号、分隔线
    textColor: '#e0c89a',     // 暖米色，正文
    quoteColor: '#c87828',
  },
  {
    /** 初雪风格 - 近白背景配蓝灰文字，清冷克制 */
    id: 'first-snow',
    name: '初雪',
    background: 'linear-gradient(135deg, #f8f8fc 0%, #eeeef6 100%)',
    border: '#d8d8e8',
    accentColor: '#6478b4',   // 蓝灰，用于书名、引号、分隔线
    textColor: '#1a1e2e',     // 深蓝黑，正文
    quoteColor: 'rgba(100,120,180,0.55)',  // 引号略淡，像冬日薄光
  },
  {
    /** 春日风格 - 浅绿白背景配草绿文字，轻盈明朗 */
    id: 'spring-day',
    name: '春日',
    background: 'linear-gradient(135deg, #f4f8ee 0%, #e8f0e0 100%)',
    border: '#c8d8b8',
    accentColor: '#4a8c3c',   // 草绿，用于书名、引号、分隔线
    textColor: '#1a2414',     // 深绿黑，正文
    quoteColor: 'rgba(74,140,60,0.6)',   // 引号略淡，有透气感
  },
];