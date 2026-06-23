import React, { useState, useEffect } from 'react';
import { User, Bell, BellOff, Shield, HelpCircle, LogOut, ChevronRight, X, Pencil, Trash2, UserX, ChevronDown } from 'lucide-react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

const MyPage = ({ userName, onLogout, onUserNameChange }) => {
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [section, setSection] = useState(null);

  const [nickname, setNickname] = useState(userName || '');
  const [nicknameLoading, setNicknameLoading] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState('');

  const [resetLoading, setResetLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [notifSubscribed, setNotifSubscribed] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    // 현재 구독 여부 확인
    fetch('/api/push/status', { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.subscribed) setNotifSubscribed(true); })
      .catch(() => {});
  }, []);

  // 푸시/마케팅 동의 상태를 서버에 반영
  const setConsentValue = async (consentType, agreed) => {
    const res = await fetch('/api/user/consents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ consent_type: consentType, agreed }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error('consent update failed');
  };

  const handleNotifToggle = async () => {
    setNotifLoading(true);
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('이 브라우저는 푸시 알림을 지원하지 않습니다.');
        return;
      }

      if (notifSubscribed) {
        // 구독 해제
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch('/api/push/unsubscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
        }
        setNotifSubscribed(false);
        await Promise.all([
          setConsentValue('push', false),
          setConsentValue('marketing', false),
        ]);
      } else {
        if (!window.confirm('푸시 알림 수신, 마케팅 정보 수신에 동의하시겠습니까?')) {
          return;
        }

        // 알림 권한 요청
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          alert('알림 권한이 거부됐습니다. 브라우저 설정에서 허용해주세요.');
          return;
        }

        // 서비스 워커 등록
        const reg = await navigator.serviceWorker.register('/sw.js');
        await navigator.serviceWorker.ready;

        // VAPID 키 가져오기
        const { publicKey } = await fetch('/api/push/vapid-public-key').then(r => r.json());

        // Push 구독
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        // 서버에 저장
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(sub.toJSON()),
        });

        await Promise.all([
          setConsentValue('push', true),
          setConsentValue('marketing', true),
        ]);

        setNotifSubscribed(true);
        alert('✅ 알림이 설정됐어요! 매일 오전 9시에 유통기한 임박 식재료를 알려드려요.');
      }
    } catch (err) {
      console.error(err);
      alert('알림 설정 중 오류가 발생했습니다.');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleCustomerService = () => {
    window.open('http://pf.kakao.com/_yxbfTX/chat', '_blank');
  };

  const openPrivacy = () => {
    setSection(null);
    setNicknameMsg('');
    setNickname(userName || '');
    setIsPrivacyOpen(true);
  };

  const closePrivacy = () => {
    setIsPrivacyOpen(false);
    setSection(null);
  };

  // 닉네임 변경
  const handleNicknameSubmit = async () => {
    if (!nickname.trim()) return;
    setNicknameLoading(true);
    setNicknameMsg('');
    try {
      const res = await fetch('/api/user/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: nickname.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNicknameMsg('변경되었습니다!');
        onUserNameChange && onUserNameChange(data.name);
      } else {
        setNicknameMsg('변경에 실패했습니다.');
      }
    } catch {
      setNicknameMsg('서버 오류가 발생했습니다.');
    } finally {
      setNicknameLoading(false);
    }
  };

  // 데이터 초기화
  const handleReset = async () => {
    if (!window.confirm('식재료 데이터를 모두 삭제할까요? 복구할 수 없습니다.')) return;
    setResetLoading(true);
    try {
      const res = await fetch('/api/delete-all-items', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        alert('모든 식재료 데이터가 삭제되었습니다.');
        closePrivacy();
      } else {
        alert('삭제 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  // 회원 탈퇴
  const handleWithdraw = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까?\n계정과 모든 데이터가 영구 삭제됩니다.')) return;
    setWithdrawLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = '/';
      } else {
        alert('탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch {
      alert('서버 오류가 발생했습니다.');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const menuItems = [
    {
      type: 'toggle',
      icon: notifSubscribed ? <Bell size={20} /> : <BellOff size={20} />,
      label: '푸시 알림 받기',
      color: notifSubscribed ? 'text-blue-500' : 'text-gray-400',
      onClick: handleNotifToggle,
      checked: notifSubscribed,
      loading: notifLoading,
    },
    { icon: <Shield size={20} />, label: '개인정보 설정', color: 'text-green-500', onClick: openPrivacy },
    { icon: <HelpCircle size={20} />, label: '고객센터', color: 'text-purple-500', onClick: handleCustomerService },
  ];

  const privacyItems = [
    {
      key: 'nickname',
      icon: <Pencil size={18} />,
      label: '닉네임 변경',
      color: 'text-blue-500',
      bg: 'bg-blue-50',
    },
    {
      key: 'reset',
      icon: <Trash2 size={18} />,
      label: '데이터 초기화',
      color: 'text-orange-500',
      bg: 'bg-orange-50',
    },
    {
      key: 'withdraw',
      icon: <UserX size={18} />,
      label: '회원 탈퇴',
      color: 'text-red-500',
      bg: 'bg-red-50',
    },
  ];

  return (
    <div className="flex-1 bg-gray-50 overflow-y-auto">
      {/* 프로필 섹션 */}
      <div className="bg-white p-8 pt-12 rounded-b-[40px] shadow-sm mb-6 text-center">
        <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <User size={48} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">{userName || '유저'}님</h2>
        <p className="text-gray-500 text-sm mt-1">스마트하게 냉장고를 관리 중입니다 🥬</p>
      </div>

      {/* 설정 메뉴 리스트 */}
      <div className="px-6 space-y-3">
        <p className="text-xs font-bold text-gray-400 ml-2 mb-1 uppercase tracking-wider">기본 설정</p>
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              disabled={!!item.loading}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors border-b border-gray-50 last:border-none disabled:opacity-60"
            >
              <div className="flex items-center gap-4">
                <span className={item.color}>{item.icon}</span>
                <span className="font-bold text-gray-700">{item.label}</span>
              </div>
              {item.type === 'toggle' ? (
                <span
                  className={`w-12 h-7 rounded-full relative transition-colors duration-200 ${item.checked ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.checked ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </span>
              ) : (
                <ChevronRight size={18} className="text-gray-300" />
              )}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-gray-400 ml-2 mt-6 mb-1 uppercase tracking-wider">계정 관리</p>
        <button
          onClick={onLogout}
          className="w-full bg-white p-5 rounded-[32px] flex items-center gap-4 shadow-sm border border-gray-100 text-red-500 hover:bg-red-50 transition-colors active:scale-[0.98]"
        >
          <LogOut size={20} />
          <span className="font-bold">로그아웃</span>
        </button>
      </div>

      <div className="h-20" />

      {/* 개인정보 설정 바텀시트 */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-[430px] bg-white rounded-t-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* 헤더 */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-900">개인정보 설정</h3>
              <button onClick={closePrivacy} className="p-2 rounded-full bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>

            {/* 메뉴 항목들 */}
            <div className="space-y-3 mb-4">
              {privacyItems.map((item) => (
                <div key={item.key}>
                  <button
                    onClick={() => setSection(section === item.key ? null : item.key)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-[20px] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-9 h-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                        {item.icon}
                      </span>
                      <span className="font-bold text-gray-800">{item.label}</span>
                    </div>
                    <ChevronDown
                      size={18}
                      className={`text-gray-400 transition-transform duration-200 ${section === item.key ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* 닉네임 변경 패널 */}
                  {section === 'nickname' && item.key === 'nickname' && (
                    <div className="mt-2 px-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => { setNickname(e.target.value); setNicknameMsg(''); }}
                        maxLength={20}
                        placeholder="새 닉네임 입력"
                        className="w-full p-4 bg-gray-100 rounded-2xl font-bold outline-none text-gray-800"
                      />
                      {nicknameMsg && (
                        <p className={`text-sm font-bold ml-1 ${nicknameMsg.includes('변경') ? 'text-green-500' : 'text-red-500'}`}>
                          {nicknameMsg}
                        </p>
                      )}
                      <button
                        onClick={handleNicknameSubmit}
                        disabled={nicknameLoading || !nickname.trim()}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                      >
                        {nicknameLoading ? '저장 중...' : '저장하기'}
                      </button>
                    </div>
                  )}

                  {/* 데이터 초기화 패널 */}
                  {section === 'reset' && item.key === 'reset' && (
                    <div className="mt-2 px-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-gray-500 font-medium mb-3 ml-1">
                        냉장고에 등록된 식재료 데이터가 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                      </p>
                      <button
                        onClick={handleReset}
                        disabled={resetLoading}
                        className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                      >
                        {resetLoading ? '삭제 중...' : '전체 데이터 삭제하기'}
                      </button>
                    </div>
                  )}

                  {/* 회원 탈퇴 패널 */}
                  {section === 'withdraw' && item.key === 'withdraw' && (
                    <div className="mt-2 px-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <p className="text-sm text-gray-500 font-medium mb-1 ml-1">
                        계정과 모든 식재료 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                      </p>
                      <p className="text-xs text-gray-400 font-medium mb-3 ml-1">
                        서비스 이용약관, 만 14세 이상 확인, 개인정보 처리방침, 식재료 정보 처리 동의 등 필수 동의 항목은 마이페이지에서 개별적으로 철회할 수 없으며, 철회를 원하시는 경우 회원 탈퇴를 진행해주세요.
                      </p>
                      <button
                        onClick={handleWithdraw}
                        disabled={withdrawLoading}
                        className="w-full py-4 bg-red-500 text-white rounded-2xl font-black disabled:opacity-50 active:scale-[0.98] transition-all"
                      >
                        {withdrawLoading ? '처리 중...' : '회원 탈퇴하기'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
