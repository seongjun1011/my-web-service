import React, { useState, useEffect } from 'react';
import { Send, ToggleRight, ToggleLeft, Trash2, Bell, BellOff, Zap } from 'lucide-react';

const NoticePage = () => {
  const [notices, setNotices] = useState([]);
  const [newMsg, setNewMsg]   = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const fetchNotices = () => {
    fetch('/api/admin/notices', { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setNotices(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchNotices(); }, []);

  const handleSend = async () => {
    if (!newMsg.trim()) { alert('내용을 입력해주세요.'); return; }
    setSending(true);
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: newMsg.trim(), sendPush }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMsg('');
        if (sendPush) alert(`공지가 등록되고 ${data.pushSent}명에게 푸시 알림이 발송됐어요.`);
        setSendPush(false);
        fetchNotices();
      }
    } finally {
      setSending(false);
    }
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

  const handleDelete = async (id) => {
    if (!window.confirm('이 공지를 삭제하시겠습니까?')) return;
    await fetch(`/api/admin/notices/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    fetchNotices();
  };

  const handleTestExpiryPush = async () => {
    if (!window.confirm('지금 유통기한 임박 알림을 모든 구독자에게 즉시 발송할까요?')) return;
    setTestingPush(true);
    try {
      const res  = await fetch('/api/admin/push-test-expiry', { method: 'POST', credentials: 'include' });
      const data = await res.json();
      alert(data.success ? `✅ 유통기한 알림 ${data.sent}건 발송 완료` : `❌ 실패: ${data.message}`);
    } finally {
      setTestingPush(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <span className="text-base font-black text-slate-800">공지 관리</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="px-5 py-5 space-y-4 border-b border-gray-50">
        {/* 유통기한 알림 테스트 */}
        <button
          onClick={handleTestExpiryPush}
          disabled={testingPush}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-orange-50 border border-orange-100 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-orange-600">
            <Zap size={15} /> 유통기한 임박 알림 즉시 발송 (테스트)
          </span>
          {testingPush && <span className="text-xs text-orange-400">발송 중...</span>}
        </button>
        <div>
          <p className="text-xs font-black text-gray-400 mb-2">공지 내용</p>
          <textarea
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder="전체 사용자에게 표시할 공지 내용을 입력하세요"
            rows={3}
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none resize-none"
          />
        </div>
        <button
          onClick={() => setSendPush(prev => !prev)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
            sendPush ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'
          }`}
        >
          <span className={`flex items-center gap-2 text-sm font-bold ${sendPush ? 'text-blue-600' : 'text-gray-500'}`}>
            {sendPush ? <Bell size={15} /> : <BellOff size={15} />}
            푸시 알림으로도 보내기
          </span>
          {sendPush ? <ToggleRight size={26} className="text-blue-500" /> : <ToggleLeft size={26} className="text-gray-300" />}
        </button>
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-full h-12 bg-gray-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Send size={16} /> {sending ? '등록 중...' : '공지 등록'}
        </button>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-black text-gray-400 mb-3">공지 목록</p>
        {loading ? (
          <p className="text-center py-8 text-xs text-gray-400">불러오는 중...</p>
        ) : notices.length === 0 ? (
          <p className="text-center py-8 text-xs text-gray-400">등록된 공지가 없습니다</p>
        ) : notices.map(n => (
          <div key={n.id} className={`py-3 border-b border-gray-50 last:border-0 flex items-start gap-3 ${n.is_active ? '' : 'opacity-50'}`}>
            <div className="flex-1">
              <p className={`text-sm font-bold ${n.is_active ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{n.message}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                {n.created_at?.split('T')[0]} · {n.is_active ? '활성' : '비활성'}
                {!!n.push_sent && (
                  <span className="ml-1 inline-flex items-center gap-0.5 text-blue-500">
                    <Bell size={11} /> 푸시 발송됨
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              <button onClick={() => handleToggle(n.id, n.is_active)}>
                {n.is_active ? <ToggleRight size={26} className="text-blue-500" /> : <ToggleLeft size={26} className="text-gray-300" />}
              </button>
              <button onClick={() => handleDelete(n.id)} className="p-1">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default NoticePage;
