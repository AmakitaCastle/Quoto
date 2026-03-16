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
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSystemFonts, setShowSystemFonts] = useState(false);
  const [systemFonts, setSystemFonts] = useState<SystemFont[]>([]);
  const [loadingFonts, setLoadingFonts] = useState(false);
  const [displayCount, setDisplayCount] = useState(5);         // 当前显示数量
  const [searchQuery, setSearchQuery] = useState('');          // 搜索关键词
  const searchInputRef = useRef<HTMLInputElement>(null);       // 搜索框引用

  // 根据类型获取字体列表
  const fontList = type === 'body' ? fontsData.bodyFonts : fontsData.handwritingFonts;

  // 获取当前选中的字体名称
  const selectedFontConfig = fontList.find((f) => f.family === selectedFont);
  const selectedFontName = selectedFontConfig?.name || '自定义';

  const label = type === 'body' ? '正文字体' : '书名/作者字体';

  // 加载系统字体
  const handleLoadSystemFonts = async () => {
    setLoadingFonts(true);
    try {
      const fonts = await invoke<SystemFont[]>('get_system_fonts');
      setSystemFonts(fonts);
    } catch (err) {
      console.error('Failed to load system fonts:', err);
    } finally {
      setLoadingFonts(false);
    }
  };

  // 过滤字体（支持名称和族名搜索）
  const filteredFonts = systemFonts.filter(font =>
    font.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
    font.family.toLowerCase().includes(searchQuery.trim().toLowerCase())
  );

  // 分页显示
  const displayedFonts = filteredFonts.slice(0, displayCount);

  // 搜索时重置分页
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setDisplayCount(5); // 重置为初始数量
  };

  // 加载更多
  const handleLoadMore = () => setDisplayCount(prev => prev + 5);

  // 关闭弹窗时重置状态
  const handleCloseModal = () => {
    setShowSystemFonts(false);
    setDisplayCount(5);
    setSearchQuery('');
  };

  // ESC 键关闭弹窗
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSystemFonts) {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showSystemFonts, handleCloseModal]);

  // 打开弹窗时自动聚焦搜索框
  useEffect(() => {
    if (showSystemFonts && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSystemFonts]);

  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">{label}</label>

      <div className="relative">
        <button
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

        {isExpanded && (
          <div className="absolute z-50 w-full mt-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-md shadow-lg max-h-64 overflow-y-auto">
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

            <div className="border-t border-[#2a2a2a] mt-1 pt-1">
              <button
                className="w-full px-3 py-2 text-xs text-gray-400 text-left hover:bg-[#2a2a2a]"
                onClick={async () => {
                  await handleLoadSystemFonts();
                  setShowSystemFonts(true);
                }}
              >
                更多系统字体...
              </button>
            </div>

            {/* 系统字体选择弹窗 */}
            {showSystemFonts && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={handleCloseModal}>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                  {/* 头部 + 搜索框 */}
                  <div className="flex flex-col gap-3 p-4 border-b border-[#2a2a2a]">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-100">选择系统字体</h3>
                      <button
                        className="text-gray-400 hover:text-gray-200"
                        onClick={handleCloseModal}
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* 搜索框 */}
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="搜索字体名称或族名..."
                        className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md pl-10 pr-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-gold"
                        value={searchQuery}
                        onChange={handleSearchChange}
                      />
                    </div>
                  </div>

                  {/* 字体列表 */}
                  <div className="flex-1 overflow-y-auto p-4">
                    {loadingFonts ? (
                      <div className="text-center text-gray-400 py-8">加载中...</div>
                    ) : searchQuery && filteredFonts.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        未找到包含"{searchQuery}"的字体
                      </div>
                    ) : systemFonts.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">未找到系统字体</div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {displayedFonts.map((font, index) => (
                          <button
                            key={`${font.family}-${index}`}
                            className={`px-3 py-2 text-sm text-left hover:bg-[#2a2a2a] rounded ${
                              selectedFont === font.family ? 'bg-[#2a2a2a] text-gold' : 'text-gray-100'
                            }`}
                            style={{ fontFamily: font.family }}
                            onClick={() => {
                              onFontChange(font.family);
                              setShowSystemFonts(false);
                              setIsExpanded(false);
                            }}
                          >
                            {font.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 底部按钮 */}
                  <div className="flex gap-2 p-4 border-t border-[#2a2a2a]">
                    {/* 加载更多按钮 - 仅当还有更多字体时显示 */}
                    {displayCount < filteredFonts.length && (
                      <button
                        className="flex-1 bg-gold hover:bg-gold-hover text-black text-sm font-medium py-2 rounded"
                        onClick={handleLoadMore}
                        type="button"
                      >
                        加载更多 5 个
                      </button>
                    )}

                    {/* 取消按钮 */}
                    <button
                      className="flex-1 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-100 text-sm py-2 rounded"
                      onClick={handleCloseModal}
                      type="button"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
