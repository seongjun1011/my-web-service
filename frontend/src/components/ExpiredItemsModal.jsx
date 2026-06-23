import React, { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import FoodIcon from './FoodIcon';

const ExpiredItemsModal = ({ items, onDiscard, onDismiss }) => {
  const [selected, setSelected] = useState(() => new Set(items.map(i => i.id)));
  const [loading, setLoading] = useState(false);

  const toggle = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDiscard = async () => {
    if (selected.size === 0) { onDismiss(); return; }
    setLoading(true);
    await onDiscard([...selected]);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-[430px] bg-white rounded-t-[40px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-black text-gray-900">유통기한이 지났어요 🗑️</h3>
          <button onClick={onDismiss} className="p-2 rounded-full bg-gray-100 text-gray-500">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-500 font-medium mb-4">
          버릴 식재료를 선택하면 보유 목록에서 정리돼요.
        </p>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-5">
          {items.map(item => (
            <label key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer">
              <input
                type="checkbox"
                checked={selected.has(item.id)}
                onChange={() => toggle(item.id)}
                className="w-5 h-5 accent-red-500 shrink-0"
              />
              <FoodIcon name={item.item_name} emoji={item.item_emoji} size={28} className="text-2xl" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 truncate">{item.item_name}</p>
                <p className="text-xs text-red-400 font-bold">유통기한 {Math.abs(item.dDay)}일 지남</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={onDismiss}
            className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black active:scale-[0.98] transition-all">
            나중에
          </button>
          <button onClick={handleDiscard} disabled={loading}
            className="flex-1 py-4 bg-red-500 text-white rounded-2xl font-black flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all disabled:opacity-50">
            <Trash2 size={16} /> {loading ? '처리 중...' : `${selected.size}개 버리기`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpiredItemsModal;
