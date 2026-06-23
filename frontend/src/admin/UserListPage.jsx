import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, ChevronDown, ChevronUp, Trash2, ShieldCheck, X } from 'lucide-react';
import UserDetailPage from './UserDetailPage';

const BADGE = {
  kakao:  'bg-yellow-50 text-yellow-700 border-yellow-100',
  google: 'bg-blue-50 text-blue-700 border-blue-100',
};

const UserListPage = () => {
  const [users, setUsers]       = useState([]);
  const [query, setQuery]       = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [sortKey, setSortKey]   = useState('created_at');
  const [sortAsc, setSortAsc]   = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/users', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setUsers(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = users
    .filter(u => !query ||
      u.name?.includes(query) ||
      u.email?.toLowerCase().includes(query.toLowerCase()) ||
      u.provider?.includes(query)
    )
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      return sortAsc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const SortIcon = ({ k }) => sortKey === k
    ? (sortAsc ? <ChevronUp size={11} className="inline ml-0.5" /> : <ChevronDown size={11} className="inline ml-0.5" />)
    : null;

  const Th = ({ k, label, w }) => (
    <th onClick={() => handleSort(k)}
      className={`px-4 py-3 text-left text-[11px] font-bold text-gray-400 cursor-pointer hover:text-gray-600 transition-colors select-none ${w}`}>
      {label}<SortIcon k={k} />
    </th>
  );

  return (
    <div className="flex flex-col h-full">
      {/* 상단 바 */}
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <span className="text-base font-black text-slate-800">사용자 관리</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">총 {users.length}명</span>
          <button onClick={load} disabled={loading}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* 목록 */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
          {/* 검색 */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-50 shrink-0">
            <Search size={14} className="text-gray-300 shrink-0" />
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder="이름, 이메일, 소셜 검색..."
              className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder-gray-300 min-w-0" />
            {query && <button onClick={() => setQuery('')}><X size={13} className="text-gray-300" /></button>}
          </div>

          {/* 테이블 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw size={18} className="text-gray-300 animate-spin" />
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead className="sticky top-0 bg-gray-50 z-10">
                  <tr>
                    <th className="w-8 px-4 py-3" />
                    <Th k="name"       label="이름"     w="w-32" />
                    <Th k="email"      label="이메일"   w="" />
                    <Th k="provider"   label="로그인"   w="w-24" />
                    <Th k="pantry_count" label="식재료" w="w-16" />
                    <Th k="last_login_at" label="최근 로그인" w="w-28" />
                    <Th k="created_at" label="가입일"   w="w-24" />
                    <th className="w-10 px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(user => (
                    <tr key={user.id}
                      onClick={() => setSelected(selected?.id === user.id ? null : user)}
                      className={`border-b border-gray-50 cursor-pointer transition-colors text-sm
                        ${selected?.id === user.id ? 'bg-blue-50/40' : 'hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black text-gray-500">
                          {user.name?.[0] || '?'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-xs">{user.name || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 truncate max-w-[160px]">{user.email || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(user.provider || '').split(',').filter(Boolean).map(p => (
                            <span key={p} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${BADGE[p] || 'bg-gray-50 text-gray-500 border-gray-100'}`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-gray-700 text-center">{user.pantry_count || 0}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {user.last_login_at ? user.last_login_at.split('T')[0] : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{user.created_at?.split('T')[0]}</td>
                      <td className="px-4 py-3 text-center">
                        {user.is_admin === 1 && <ShieldCheck size={14} className="text-blue-400 mx-auto" />}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && !loading && (
                    <tr><td colSpan={8} className="py-16 text-center text-xs text-gray-300">해당하는 사용자가 없습니다</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 슬라이드 패널 */}
        {selected && (
          <div className="w-72 shrink-0 border-l border-gray-100 overflow-hidden">
            <UserDetailPage user={selected} onClose={() => setSelected(null)}
              onDeleted={(id) => { setUsers(u => u.filter(x => x.id !== id)); setSelected(null); }} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UserListPage;
