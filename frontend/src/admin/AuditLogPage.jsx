import React, { useState, useEffect } from 'react';
import { RefreshCw, Shield } from 'lucide-react';

const ACTION_COLOR = {
  VIEW_STATS:     'bg-gray-50 text-gray-500',
  VIEW_SCAN_LOGS: 'bg-blue-50 text-blue-600',
  DELETE_USER:    'bg-red-50 text-red-600',
  VIEW_USERS:     'bg-gray-50 text-gray-500',
};

const AuditLogPage = () => {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('전체');

  const load = () => {
    setLoading(true);
    fetch('/api/admin/audit-logs', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { setLogs(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(load, []);

  const actions = ['전체', ...new Set(logs.map(l => l.action))];
  const filtered = filter === '전체' ? logs : logs.filter(l => l.action === filter);

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Shield size={15} className="text-slate-400" />
          <span className="text-base font-black text-slate-800">감사 로그</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-medium">{logs.length}건</span>
          <button onClick={load} disabled={loading}
            className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl disabled:opacity-40">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex gap-1 px-4 py-2 border-b border-gray-50 shrink-0 overflow-x-auto">
        {actions.slice(0, 8).map(a => (
          <button key={a} onClick={() => setFilter(a)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              filter === a ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-50'
            }`}>{a}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={18} className="text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-16 text-xs text-gray-300">로그가 없습니다</p>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-gray-50 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 w-36">시각</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 w-20">액터</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 w-36">액션</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400">대상</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400">상세</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-gray-400 w-28">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                    {log.created_at?.replace('T', ' ').slice(0, 16)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-gray-600">{log.actor}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ACTION_COLOR[log.action] || 'bg-gray-50 text-gray-500'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.target || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{log.detail || '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{log.ip || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AuditLogPage;
