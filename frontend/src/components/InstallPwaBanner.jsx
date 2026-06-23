import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_install_dismissed') === '1');

  useEffect(() => {
    if (isStandalone() || dismissed) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    if (isIos()) setShowIosTip(true);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [dismissed]);

  const dismiss = () => {
    localStorage.setItem('pwa_install_dismissed', '1');
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  if (isStandalone() || dismissed) return null;
  if (!deferredPrompt && !showIosTip) return null;

  return (
    <div className="absolute bottom-24 left-0 right-0 z-[90] px-4 flex justify-center pointer-events-none">
      <div className="w-full max-w-[400px] bg-gray-900 text-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl pointer-events-auto">
        <Download size={20} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold">앱처럼 설치하고 알림 받기</p>
          <p className="text-xs text-gray-300 mt-0.5 leading-snug">
            {showIosTip
              ? '공유 버튼 → "홈 화면에 추가"를 눌러주세요'
              : '홈 화면에 추가하면 백그라운드에서도 알림을 받을 수 있어요'}
          </p>
        </div>
        {!showIosTip && (
          <button onClick={handleInstall} className="shrink-0 bg-white text-gray-900 text-xs font-black px-3 py-2 rounded-xl active:scale-95 transition-all">
            설치
          </button>
        )}
        <button onClick={dismiss} className="shrink-0 text-gray-400">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default InstallPwaBanner;
