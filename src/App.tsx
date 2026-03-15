/**
 * 字句应用主入口
 *
 * 书摘卡片生成应用的主界面。
 * 左侧为输入面板和风格选择器，右侧为预览面板。
 * 使用可调节宽度的分栏布局。
 *
 * @package src
 */

import { useState } from 'react';
import { Resizable } from 're-resizable';
import { InputPanel } from './components/InputPanel';
import { StylePicker } from './components/StylePicker';
import { PreviewPanel } from './components/PreviewPanel';
import { CardData } from './types';

/**
 * 应用根组件
 *
 * 管理全局状态（cardData），协调左右两栏的交互：
 * - 左栏：输入面板（书摘、书名、作者）+ 风格选择器
 * - 右栏：预览面板（实时预览、保存、复制）
 *
 * 布局特点：
 * - 左栏可拖动调节宽度（300px - 600px）
 * - 右栏自动填充剩余空间
 * - 深色主题配色
 */
function App() {
  // 卡片数据状态
  const [cardData, setCardData] = useState<CardData>({
    quote: '',
    bookTitle: '',
    author: '',
    styleId: 'dark-gold',
  });

  /**
   * 更新卡片数据
   * @param data - 部分更新数据
   */
  const handleDataChange = (data: Partial<CardData>) => {
    setCardData(prev => ({ ...prev, ...data }));
  };

  /** 保存卡片回调（目前为空，由 PreviewPanel 直接处理下载） */
  const handleSave = () => {
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0f0f0f]">
      {/* 左栏 - 可调节宽度 */}
      <Resizable
        defaultSize={{ width: '42%', height: '100%' }}
        minWidth={300}
        maxWidth={600}
        handleClasses={{
          right: 'w-1 bg-[#2a2a2a] hover:bg-gold transition-colors cursor-col-resize'
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 overflow-hidden">
            <InputPanel
              data={cardData}
              onDataChange={handleDataChange}
              onSave={handleSave}
            />
          </div>
          <div className="px-4 pb-4 border-t border-[#2a2a2a] bg-[#141414] flex-shrink-0">
            <StylePicker
              selectedStyle={cardData.styleId}
              onStyleChange={(styleId) => handleDataChange({ styleId })}
            />
          </div>
        </div>
      </Resizable>

      {/* 右栏 - 预览区 */}
      <div className="flex-1">
        <PreviewPanel data={cardData} onDataChange={handleDataChange} />
      </div>
    </div>
  );
}

export default App;
