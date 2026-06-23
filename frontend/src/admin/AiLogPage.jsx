import React, { useState, useEffect } from 'react';

const TABS = ['전체', 'llm_generated', 'db_match'];

const AiLogPage = () => {
  const [activeTab, setActiveTab] = useState('전체');
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    fetch('/api/admin/ai-logs', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setLogs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = logs.filter(l => activeTab === '전체' || l.recommendation_type === activeTab);

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
          <p className="text-center py-16 text-xs text-gray-400">로그가 없습니다</p>
        ) : filtered.map(log => (
          <div key={log.id} className="px-5 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                {log.recommendation_type}
              </span>
              <span className="text-xs text-gray-400 font-medium ml-auto">{log.created_at?.split('T')[0]}</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">유저 ID: {log.user_id}</p>
            <p className="text-sm font-bold text-gray-900 mt-0.5 truncate">{log.input_ingredients}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AiLogPage;
