/**
 * 字体选择器组件
 *
 * 提供正文字体和手写字体两种选择器，支持预设字体和系统字体。
 *
 * @package src/components
 */

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import fontsData from '@/data/fonts.json';

/** 系统字体信息 */
interface SystemFont {
  name: string;
  family: string;
  is_system: boolean;
}

/** FontPicker 组件的属性 */
interface FontPickerProps {
  /** 字体类型 */
  type: 'body' | 'handwriting';

  /** 当前选中的字体 family */
  selectedFont: string;

  /** 字体变化回调 */
  onFontChange: (fontFamily: string) => void;
}

/**
 * 字体选择器组件
 */
export function FontPicker({ type, selectedFont, onFontChange }: FontPickerProps) {
  // 每批显示数量
  const BATCH_SIZE = 20;

  // 初始显示数量
  const INITIAL_DISPLAY_COUNT = 20;

  const [isExpanded, setIsExpanded] = useState(false);
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);
  const [loadingSystemFonts, setLoadingSystemFonts] = useState(false);
  const [systemFontDisplayCount, setSystemFontDisplayCount] = useState(0);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);    // 触发按钮引用
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null); // 下拉框位置

  // 根据类型获取字体列表
  const fontList = type === 'body' ? fontsData.bodyFonts : fontsData.handwritingFonts;

  // 获取当前选中的字体名称
  const selectedFontConfig = fontList.find((f) => f.family === selectedFont);
  const selectedFontName = selectedFontConfig?.name || '自定义';

  const label = type === 'body' ? '正文字体' : '书名/作者字体';

  // 加载系统字体（一次性获取全部，分批显示）
  const handleLoadSystemFonts = async () => {
    if (loadingSystemFonts) return; // 防止重复点击

    setLoadingSystemFonts(true);
    try {
      const fonts = await invoke<SystemFont[]>('get_system_fonts');
      // 按字母顺序排序
      const sortedFonts = fonts.sort((a, b) =>
        a.name.localeCompare(b.name, 'zh-Hans-CN')
      );
      setSystemFonts(sortedFonts);
      setSystemFontDisplayCount(INITIAL_DISPLAY_COUNT);
    } catch (err) {
      console.error('Failed to load system fonts:', err);
      // 加载失败时重置状态，允许用户重试
      setSystemFontDisplayCount(0);
    } finally {
      setLoadingSystemFonts(false);
    }
  };

  // 加载更多（用于系统字体分批显示）
  const handleLoadMoreSystemFonts = () => {
    setSystemFontDisplayCount(prev =>
      Math.min(prev + BATCH_SIZE, systemFonts.length)
    );
  };

  // 滚动监听 - 自动加载更多
  // 使用 loadingSystemFonts 作为天然防抖标志位
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (loadingSystemFonts) return; // 加载中不触发

    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // 距离底部 50px 时触发加载
    if (scrollHeight - scrollTop - clientHeight < 50 &&
        systemFontDisplayCount < systemFonts.length) {
      handleLoadMoreSystemFonts();
    }
  };

  // 计算下拉框位置
  useEffect(() => {
    if (isExpanded && triggerButtonRef.current) {
      const rect = triggerButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isExpanded]);

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>

      <div className="relative">
        <button
          ref={triggerButtonRef}
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 text-left flex justify-between items-center"
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ fontFamily: selectedFont }}
        >
          <span>{selectedFontName}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isExpanded && dropdownPosition && (
          <div
            className="fixed z-[100] w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg max-h-64 overflow-y-auto font-picker-dropdown"
            style={{
              top: dropdownPosition.top,
              left: dropdownPosition.left,
              width: triggerButtonRef.current?.offsetWidth || '100%',
            }}
            onScroll={handleScroll}
          >
            {fontList.map((font) => (
              <button
                key={font.id}
                className={`w-full px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] ${
                  selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
                }`}
                style={{ fontFamily: font.family }}
                onClick={() => {
                  onFontChange(font.family);
                  setIsExpanded(false);
                }}
              >
                <div className="font-medium">{font.name}</div>
                <div className="text-xs text-gray-500 truncate">{font.preview}</div>
              </button>
            ))}

            {/* 条件渲染：更多系统字体按钮 / 加载中 / 系统字体列表 */}
            {systemFonts.length === 0 && !loadingSystemFonts && (
              <div className="border-t border-[#2a2a2a] mt-1 pt-1">
                <button
                  className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
                  onClick={handleLoadSystemFonts}
                >
                  更多系统字体...
                </button>
              </div>
            )}

            {loadingSystemFonts && (
              <div className="border-t border-[#2a2a2a] mt-1 pt-1">
                <button
                  className="w-full px-3 py-2 text-xs text-gray-400 text-left cursor-not-allowed"
                  disabled
                >
                  正在加载...
                </button>
              </div>
            )}

            {/* 系统字体列表 - 内联显示 */}
            {systemFonts.length > 0 && (
              <>
                {systemFonts.slice(0, systemFontDisplayCount).map((font, index) => (
                  <button
                    key={`${font.family}-${index}`}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] ${
                      selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
                    }`}
                    style={{ fontFamily: font.family }}
                    onClick={() => {
                      onFontChange(font.family);
                      setIsExpanded(false);
                    }}
                  >
                    {font.name}
                  </button>
                ))}

                {/* 加载更多提示 - 当还有更多字体时显示 */}
                {systemFontDisplayCount < systemFonts.length && (
                  <div className="px-3 py-2 text-xs text-gray-500 text-center">
                    滚动加载更多...
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
