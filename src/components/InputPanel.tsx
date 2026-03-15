import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CardData } from '@/types';
import { SAMPLE_QUOTES } from '@/data/sampleQuotes';

interface InputPanelProps {
  data: CardData;
  onDataChange: (data: Partial<CardData>) => void;
  onSave: () => void;
}

export function InputPanel({ data, onDataChange, onSave }: InputPanelProps) {
  const handleFillSample = () => {
    const randomQuote = SAMPLE_QUOTES[Math.floor(Math.random() * SAMPLE_QUOTES.length)];
    onDataChange(randomQuote);
  };

  return (
    <div className="flex flex-col h-full bg-[#141414] border-r border-[#2a2a2a] p-4">
      {/* 句子输入 */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-500">摘抄句子</label>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-gold hover:text-gold-hover"
            onClick={handleFillSample}
          >
            填充示例
          </Button>
        </div>
        <textarea
          className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-gold min-h-[100px] resize-none"
          placeholder="写下让你停下来的那句话"
          value={data.quote}
          onChange={(e) => onDataChange({ quote: e.target.value })}
        />
      </div>

      {/* 书名输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">书名</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="书名"
          value={data.bookTitle}
          onChange={(e) => onDataChange({ bookTitle: e.target.value })}
        />
      </div>

      {/* 作者输入 */}
      <div className="mb-4 flex-shrink-0">
        <label className="text-xs text-gray-500 mb-2 block">作者</label>
        <Input
          className="bg-[#1a1a1a] border-[#2a2a2a] text-gray-100"
          placeholder="作者（选填）"
          value={data.author || ''}
          onChange={(e) => onDataChange({ author: e.target.value })}
        />
      </div>

      <div className="mt-auto flex-shrink-0">
        <Button
          className="w-full bg-gold hover:bg-gold-hover text-black font-semibold"
          onClick={onSave}
        >
          保存卡片
        </Button>
      </div>
    </div>
  );
}
