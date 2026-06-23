import React, { useEffect, useRef, useState } from 'react';
import {
  Users, ShoppingBasket, Camera, TrendingUp,
  ArrowUpCircle, CheckCircle, UserPlus, ScanLine, RefreshCw,
} from 'lucide-react';

const PROVIDER_COLOR = { kakao: '#FAC775', google: '#85B7EB' };

// ── 색상 보간 ──────────────────────────────────────
function lerpColor(c1, c2, t) {
  return `rgb(${Math.round(c1[0] + (c2[0] - c1[0]) * t)},${Math.round(c1[1] + (c2[1] - c1[1]) * t)},${Math.round(c1[2] + (c2[2] - c1[2]) * t)})`;
}

const weekdayShort = (dateStr) =>
  new Date(dateStr).toLocaleDateString('ko-KR', { weekday: 'short' });

// ── 카운트업 훅 ──────────────────────────────────
function useCountUp(target, duration = 1200) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const frames = duration / 16;
    const inc = target / frames;
    let cur = 0;
    const timer = setInterval(() => {
      cur += inc;
      if (cur >= target) { cur = target; clearInterval(timer); }
      el.textContent = Math.round(cur).toLocaleString();
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return ref;
}

// ── 지표 카드 ─────────────────────────────────────
const StatCard = ({ stat }) => {
  const ref = useCountUp(stat.value);
  const Icon = stat.icon;
  return (
    <div className="bg-gray-50 rounded-2xl p-5">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${stat.bg}`}>
        <Icon size={20} className={stat.ic} />
      </div>
      <p ref={ref} className="text-3xl font-black text-gray-900">0</p>
      <p className="text-xs text-gray-400 font-medium mt-1.5">{stat.label}</p>
      <p className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
        <TrendingUp size={11} />
        {stat.delta}
      </p>
    </div>
  );
};

// ── 도넛 차트 (소셜 로그인) ───────────────────────
const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0);
  const R = 50, CX = 65, CY = 65;
  const C = 2 * Math.PI * R;
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || total === 0) return;
    const circles = svgRef.current.querySelectorAll('circle[data-arc]');
    let cumulative = 0;

    circles.forEach((el, i) => {
      const ratio = data[i].count / total;
      const dash = C * ratio;
      const offset = C - dash;
      const rotateDeg = -90 + 360 * cumulative;
      cumulative += ratio;

      el.setAttribute('stroke-dasharray', C);
      el.setAttribute('stroke-dashoffset', C);
      el.setAttribute('transform', `rotate(${rotateDeg} ${CX} ${CY})`);

      setTimeout(() => {
        el.style.transition = 'stroke-dashoffset 0.8s ease';
        el.setAttribute('stroke-dashoffset', offset);
      }, 200 + i * 150);
    });
  }, [data, total, C]);

  if (total === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-5">
        <p className="text-sm font-black text-gray-900 mb-4">소셜 로그인 비율</p>
        <p className="text-xs text-gray-300 text-center py-8">데이터 없음</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5">
      <p className="text-sm font-black text-gray-900 mb-4">소셜 로그인 비율</p>
      <div className="flex items-center gap-6">
        <svg ref={svgRef} width="120" height="120" viewBox="0 0 130 130" className="flex-shrink-0">
          {/* 배경 트랙 */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#F3F4F6" strokeWidth="22" />
          {/* 데이터 아크 — 속성은 useEffect에서 주입 */}
          {data.map((d) => (
            <circle
              key={d.name}
              data-arc="1"
              cx={CX} cy={CY} r={R}
              fill="none"
              stroke={d.color}
              strokeWidth="22"
              strokeLinecap="butt"
            />
          ))}
          {/* 중앙 텍스트 */}
          <text x={CX} y={CY - 5} textAnchor="middle" fontSize="20" fontWeight="700" fill="#111827">{total}</text>
          <text x={CX} y={CY + 13} textAnchor="middle" fontSize="11" fill="#9CA3AF">전체</text>
        </svg>
        <div className="flex-1 space-y-3">
          {data.map(d => (
            <div key={d.name} className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 flex-shrink-0" style={{ background: d.color, borderRadius: 2 }} />
              <span className="text-sm text-gray-500 flex-1">{d.name}</span>
              <span className="text-sm font-black text-gray-800">{d.count}명</span>
              <span className="text-xs text-gray-400 w-12 text-right">
                {Math.round(d.count / total * 1000) / 10}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── 세로 바 차트 ───────────────────────────────────
const VBarChart = ({ data, color }) => {
  const max = Math.max(...data.map(d => d.v), 1);
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const h = data[i].v ? Math.round((data[i].v / max) * 95) : 2;
      setTimeout(() => {
        el.style.transition = 'height 0.5s ease';
        el.style.height = `${h}%`;
      }, i * 70);
    });
  }, [data, max]);

  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((w, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-400">{w.v || ''}</span>
          <div
            ref={el => refs.current[i] = el}
            className="w-full"
            style={{
              height: '2%',
              borderRadius: 0,
              backgroundColor:
                i === data.length - 1
                  ? '#B4B2A9'
                  : i === data.length - 2
                  ? color
                  : color + '80',
            }}
          />
          <span className="text-[10px] text-gray-400">{w.d}</span>
        </div>
      ))}
    </div>
  );
};

// ── 가로 바 차트 (색상 그라데이션) ───────────────────
const HBarChart = ({ data, topColor, botColor }) => {
  const max = data[0]?.count || 1;
  const refs = useRef([]);

  useEffect(() => {
    refs.current.forEach((el, i) => {
      if (!el) return;
      const pct = Math.round((data[i].count / max) * 100);
      setTimeout(() => {
        el.style.transition = 'width 0.6s ease';
        el.style.width = `${pct}%`;
      }, i * 50);
    });
  }, [data, max]);

  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const color = lerpColor(topColor, botColor, data.length > 1 ? i / (data.length - 1) : 0);
        return (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4 text-right flex-shrink-0">{i + 1}</span>
            <span className="text-sm text-gray-600 w-16 flex-shrink-0 truncate">{item.name}</span>
            <div className="flex-1 h-3.5 bg-gray-100 overflow-hidden" style={{ borderRadius: 0 }}>
              <div
                ref={el => refs.current[i] = el}
                className="h-full"
                style={{ width: '0%', backgroundColor: color, borderRadius: 0 }}
              />
            </div>
            <span className="text-xs text-gray-400 w-12 text-right flex-shrink-0">
              {item.count.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ── 메인 컴포넌트 ─────────────────────────────────
const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [ingredientStats, setIngredientStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/admin/stats', { credentials: 'include' }).then(r => r.json()),
      fetch('/api/admin/ingredient-stats', { credentials: 'include' }).then(r => r.json()),
    ])
      .then(([s, ing]) => { setStats(s); setIngredientStats(ing); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  if (loading || !stats) {
    return (
      <div className="flex flex-col h-full">
        <div className="h-11 flex items-center px-6 border-b border-gray-50 flex-shrink-0">
          <span className="text-sm font-black text-gray-900">대시보드</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  const v = (key) => stats?.[key]?.[0]?.count ?? 0;
  const recentUsers = stats.recentUsers ?? [];
  const recentScans = stats.recentScans ?? [];
  const weekJoinSum = recentUsers.reduce((s, r) => s + Number(r.count), 0);

  const STATS = [
    { id: 'users', value: v('totalUsers'), label: '전체 사용자', delta: `최근 7일 +${weekJoinSum}명`, icon: Users, bg: 'bg-blue-50', ic: 'text-blue-600' },
    { id: 'ing', value: ingredientStats?.total ?? 0, label: '등록 식재료', delta: `보유중 ${v('totalPantry')}개`, icon: ShoppingBasket, bg: 'bg-green-50', ic: 'text-green-700' },
    { id: 'scan', value: v('scansToday'), label: '오늘 스캔', delta: `전체 ${v('totalScans')}회 중`, icon: Camera, bg: 'bg-orange-50', ic: 'text-orange-600' },
    { id: 'scanTotal', value: v('totalScans'), label: '전체 스캔', delta: `오늘 ${v('scansToday')}회`, icon: ScanLine, bg: 'bg-gray-100', ic: 'text-gray-500' },
  ];

  const SOCIAL = (stats.byProvider ?? []).map(p => ({
    name: p.provider, count: Number(p.count), color: PROVIDER_COLOR[p.provider] ?? '#9CA3AF',
  }));

  const WEEKLY_JOIN = recentUsers.map(r => ({ d: weekdayShort(r.date), v: Number(r.count) }));
  const DAILY_SCAN = recentScans.map(r => ({ d: weekdayShort(r.date), v: Number(r.count) }));

  const TOP_REGISTER = (ingredientStats?.topItems ?? []).slice(0, 10).map(d => ({
    name: `${d.item_emoji ?? ''} ${d.item_name}`.trim(), count: Number(d.count),
  }));
  const TOP_CONSUME = (ingredientStats?.topConsumed ?? []).map(d => ({
    name: `${d.item_emoji ?? ''} ${d.item_name}`.trim(), count: Number(d.count),
  }));

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-6 border-b border-gray-50 flex-shrink-0">
        <span className="text-sm font-black text-gray-900">대시보드</span>
        <button onClick={load} disabled={loading}
          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-40">
          <RefreshCw size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5">

          {/* 지표 카드 4개 */}
          <div className="grid grid-cols-4 gap-4">
            {STATS.map(s => <StatCard key={s.id} stat={s} />)}
          </div>

          {/* 소셜 로그인 비율 — 도넛 */}
          <DonutChart data={SOCIAL} />

          {/* 일별 스캔 수 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={15} className="text-orange-500" />
              일별 스캔 수
              <span className="ml-auto text-xs text-gray-400 font-medium">최근 7일</span>
            </p>
            {DAILY_SCAN.length === 0
              ? <p className="text-xs text-gray-300 text-center py-8">데이터 없음</p>
              : <VBarChart data={DAILY_SCAN} color="#F97316" />}
          </div>

          {/* 최근 7일 신규 가입 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus size={15} className="text-blue-500" />
              최근 7일 신규 가입
              <span className="ml-auto text-xs text-gray-400 font-medium">일별 가입자 추이</span>
            </p>
            {WEEKLY_JOIN.length === 0
              ? <p className="text-xs text-gray-300 text-center py-8">데이터 없음</p>
              : <VBarChart data={WEEKLY_JOIN} color="#378ADD" />}
          </div>

          {/* 많이 등록된 식재료 Top 10 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2">
              <ArrowUpCircle size={15} className="text-blue-500" />
              많이 등록된 식재료
              <span className="ml-auto text-xs text-gray-400 font-medium">Top 10</span>
            </p>
            {TOP_REGISTER.length === 0
              ? <p className="text-xs text-gray-300 text-center py-8">데이터 없음</p>
              : <HBarChart data={TOP_REGISTER} topColor={[150, 80, 220]} botColor={[55, 138, 221]} />}
          </div>

          {/* 많이 소비된 식재료 Top 10 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-sm font-black text-gray-900 mb-5 flex items-center gap-2">
              <CheckCircle size={15} className="text-green-600" />
              많이 소비된 식재료
              <span className="ml-auto text-xs text-gray-400 font-medium">소비 완료 기준 · Top 10</span>
            </p>
            {TOP_CONSUME.length === 0
              ? <p className="text-xs text-gray-300 text-center py-8">데이터 없음</p>
              : <HBarChart data={TOP_CONSUME} topColor={[234, 120, 30]} botColor={[99, 153, 34]} />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
