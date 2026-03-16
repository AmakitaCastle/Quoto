/**
 * 风格配置数据
 *
 * 从 JSON 配置文件导入风格数据和分组配置。
 * 新增风格或分组时只需编辑 `src/data/styles.json`，无需修改此文件。
 *
 * @package src/components
 */

import stylesData from '@/data/styles.json';
import { type CardStyle, type CardStyleId, type StyleGroup } from '@/types';

/**
 * 内置风格配置数组
 *
 * 风格顺序即为 StylePicker 选择器的展示顺序。
 */
export const STYLES: CardStyle[] = stylesData.styles.map((style) => ({
  ...style,
  id: style.id as CardStyleId,
}));

/**
 * 风格分组配置数组
 *
 * 用于 Tab 分页式风格选择器，每个分组包含一组风格 ID。
 */
export const STYLE_GROUPS: StyleGroup[] = stylesData.groups.map((group) => ({
  id: group.id,
  name: group.name,
  styles: group.styles as CardStyleId[],
}));