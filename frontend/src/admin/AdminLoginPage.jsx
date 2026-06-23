import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

const AdminLoginPage = ({ onLogin }) => {
  const [id, setId]         = useState('');
  const [pw, setPw]         = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError]   = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/console-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, pw }),
      });
      const data = await res.json();
      if (data.success) onLogin();
      else setError(data.message || '로그인에 실패했습니다.');
    } catch {
      setError('서버 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex-1 relative flex flex-col items-center justify-center px-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 h-full overflow-hidden">

      {/* 배경 장식 */}
      <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full bg-blue-100/60 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full bg-indigo-100/60 blur-3xl pointer-events-none" />

      {/* 카드 */}
      <div className="relative w-full max-w-sm bg-white shadow-2xl shadow-blue-100/60 ring-1 ring-gray-100 rounded-3xl px-8 py-10">

        {/* 로고 */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
            <Lock size={26} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 text-center">관리자 로그인</h2>
          <p className="text-sm text-gray-400 font-medium mt-1 text-center">SmartPantry Admin Console</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">아이디</label>
            <input
              type="text"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="off"
              placeholder="관리자 아이디"
              className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1.5 block">비밀번호</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                autoComplete="new-password"
                placeholder="비밀번호"
                className="w-full h-12 bg-gray-50 border border-gray-200 rounded-2xl px-4 pr-12 text-sm font-medium text-gray-900 placeholder-gray-300 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
              <p className="text-xs text-red-500 font-medium text-center">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white rounded-2xl text-sm font-black active:scale-[0.98] transition-all shadow-lg shadow-blue-200 mt-2"
          >
            로그인
          </button>
        </form>

        <p className="text-xs text-gray-300 font-medium mt-8 text-center">
          관리자 전용 페이지입니다
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
