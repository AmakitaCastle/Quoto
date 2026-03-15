/**
 * Button 按钮组件
 *
 * 基于 shadcn/ui 的 Button 组件。
 * 提供多种样式变体和尺寸选择。
 *
 * @package src/components/ui
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * 按钮变体样式
 *
 * 使用 class-variance-authority 定义多态样式：
 * - variant: 5 种样式变体（default, destructive, outline, secondary, ghost, link）
 * - size: 4 种尺寸（default, sm, lg, icon）
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button 组件的 props 类型
 *
 * 继承：
 * - React.ButtonHTMLAttributes: 原生按钮属性
 * - VariantProps<typeof buttonVariants>: 变体样式属性
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * 是否使用 asChild 模式
   * 当为 true 时，使用 Slot 组件渲染子元素，保留子元素的语义
   */
  asChild?: boolean
}

/**
 * Button 按钮组件
 *
 * 支持以下用法：
 * - 默认按钮：<Button>点击</Button>
 * - 变体样式：<Button variant="outline">边框</Button>
 * - 尺寸控制：<Button size="sm">小按钮</Button>
 * - asChild 模式：<Button asChild><a href="...">链接</a></Button>
 *
 * @param props - 组件属性
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
