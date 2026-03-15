/**
 * 工具函数库
 *
 * 提供通用的辅助函数。
 *
 * @package src/lib
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 *
 * 结合 clsx 和 tailwind-merge，智能合并 Tailwind 类名。
 * 当多个类名冲突时（如 `px-4` 和 `px-6`），自动去重保留最后一个。
 *
 * @param inputs - 类名列表（可以是字符串、对象、数组等）
 * @returns 合并后的类名字符串
 *
 * @example
 * ```tsx
 * <div className={cn('px-4', 'px-6', condition && 'text-red-500')}>
 *   内容
 * </div>
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
