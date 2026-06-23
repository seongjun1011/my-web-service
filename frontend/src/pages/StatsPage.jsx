import React, { useState, useEffect } from 'react';
import { BarChart2, Refrigerator, Camera, Receipt, Pencil } from 'lucide-react';
import FoodIcon from '../components/FoodIcon';

const CATEGORY_STYLE = {
  냉장: { bar: 'bg-blue-400', badge: 'bg-blue-50 text-blue-500' },
  냉동: { bar: 'bg-purple-400', badge: 'bg-purple-50 text-purple-500' },
  실온: { bar: 'bg-orange-400', badge: 'bg-orange-50 text-orange-500' },
};

const SOURCE_META = {
  manual:  { label: '직접 입력', icon: <Pencil size={16} />, color: 'bg-gray-400' },
  camera:  { label: '카메라 스캔', icon: <Camera size={16} />, color: 'bg-green-400' },
  receipt: { label: '영수증 스캔', icon: <Receipt size={16} />, color: 'bg-blue-400' },
};

const StatsPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center text-sm text-gray-400 font-bold">통계 불러오는 중...</div>;
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
        <Refrigerator size={48} className="text-gray-200" />
        <p className="text-gray-400 font-bold text-sm">아직 등록한 식재료가 없어요</p>
        <p className="text-gray-300 text-xs">식재료를 등록하면 통계를 확인할 수 있습니다</p>
      </div>
    );
  }

  const maxCount = stats.topItems[0]?.count ?? 1;
  const totalSource = stats.sourceStats.reduce((s, r) => s + r.count, 0);
  const totalCategory = stats.categoryStats.reduce((s, r) => s + r.count, 0);

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide bg-gray-50">
      {/* 페이지 타이틀 */}
      <div className="px-5 pt-5 pb-1">
        <h2 className="text-[26px] font-black text-gray-900 leading-tight">식재료 통계</h2>
        <p className="text-sm text-gray-400 font-medium mt-1">지금까지 등록한 기록을 확인해요</p>
      </div>

      {/* 총계 카드 */}
      <div className="bg-white mx-5 mt-5 rounded-[28px] p-6 shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center shrink-0">
          <BarChart2 size={26} className="text-white" />
        </div>
        <div>
          <p className="text-xs font-bold text-gray-400 mb-0.5">지금까지 등록한 식재료</p>
          <p className="text-3xl font-black text-gray-900">{stats.total}<span className="text-lg text-gray-400 ml-1">회</span></p>
        </div>
      </div>

      {/* 많이 등록한 식재료 TOP */}
      <div className="mx-5 mt-4">
        <p className="text-xs font-black text-gray-400 mb-3 ml-1">많이 등록한 식재료 TOP {stats.topItems.length}</p>
        <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 space-y-4">
          {stats.topItems.map((item, i) => (
            <div key={item.item_name} className="flex items-center gap-3">
              <span className="text-xs font-black text-gray-300 w-4 text-right">{i + 1}</span>
              <FoodIcon name={item.item_name} emoji={item.item_emoji} size={24} className="text-xl w-7 text-center" />
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-bold text-gray-800">{item.item_name}</span>
                  <span className="text-xs font-black text-gray-400">{item.count}회</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-900 rounded-full transition-all duration-500"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 카테고리별 */}
      <div className="mx-5 mt-4">
        <p className="text-xs font-black text-gray-400 mb-3 ml-1">보관 방법별</p>
        <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 space-y-3">
          {stats.categoryStats.map(row => {
            const pct = Math.round((row.count / totalCategory) * 100);
            const style = CATEGORY_STYLE[row.category] ?? { bar: 'bg-gray-400', badge: 'bg-gray-100 text-gray-500' };
            return (
              <div key={row.category}>
                <div className="flex justify-between mb-1.5">
                  <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${style.badge}`}>{row.category}</span>
                  <span className="text-xs font-black text-gray-400">{row.count}개 · {pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${style.bar} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 등록 방법별 */}
      <div className="mx-5 mt-4 mb-8">
        <p className="text-xs font-black text-gray-400 mb-3 ml-1">등록 방법별</p>
        <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 space-y-3">
          {stats.sourceStats.map(row => {
            const meta = SOURCE_META[row.source] ?? { label: row.source, icon: null, color: 'bg-gray-400' };
            const pct = Math.round((row.count / totalSource) * 100);
            return (
              <div key={row.source}>
                <div className="flex justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    {meta.icon}
                    <span className="text-xs font-bold">{meta.label}</span>
                  </div>
                  <span className="text-xs font-black text-gray-400">{row.count}개 · {pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${meta.color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StatsPage;
