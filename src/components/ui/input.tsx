/**
 * Input 输入框组件
 *
 * 基于 shadcn/ui 的 Input 组件。
 * 提供统一的样式和可访问性支持。
 *
 * @package src/components/ui
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input 组件的 props 类型
 * 继承原生 input 元素的所有属性
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
