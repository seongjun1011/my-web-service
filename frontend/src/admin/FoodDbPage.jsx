import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

const TABS = ['전체', '냉장', '냉동', '실온'];

const storageMap = { cold: '냉장', frozen: '냉동', room: '실온' };
const typeStyle = {
  냉장: 'bg-blue-50 text-blue-500',
  냉동: 'bg-purple-50 text-purple-500',
  실온: 'bg-orange-50 text-orange-500',
};

const FoodDbPage = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/admin/ingredients', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setItems(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = items.filter(i => {
    if (activeTab === '전체') return true;
    return storageMap[i.storage_type] === activeTab;
  });

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex border-b border-gray-50 flex-shrink-0">
        {TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === t ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-300'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <p className="text-center py-16 text-xs text-gray-400">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-xs text-gray-400">등록된 식재료가 없습니다</p>
        ) : filtered.map((item, idx) => {
          const type = storageMap[item.storage_type] || '냉장';
          return (
            <div key={item.id || idx} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {item.emoji || '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                <p className="text-xs text-gray-400 font-medium">
                  <span className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md mr-1.5 ${typeStyle[type] || ''}`}>
                    {type}
                  </span>
                  {item.default_expiry_days ? `기본 ${item.default_expiry_days}일` : '기간 미설정'}
                </p>
              </div>
            </div>
          );
        })}

        <button
          onClick={() => alert('식재료 추가 (구현 예정)')}
          className="w-full flex items-center justify-center gap-2 py-4 text-sm font-bold text-gray-400 active:bg-gray-50 transition-colors"
        >
          <Plus size={16} /> 새 식재료 추가
        </button>
      </div>
    </div>
  );
};

export default FoodDbPage;
