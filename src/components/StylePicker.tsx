import { CardStyleId } from '@/types';
import { STYLES } from './StylePicker.data';

interface StylePickerProps {
  selectedStyle: CardStyleId;
  onStyleChange: (styleId: CardStyleId) => void;
}

export function StylePicker({ selectedStyle, onStyleChange }: StylePickerProps) {
  return (
    <div className="mb-4">
      <label className="text-xs text-gray-500 mb-2 block">风格</label>
      <div className="flex gap-2">
        {STYLES.map((style) => (
          <button
            key={style.id}
            className={`px-3 py-1.5 text-xs rounded border transition-colors ${
              selectedStyle === style.id
                ? 'border-gold text-gold'
                : 'border-[#2a2a2a] text-gray-400 hover:border-gray-500'
            }`}
            style={{
              background: style.background,
              color: style.textColor,
            }}
            onClick={() => onStyleChange(style.id)}
          >
            {style.name}
          </button>
        ))}
      </div>
    </div>
  );
}
