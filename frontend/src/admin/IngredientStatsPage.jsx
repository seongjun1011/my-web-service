import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const CATEGORY_COLOR = {
  냉장: 'bg-blue-400',
  냉동: 'bg-purple-400',
  실온: 'bg-orange-400',
};

const SOURCE_LABEL = {
  manual:  '직접 입력',
  camera:  '카메라 스캔',
  receipt: '영수증 스캔',
};

const SOURCE_COLOR = {
  manual:  'bg-gray-400',
  camera:  'bg-green-400',
  receipt: 'bg-blue-400',
};

const IngredientStatsPage = () => {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    fetch('/api/admin/ingredient-stats', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const maxCount = data?.topItems?.[0]?.count ?? 1;
  const totalCat = data?.categoryStats?.reduce((s, r) => s + Number(r.count), 0) ?? 0;
  const totalSrc = data?.sourceStats?.reduce((s, r) => s + Number(r.count), 0) ?? 0;

  return (
    <div className="flex flex-col h-full">
      {/* 상단 바 */}
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <span className="text-base font-black text-slate-800">식재료 통계</span>
        <button onClick={fetchStats} disabled={loading}
          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">식재료 통계</h2>
          <p className="text-xs text-slate-400 mt-0.5">전체 사용자의 식재료 등록 현황</p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> 새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">불러오는 중...</div>
      ) : !data || data.total === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">등록된 식재료 데이터가 없습니다.</div>
      ) : (
        <>
          {/* 총계 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 mb-1">전체 등록 횟수</p>
            <p className="text-3xl font-black text-gray-900">{Number(data.total).toLocaleString()}<span className="text-base text-gray-400 ml-1">회</span></p>
          </div>

          {/* TOP 20 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 mb-4">많이 등록된 식재료 TOP {data.topItems.length}</p>
            <div className="space-y-3">
              {data.topItems.map((item, i) => (
                <div key={item.item_name} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
                  <span className="text-lg w-6 text-center shrink-0">{item.item_emoji || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-bold text-gray-800 truncate">{item.item_name}</span>
                      <span className="text-xs font-black text-gray-400 shrink-0 ml-2">{Number(item.count).toLocaleString()}회</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-800 rounded-full"
                        style={{ width: `${(Number(item.count) / Number(maxCount)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 카테고리 + 등록방법 나란히 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 mb-4">보관 방법별</p>
              <div className="space-y-3">
                {data.categoryStats.map(row => {
                  const pct = totalCat > 0 ? Math.round((Number(row.count) / totalCat) * 100) : 0;
                  const barColor = CATEGORY_COLOR[row.category] ?? 'bg-gray-400';
                  return (
                    <div key={row.category}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-gray-700">{row.category}</span>
                        <span className="text-xs font-black text-gray-400">{Number(row.count).toLocaleString()} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 mb-4">등록 방법별</p>
              <div className="space-y-3">
                {data.sourceStats.map(row => {
                  const pct = totalSrc > 0 ? Math.round((Number(row.count) / totalSrc) * 100) : 0;
                  const barColor = SOURCE_COLOR[row.source] ?? 'bg-gray-400';
                  return (
                    <div key={row.source}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-gray-700">{SOURCE_LABEL[row.source] ?? row.source}</span>
                        <span className="text-xs font-black text-gray-400">{Number(row.count).toLocaleString()} · {pct}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
    </div>
  );
};

export default IngredientStatsPage;
