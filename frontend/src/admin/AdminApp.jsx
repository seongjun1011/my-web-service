import React, { useState } from 'react';
import { LayoutDashboard, Users, Camera, Megaphone, Shield, Settings, LogOut, BarChart2, Trash2, Menu, X } from 'lucide-react';

import AdminLoginPage      from './AdminLoginPage';
import DashboardPage       from './DashboardPage';
import UserListPage        from './UserListPage';
import ScanLogPage         from './ScanLogPage';
import NoticePage          from './NoticePage';
import AuditLogPage        from './AuditLogPage';
import SettingsPage        from './SettingsPage';
import IngredientStatsPage from './IngredientStatsPage';
import WastePage           from './WastePage';

const NAV = [
  { id: 'dashboard', icon: LayoutDashboard, label: '대시보드',    group: '메인' },
  { id: 'users',     icon: Users,           label: '사용자 관리', group: '메인' },
  { id: 'scanlogs',  icon: Camera,          label: '스캔 로그',   group: '메인' },
  { id: 'igstats',   icon: BarChart2,       label: '식재료 통계', group: '메인' },
  { id: 'waste',     icon: Trash2,          label: '낭비 통계',   group: '메인' },
  { id: 'notice',    icon: Megaphone,       label: '공지 관리',   group: '운영' },
  { id: 'audit',     icon: Shield,          label: '감사 로그',   group: '운영' },
  { id: 'settings',  icon: Settings,        label: '설정',        group: '운영' },
];

const AdminApp = () => {
  const [isLoggedIn, setIsLoggedIn]   = useState(false);
  const [page, setPage]               = useState('dashboard');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = async () => {
    setIsLoggedIn(true);
    try {
      const res  = await fetch('/api/admin/session-info', { credentials: 'include' });
      const data = await res.json();
      setSessionInfo(data);
    } catch {}
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPage('dashboard');
    setSessionInfo(null);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <DashboardPage />;
      case 'users':     return <UserListPage />;
      case 'scanlogs':  return <ScanLogPage />;
      case 'igstats':   return <IngredientStatsPage />;
      case 'waste':     return <WastePage />;
      case 'notice':    return <NoticePage />;
      case 'audit':     return <AuditLogPage />;
      case 'settings':  return <SettingsPage onLogout={handleLogout} sessionInfo={sessionInfo} />;
      default:          return <DashboardPage />;
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="w-screen h-screen flex">
        <AdminLoginPage onLogin={handleLogin} />
      </div>
    );
  }

  const mainItems = NAV.filter(n => n.group === '메인');
  const opItems   = NAV.filter(n => n.group === '운영');

  const fmtLoginAt = sessionInfo?.loginAt
    ? new Date(sessionInfo.loginAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  const navLabel = NAV.find(n => n.id === page)?.label ?? '대시보드';

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-md shadow-blue-100">
            <span className="text-white text-xs font-black">SP</span>
          </div>
          <div>
            <p className="text-sm font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              SmartPantry
            </p>
            <p className="text-[10px] text-gray-400 font-medium">Admin Console</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-gray-100 shrink-0" />

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-300 px-3 mb-2 tracking-widest uppercase">메인</p>
        {mainItems.map(({ id, icon: Icon, label }) => (
          <button key={id}
            onClick={() => { setPage(id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              page === id
                ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 pl-[10px]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon size={15} className="shrink-0" /> {label}
          </button>
        ))}

        <p className="text-[10px] font-bold text-gray-300 px-3 mb-2 mt-5 tracking-widest uppercase">운영</p>
        {opItems.map(({ id, icon: Icon, label }) => (
          <button key={id}
            onClick={() => { setPage(id); setSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
              page === id
                ? 'bg-blue-50 text-blue-600 border-l-2 border-blue-500 pl-[10px]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
            }`}>
            <Icon size={15} className="shrink-0" /> {label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-gray-100 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-sm">
            관
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-gray-800">관리자</p>
            {fmtLoginAt && (
              <p className="text-[10px] text-gray-400 truncate">{fmtLoginAt} 로그인</p>
            )}
          </div>
        </div>
        {sessionInfo?.loginIp && (
          <p className="text-[10px] text-gray-400 font-medium px-0.5 mb-3 truncate">
            {sessionInfo.loginIp}{sessionInfo.device ? ` · ${sessionInfo.device}` : ''}
          </p>
        )}
        <button onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all font-bold">
          <LogOut size={13} /> 로그아웃
        </button>
      </div>
    </>
  );

  return (
    <div className="flex w-screen h-screen bg-gray-50 overflow-hidden">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-white border-r border-gray-100 shadow-sm">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative w-64 flex flex-col bg-white border-r border-gray-100 h-full z-10 shadow-2xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 h-12 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-black text-gray-800">{navLabel}</span>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
            관
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default AdminApp;
