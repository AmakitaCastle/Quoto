/**
 * 封面背景决策层
 *
 * 根据分析数据动态计算渲染参数
 */

import { CoverMode, MaskStops, BrightSpot } from '@/types';

/**
 * 获取封面适配模式
 */
export function getMode(avgLum: number, textureScore: number): CoverMode {
  if (avgLum > 0.65) return 'too-bright';
  if (textureScore < 0.08) return 'too-plain';
  return 'normal';
}

/**
 * 计算模糊半径
 */
export function getBlurRadius(textureScore: number): number {
  return Math.round(16 + (1 - textureScore) * 16);
}

/**
 * 计算纹理透明度（方案 A：提高透明度让图片更明显）
 * 原：0.35 + (1 - textureScore) * 0.25  →  0.50 + (1 - textureScore) * 0.30
 */
export function getTexAlpha(textureScore: number): number {
  return 0.50 + (1 - textureScore) * 0.30;
}

/**
 * 获取蒙版三段停止点（方案 A：减轻蒙版重量）
 * 原 normal: {top: 0.72, middle: 0.58, bottom: 0.45}
 * 新 normal: {top: 0.55, middle: 0.42, bottom: 0.30}
 */
export function getMaskStops(mode: CoverMode): MaskStops {
  switch (mode) {
    case 'too-bright':
      return { top: 0.70, middle: 0.55, bottom: 0.42 };
    case 'too-plain':
      return { top: 0.52, middle: 0.40, bottom: 0.28 };
    default:
      return { top: 0.55, middle: 0.42, bottom: 0.30 };
  }
}

/**
 * 获取光晕源（最多 3 个）
 */
export function getGlowSources(brightSpots: BrightSpot[]): BrightSpot[] {
  if (brightSpots.length > 0) {
    return brightSpots.slice(0, 3);
  }
  return [{ x: 0.82, y: 0.10, v: 0.7 }];
}
