/**
 * 示例书摘数据
 *
 * 提供预设的书摘示例，用户可以通过"填充示例"按钮快速填入。
 * 包含经典书籍的名言警句。
 *
 * @package src/data
 */

import { CardData } from '@/types';

/** 示例书摘数组 */
export const SAMPLE_QUOTES: Partial<CardData>[] = [
  {
    /** 《壁花少年》- 关于爱的价值 */
    quote: "我们接受我们认为自己值得拥有的爱。",
    bookTitle: "壁花少年",
    author: "Stephen Chbosky",
  },
  {
    /** 《小王子》- 关于成长 */
    quote: "所有的大人都曾经是小孩，虽然，只有少数的人记得。",
    bookTitle: "小王子",
    author: "Antoine de Saint-Exupéry",
  },
  {
    /** 《老人与海》- 关于坚韧 */
    quote: "一个人可以被毁灭，但不能被打败。",
    bookTitle: "老人与海",
    author: "Ernest Hemingway",
  },
];
