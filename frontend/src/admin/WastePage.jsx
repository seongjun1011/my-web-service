import React, { useState, useEffect } from 'react';
import { RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';

const CATEGORY_COLOR = {
  냉장: 'bg-blue-400',
  냉동: 'bg-purple-400',
  실온: 'bg-orange-400',
};

const WastePage = () => {
  const [data, setData]       = useState(null);
  const [list, setList]       = useState(null);
  const [listTab, setListTab] = useState('used');
  const [loading, setLoading] = useState(true);

  const fetchStats = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/waste-stats', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/waste-list',  { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([stats, listData]) => { setData(stats); setList(listData); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  const maxWasted = data?.topWasted?.[0]?.count ?? 1;
  const totalCat  = data?.categoryStats?.reduce((s, r) => s + Number(r.count), 0) ?? 0;
  const totalDecided = (data?.used ?? 0) + (data?.expired ?? 0);

  return (
    <div className="flex flex-col h-full">
      {/* 상단 바 */}
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <span className="text-base font-black text-slate-800">낭비 통계</span>
        <button onClick={fetchStats} disabled={loading}
          className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800">식재료 낭비 통계</h2>
          <p className="text-xs text-slate-400 mt-0.5">사용 완료 vs 폐기된 식재료 현황</p>
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
      ) : !data || totalDecided === 0 ? (
        <div className="flex items-center justify-center py-20 text-sm text-gray-400">아직 사용/폐기된 식재료 데이터가 없습니다.</div>
      ) : (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-500" /> 사용 완료
              </p>
              <p className="text-3xl font-black text-gray-900">{data.used.toLocaleString()}<span className="text-base text-gray-400 ml-1">개</span></p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 mb-1 flex items-center gap-1.5">
                <Trash2 size={13} className="text-red-500" /> 폐기됨
              </p>
              <p className="text-3xl font-black text-gray-900">{data.expired.toLocaleString()}<span className="text-base text-gray-400 ml-1">개</span></p>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-bold text-gray-400 mb-1">폐기율</p>
              <p className="text-3xl font-black text-red-500">{data.wasteRate}<span className="text-base text-gray-400 ml-1">%</span></p>
            </div>
          </div>

          {/* 사용 vs 폐기 비율 바 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="text-xs font-black text-gray-400 mb-4">사용 / 폐기 비율</p>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-400" style={{ width: `${100 - data.wasteRate}%` }} />
              <div className="h-full bg-red-400" style={{ width: `${data.wasteRate}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-[11px] font-bold text-gray-400">
              <span>사용 {(100 - data.wasteRate).toFixed(1)}%</span>
              <span>폐기 {data.wasteRate}%</span>
            </div>
          </div>

          {data.topWasted.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 mb-4">많이 버려진 식재료 TOP {data.topWasted.length}</p>
              <div className="space-y-3">
                {data.topWasted.map((item, i) => (
                  <div key={item.item_name} className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-300 w-5 text-right shrink-0">{i + 1}</span>
                    <span className="text-lg w-6 text-center shrink-0">{item.item_emoji || '📦'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-bold text-gray-800 truncate">{item.item_name}</span>
                        <span className="text-xs font-black text-gray-400 shrink-0 ml-2">{Number(item.count).toLocaleString()}개</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-400 rounded-full"
                          style={{ width: `${(Number(item.count) / Number(maxWasted)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.categoryStats.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 mb-4">폐기된 식재료 - 보관 방법별</p>
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
          )}

          {/* 사용 완료 / 폐기 식재료 목록 */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-black text-gray-400">식재료별 처리 내역 (최근 50건)</p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setListTab('used')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
                    listTab === 'used' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <CheckCircle2 size={12} /> 사용 완료
                </button>
                <button
                  onClick={() => setListTab('expired')}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1 ${
                    listTab === 'expired' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <Trash2 size={12} /> 폐기
                </button>
              </div>
            </div>

            {(() => {
              const items = listTab === 'used' ? list?.usedItems : list?.expiredItems;
              if (!items || items.length === 0) {
                return <div className="text-center py-10 text-xs text-gray-400 font-bold">내역이 없습니다.</div>;
              }
              return (
                <div className="space-y-1.5 max-h-96 overflow-y-auto">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50">
                      <span className="text-lg w-6 text-center shrink-0">{item.item_emoji || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{item.item_name}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{item.user_name} · 소비기한 {item.expiry_date?.slice(0, 10)}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                        item.category === '냉동' ? 'bg-purple-50 text-purple-500 border-purple-100'
                          : item.category === '실온' ? 'bg-orange-50 text-orange-500 border-orange-100'
                          : 'bg-blue-50 text-blue-500 border-blue-100'
                      }`}>
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </>
      )}
    </div>
    </div>
  );
};

export default WastePage;
