#!/usr/bin/env node
/**
 * 字句图标生成脚本
 *
 * 从 SVG 生成 Tauri 所需的各种尺寸 PNG 图标
 *
 * 使用方法：
 * node scripts/generate-icons.js
 *
 * 依赖：npm install -g sharp
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 图标尺寸配置
const ICON_SIZES = [
  { size: 512, name: 'icon.png' },           // 大图标/应用商店
  { size: 256, name: '256x256.png' },
  { size: 128, name: '128x128.png' },
  { size: 64, name: '64x64.png' },
  { size: 48, name: '48x48.png' },
  { size: 32, name: '32x32.png' },
  { size: 16, name: '16x16.png' },
];

// macOS .icns 需要的尺寸
const MACOS_SIZES = [
  { size: 1024, name: 'icon_1024x1024.png' },
  { size: 512, name: 'icon_512x512.png' },
  { size: 256, name: 'icon_256x256.png' },
  { size: 128, name: 'icon_128x128.png' },
  { size: 64, name: 'icon_64x64.png' },
  { size: 32, name: 'icon_32x32.png' },
  { size: 16, name: 'icon_16x16.png' },
];

async function generateIcon(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ 生成 ${size}x${size}: ${outputPath}`);
  } catch (error) {
    console.error(`✗ 生成 ${size}x${size} 失败：${error.message}`);
  }
}

async function main() {
  const svgPath = join(rootDir, 'public', 'icon.svg');
  const iconsDir = join(rootDir, 'src-tauri', 'icons');

  // 检查 SVG 文件是否存在
  try {
    await fs.access(svgPath);
  } catch {
    console.error('错误：找不到 public/icon.svg 文件');
    return;
  }

  // 创建 icons 目录
  await fs.mkdir(iconsDir, { recursive: true });

  console.log('开始生成图标...\n');

  // 生成标准尺寸
  console.log('=== 标准图标 ===');
  for (const { size, name } of ICON_SIZES) {
    const outputPath = join(iconsDir, name);
    await generateIcon(svgPath, outputPath, size);
  }

  // 生成 macOS 尺寸
  console.log('\n=== macOS 图标 ===');
  const macosDir = join(iconsDir, 'macos');
  await fs.mkdir(macosDir, { recursive: true });

  for (const { size, name } of MACOS_SIZES) {
    const outputPath = join(macosDir, name);
    await generateIcon(svgPath, outputPath, size);
  }

  // 生成 macOS iconset 目录结构（用于生成 .icns）
  const iconsetDir = join(macosDir, 'icon.iconset');
  await fs.mkdir(iconsetDir, { recursive: true });

  const iconsetFiles = [
    { src: 'icon_16x16.png', size: 16 },
    { src: 'icon_16x16.png', size: 16, scale: '@2x' },
    { src: 'icon_32x32.png', size: 32 },
    { src: 'icon_32x32.png', size: 32, scale: '@2x' },
    { src: 'icon_128x128.png', size: 128 },
    { src: 'icon_128x128.png', size: 128, scale: '@2x' },
    { src: 'icon_256x256.png', size: 256 },
    { src: 'icon_256x256.png', size: 256, scale: '@2x' },
    { src: 'icon_512x512.png', size: 512 },
    { src: 'icon_512x512.png', size: 512, scale: '@2x' },
  ];

  for (const { src, size, scale } of iconsetFiles) {
    const destName = scale ? `icon_${size}x${size}${scale}.png` : `icon_${size}x${size}.png`;
    const srcPath = join(macosDir, src);
    const destPath = join(iconsetDir, destName);
    await fs.copyFile(srcPath, destPath);
  }

  console.log('\n✓ 图标生成完成!');
  console.log('\n=== 生成 .icns 文件 (仅限 macOS) ===');
  console.log('在 macOS 上运行以下命令生成 .icns 文件:');
  console.log(`  iconutil -c icns ${iconsetDir} -o ${join(rootDir, 'src-tauri', 'icons', 'icon.icns')}`);
}

main().catch(console.error);
