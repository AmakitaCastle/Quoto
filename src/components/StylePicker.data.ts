/**
 * 风格配置数据
 *
 * 从 JSON 配置文件导入风格数据。
 * 新增风格时只需编辑 `src/data/styles.json`，无需修改此文件。
 *
 * @package src/components
 */

import stylesData from '@/data/styles.json';
import { type CardStyle, type CardStyleId } from '@/types';

/**
 * 内置风格配置数组
 *
 * 风格顺序即为 StylePicker 选择器的展示顺序。
 */
export const STYLES: CardStyle[] = stylesData.styles.map((style) => ({
  ...style,
  id: style.id as CardStyleId,
}));