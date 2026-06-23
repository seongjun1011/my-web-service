import React, { useState, useEffect } from 'react';
import { Camera, ArrowRight, FileText, Image as ImageIcon, AlertCircle, Megaphone, X, Sparkles } from 'lucide-react';
import FoodIcon from '../components/FoodIcon';

const HomePage = ({ onScanClick, userName, pantryItems = [], onNavigate }) => {
  const [scanMode, setScanMode] = useState('food');
  const [notice, setNotice] = useState(null);
  const [noticeDismissed, setNoticeDismissed] = useState(false);

  useEffect(() => {
    fetch('/api/notice', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.message) setNotice(data.message); })
      .catch(() => {});
  }, []);


  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const urgentItems = pantryItems
    .map(item => {
      const expiry = new Date(item.expiry_date);
      expiry.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      return { ...item, dDay: diffDays };
    })
    .filter(item => item.dDay <= 3)
    .sort((a, b) => a.dDay - b.dDay);

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full scrollbar-hide">
      {/* 공지 배너 */}
      {notice && !noticeDismissed && (
        <div className="bg-blue-50 border border-blue-100 rounded-[24px] px-4 py-3 flex items-start gap-3">
          <Megaphone size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-blue-700 flex-1">{notice}</p>
          <button onClick={() => setNoticeDismissed(true)} className="text-blue-300 shrink-0">
            <X size={16} />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-black text-gray-900 leading-tight">
          안녕하세요, {userName || '유저'}님! 👋
        </h2>
        <p className="text-gray-500 font-medium mt-1">오늘의 냉장고 상태를 확인해 보세요.</p>
      </div>

      {/* 유통기한 임박 섹션 */}
      {urgentItems.length > 0 ? (
        <div className="bg-red-50 p-5 rounded-[30px] border border-red-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-red-600 font-bold text-sm flex items-center gap-1">
              <AlertCircle size={16} />
              유통기한 임박 재료 ({urgentItems.length})
            </span>
            <button onClick={() => onNavigate('pantry')} className="text-red-400 active:scale-90 transition-transform">
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {urgentItems.map((item) => (
              <div key={item.id} className="bg-white p-3 rounded-2xl shadow-sm min-w-[120px] border border-red-50">
                <p className="mb-1"><FoodIcon name={item.item_name} emoji={item.item_emoji} size={28} className="text-2xl" /></p>
                <p className="font-bold text-sm truncate">{item.item_name}</p>
                <p className={`text-xs font-black ${item.dDay <= 0 ? 'text-red-600' : 'text-red-500'}`}>
                  {item.dDay === 0 ? 'D-Day' : item.dDay < 0 ? `지남 (${Math.abs(item.dDay)}일)` : `D-${item.dDay}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 p-5 rounded-[30px] border border-green-100 flex items-center justify-between">
          <p className="text-green-700 font-bold text-sm">✅ 모든 재료가 신선해요!</p>
          <span className="text-2xl">✨</span>
        </div>
      )}

      {/* 스캔 버튼 */}
      <div className="space-y-3">
        <p className="text-sm font-bold text-gray-400 ml-1">인식 모드 선택</p>
        <div className="bg-gray-100 p-1.5 rounded-[24px] flex gap-1">
          <button
            onClick={() => setScanMode('food')}
            className={`flex-1 py-3 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              scanMode === 'food' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}
          >
            <ImageIcon size={18} /> 식재료 촬영
          </button>
          <button
            onClick={() => setScanMode('receipt')}
            className={`flex-1 py-3 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              scanMode === 'receipt' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'
            }`}
          >
            <FileText size={18} /> 영수증 스캔
          </button>
        </div>
        <button
          onClick={() => onScanClick(scanMode)}
          className={`w-full p-6 rounded-[32px] text-left relative overflow-hidden group active:scale-[0.98] transition-all shadow-xl ${
            scanMode === 'receipt' ? 'bg-blue-600' : 'bg-gray-900'
          }`}
        >
          <div className="relative z-10">
            <p className="text-white/60 text-sm font-bold mb-1">
              {scanMode === 'receipt' ? '영수증을 펼쳐서 촬영해 주세요' : '식재료가 생겼나요?'}
            </p>
            <p className="text-white text-xl font-black leading-snug">
              {scanMode === 'receipt' ? '영수증 스캔해서\n항목 자동 등록' : '식재료 사진 찍어서\n간편하게 등록하기'}
            </p>
          </div>
          <Camera size={80} className="absolute -right-4 -bottom-4 text-white/10 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* 오늘의 추천 레시피 */}
      <div className="space-y-3 pb-10">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">오늘의 추천 레시피 👨‍🍳</h3>
        <button
          onClick={() => onNavigate('recipe')}
          disabled={pantryItems.length === 0}
          className="w-full bg-gray-50 border border-gray-100 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shrink-0">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="text-left">
            <p className="font-black text-gray-900 text-sm">AI 레시피 추천받기</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {pantryItems.length === 0 ? '식재료를 먼저 등록해주세요' :
                urgentItems.length > 0 ? `임박 재료 ${urgentItems.length}개 활용` : `보유 재료 ${pantryItems.length}개 활용`}
            </p>
          </div>
          <ArrowRight size={18} className="text-gray-300 ml-auto" />
        </button>
      </div>
    </div>
  );
};

export default HomePage;
