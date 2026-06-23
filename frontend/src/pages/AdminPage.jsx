import React, { useState, useEffect } from 'react';
import { Users, BarChart2, Bell, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Plus, X, LogOut } from 'lucide-react';

const TABS = [
  { key: 'stats', label: '통계', icon: <BarChart2 size={16} /> },
  { key: 'users', label: '유저 관리', icon: <Users size={16} /> },
  { key: 'notices', label: '공지 관리', icon: <Bell size={16} /> },
];

// ── 통계 탭 ──────────────────────────────────────────────
const StatsTab = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats', { credentials: 'include' })
      .then(r => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-10 text-center text-gray-400 font-bold">불러오는 중...</div>;

  const totalUsers = stats.totalUsers?.[0]?.count ?? 0;
  const totalPantry = stats.totalPantry?.[0]?.count ?? 0;
  const expiringItems = stats.expiringItems?.[0]?.count ?? 0;
  const byProvider = stats.byProvider ?? [];
  const recentUsers = stats.recentUsers ?? [];

  return (
    <div className="space-y-5">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '전체 유저', value: totalUsers, color: 'bg-blue-50 text-blue-600' },
          { label: '전체 식재료', value: totalPantry, color: 'bg-green-50 text-green-600' },
          { label: '유통기한 임박', value: expiringItems, color: 'bg-red-50 text-red-600' },
        ].map(c => (
          <div key={c.label} className={`${c.color} rounded-[20px] p-4 text-center`}>
            <p className="text-2xl font-black">{c.value}</p>
            <p className="text-xs font-bold mt-1 opacity-70">{c.label}</p>
          </div>
        ))}
      </div>

      {/* 소셜 로그인 비율 */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-5">
        <p className="font-black text-gray-800 mb-4">소셜 로그인 비율</p>
        {byProvider.map(p => {
          const pct = totalUsers > 0 ? Math.round((p.count / totalUsers) * 100) : 0;
          const color = p.provider === 'kakao' ? 'bg-yellow-400' : p.provider === 'google' ? 'bg-blue-500' : 'bg-gray-400';
          return (
            <div key={p.provider} className="mb-3">
              <div className="flex justify-between text-sm font-bold text-gray-600 mb-1">
                <span>{p.provider}</span>
                <span>{p.count}명 ({pct}%)</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 최근 7일 가입자 */}
      <div className="bg-white rounded-[24px] border border-gray-100 p-5">
        <p className="font-black text-gray-800 mb-4">최근 7일 신규 가입</p>
        {recentUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map(r => (
              <div key={r.date} className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">{r.date}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${Math.max(r.count * 12, 8)}px` }} />
                  <span className="font-black text-gray-800 w-6 text-right">{r.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ── 유저 관리 탭 ──────────────────────────────────────────
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [pantryMap, setPantryMap] = useState({});

  const fetchUsers = () => {
    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleExpand = async (userId) => {
    if (expandedId === userId) { setExpandedId(null); return; }
    setExpandedId(userId);
    if (!pantryMap[userId]) {
      const data = await fetch(`/api/admin/users/${userId}/pantry`, { credentials: 'include' }).then(r => r.json());
      setPantryMap(prev => ({ ...prev, [userId]: data }));
    }
  };

  const handleForceDelete = async (userId, userName) => {
    if (!window.confirm(`${userName}님을 강제 탈퇴시킬까요?\n모든 데이터가 삭제됩니다.`)) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (data.success) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (expandedId === userId) setExpandedId(null);
    } else {
      alert('삭제에 실패했습니다.');
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold">불러오는 중...</div>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-bold ml-1">전체 {users.length}명</p>
      {users.map(u => (
        <div key={u.id} className="bg-white rounded-[20px] border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <button className="flex-1 text-left" onClick={() => toggleExpand(u.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-black text-gray-600">
                  {u.provider === 'kakao' ? '🟡' : u.provider === 'google' ? '🔵' : '⚪'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm">{u.name || '(이름없음)'}</p>
                  <p className="text-xs text-gray-400">{u.provider} · 식재료 {u.pantry_count}개</p>
                </div>
              </div>
            </button>
            <div className="flex items-center gap-2">
              <button onClick={() => handleForceDelete(u.id, u.name)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 size={16} />
              </button>
              {expandedId === u.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>
          </div>

          {expandedId === u.id && (
            <div className="border-t border-gray-50 bg-gray-50 px-4 py-3">
              {!pantryMap[u.id] ? (
                <p className="text-xs text-gray-400">불러오는 중...</p>
              ) : pantryMap[u.id].length === 0 ? (
                <p className="text-xs text-gray-400">등록된 식재료가 없습니다.</p>
              ) : (
                <div className="space-y-1.5">
                  {pantryMap[u.id].map(item => (
                    <div key={item.id} className="flex justify-between text-xs font-medium text-gray-600">
                      <span>{item.item_emoji} {item.item_name}</span>
                      <span className="text-gray-400">{item.expiry_date?.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── 공지 관리 탭 ──────────────────────────────────────────
const NoticesTab = () => {
  const [notices, setNotices] = useState([]);
  const [newMsg, setNewMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchNotices = () => {
    fetch('/api/admin/notices', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setNotices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleAdd = async () => {
    if (!newMsg.trim()) return;
    const res = await fetch('/api/admin/notices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message: newMsg.trim() }),
    });
    const data = await res.json();
    if (data.success) { setNewMsg(''); fetchNotices(); }
  };

  const handleToggle = async (id, current) => {
    await fetch(`/api/admin/notices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ is_active: current === 1 ? 0 : 1 }),
    });
    fetchNotices();
  };

  if (loading) return <div className="p-10 text-center text-gray-400 font-bold">불러오는 중...</div>;

  return (
    <div className="space-y-4">
      {/* 공지 등록 */}
      <div className="bg-white rounded-[20px] border border-gray-100 p-4 space-y-3">
        <p className="font-black text-gray-800 text-sm">새 공지 등록</p>
        <textarea
          value={newMsg}
          onChange={e => setNewMsg(e.target.value)}
          placeholder="공지 내용을 입력하세요"
          rows={3}
          className="w-full p-3 bg-gray-50 rounded-xl text-sm font-medium outline-none resize-none text-gray-800"
        />
        <button
          onClick={handleAdd}
          disabled={!newMsg.trim()}
          className="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-sm disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> 공지 등록
        </button>
      </div>

      {/* 공지 목록 */}
      {notices.length === 0 ? (
        <p className="text-center text-gray-400 text-sm font-bold py-6">등록된 공지가 없습니다.</p>
      ) : (
        notices.map(n => (
          <div key={n.id} className={`bg-white rounded-[20px] border p-4 ${n.is_active ? 'border-blue-100' : 'border-gray-100'}`}>
            <div className="flex justify-between items-start gap-3">
              <p className={`text-sm font-medium flex-1 ${n.is_active ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                {n.message}
              </p>
              <button onClick={() => handleToggle(n.id, n.is_active)} className="shrink-0 mt-0.5">
                {n.is_active
                  ? <ToggleRight size={28} className="text-blue-500" />
                  : <ToggleLeft size={28} className="text-gray-300" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">{n.created_at?.split('T')[0]} · {n.is_active ? '활성' : '비활성'}</p>
          </div>
        ))
      )}
    </div>
  );
};

// ── 메인 AdminPage ────────────────────────────────────────
const AdminPage = () => {
  const [tab, setTab] = useState('stats');

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white px-6 pt-8 pb-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-900">관리자 대시보드</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">SmartPantry 운영 현황</p>
        </div>
        <button
          onClick={() => { window.location.href = '/logout'; }}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-50 text-red-500 font-bold text-sm active:scale-95 transition-all"
        >
          <LogOut size={16} /> 로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="bg-white px-4 pb-3 flex gap-2 border-b border-gray-100">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              tab === t.key ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-100'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {tab === 'stats' && <StatsTab />}
        {tab === 'users' && <UsersTab />}
        {tab === 'notices' && <NoticesTab />}
      </div>
    </div>
  );
};

export default AdminPage;
