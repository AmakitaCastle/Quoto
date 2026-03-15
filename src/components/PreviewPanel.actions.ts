/**
 * 预览面板辅助函数
 *
 * 提供 Canvas 图片的保存和复制功能：
 * - copyCanvasToClipboard: 复制 Canvas 到系统剪贴板
 * - downloadCanvas: 下载 Canvas 为 PNG 图片
 *
 * @package src/components
 */

/**
 * 将 Canvas 复制到系统剪贴板
 *
 * 将 Canvas 转换为 PNG 格式的 Blob，然后使用 Clipboard API
 * 写入系统剪贴板。复制成功后用户可以粘贴到其他应用中。
 *
 * @param canvas - HTML Canvas 元素
 * @returns 是否复制成功
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    // 将 Canvas 转换为 PNG Blob
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return false;

    // 使用 Clipboard API 写入剪贴板
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob })
    ]);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
}

/**
 * 下载 Canvas 为 PNG 图片
 *
 * 创建临时下载链接，将 Canvas 转换为 dataURL 后触发浏览器下载。
 * 文件名由书名和书摘前 10 个字符组成（在调用处生成）。
 *
 * @param canvas - HTML Canvas 元素
 * @param filename - 下载文件名
 */
export async function downloadCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
