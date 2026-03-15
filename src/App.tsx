import { useState } from 'react';
import { Resizable } from 're-resizable';
import { InputPanel } from './components/InputPanel';
import { StylePicker } from './components/StylePicker';
import { PreviewPanel } from './components/PreviewPanel';
import { CardData } from './types';

function App() {
  const [cardData, setCardData] = useState<CardData>({
    quote: '',
    bookTitle: '',
    author: '',
    styleId: 'dark-gold',
  });

  const handleDataChange = (data: Partial<CardData>) => {
    setCardData(prev => ({ ...prev, ...data }));
  };

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
