import React from 'react';
import { LogOut, Monitor, MapPin, Clock } from 'lucide-react';

const SettingsPage = ({ onLogout, sessionInfo }) => {
  const fmtLoginAt = sessionInfo?.loginAt
    ? new Date(sessionInfo.loginAt).toLocaleString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : null;

  return (
    <div className="flex flex-col h-full">
      <div className="h-11 flex items-center justify-between px-6 bg-white border-b border-slate-100 shadow-sm shrink-0">
        <span className="text-base font-black text-slate-800">설정</span>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="flex flex-col items-center py-8 border-b border-gray-50">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-lg font-black text-gray-600 mb-3">
          관리
        </div>
        <p className="text-base font-black text-gray-900">관리자</p>
        <p className="text-xs text-gray-400 font-medium mt-0.5">SmartPantry Admin</p>
        <span className="mt-2 text-[10px] font-bold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
          슈퍼 어드민
        </span>
      </div>

      {/* 현재 세션 정보 */}
      {sessionInfo && (
        <div className="mx-5 mt-5 bg-gray-50 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-black text-gray-400 tracking-wider">현재 세션</p>
          <div className="space-y-2">
            {fmtLoginAt && (
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-600">{fmtLoginAt}</span>
              </div>
            )}
            {sessionInfo.loginIp && (
              <div className="flex items-center gap-2.5">
                <MapPin size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-600">{sessionInfo.loginIp}</span>
              </div>
            )}
            {sessionInfo.device && (
              <div className="flex items-center gap-2.5">
                <Monitor size={14} className="text-gray-400 shrink-0" />
                <span className="text-xs font-medium text-gray-600">{sessionInfo.device}</span>
              </div>
            )}
          </div>
          <p className="text-[10px] text-gray-300 font-medium pt-1">
            다른 기기에서 로그인하면 이 세션은 자동으로 종료됩니다.
          </p>
        </div>
      )}

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-5 py-4 mt-4 active:bg-red-50 transition-colors"
      >
        <LogOut size={18} className="text-red-400 flex-shrink-0" />
        <span className="text-sm font-bold text-red-400">로그아웃</span>
      </button>
      </div>
    </div>
  );
};

export default SettingsPage;
