/**
 * 颜色工具函数
 *
 * 所有颜色操作在 HSL 空间进行，保留色相和饱和度
 */

/**
 * 计算亮度（相对 luminance）
 */
export function lum([r, g, b]: number[]): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * RGB 转 HSL
 * @returns [h: 0-360, s: 0-100, l: 0-100]
 */
export function rgbToHsl([r, g, b]: number[]): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s * 100, l * 100];
}

/**
 * HSL 转 RGB
 * @param h 0-360
 * @param s 0-100
 * @param l 0-100
 * @returns [r, g, b] 0-255
 */
export function hslToRgb([h, s, l]: number[]): number[] {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) return [l * 255, l * 255, l * 255];

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const hue = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  return [
    hue(p, q, h + 1/3) * 255,
    hue(p, q, h) * 255,
    hue(p, q, h - 1/3) * 255
  ];
}

/**
 * RGB 转 RGBA 字符串
 */
export function toRgba([r, g, b]: number[], a: number): string {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
}

/**
 * Hex 转 RGB
 */
export function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [0, 0, 0];
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ];
}
