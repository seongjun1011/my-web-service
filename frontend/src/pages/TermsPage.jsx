import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const TERMS_TEXT = `제1조 (목적)
이 약관은 SmartPantry(이하 "회사")가 제공하는 식재료 관리 및 AI 레시피 추천 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "회원"이란 본 약관에 동의하고 카카오, 구글, 네이버 등 소셜 로그인을 통해 가입하여 서비스를 이용하는 자를 말합니다.
2. "펜트리"란 회원이 보유한 식재료 정보를 등록·관리하는 서비스 내 기능을 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
2. 회사는 관계 법령을 위반하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행일자 및 변경사항을 사전에 공지합니다.

제4조 (회원가입)
1. 회원가입은 카카오, 구글, 네이버 소셜 로그인을 통해 이루어지며, 이메일, 이름/닉네임, 프로필 이미지를 제공받습니다.
2. 만 14세 미만은 회원가입을 할 수 없습니다.

제5조 (서비스의 제공)
회사는 다음과 같은 서비스를 제공합니다.
1. 식재료 수동 입력, 영수증 스캔, 카메라 촬영을 통한 펜트리 등록 및 관리
2. 유통기한 임박 알림 등 푸시 알림 발송
3. 보유 식재료 기반 AI 레시피 추천
4. 레시피 찜하기, 식재료 사용/폐기 통계 제공

제6조 (회원의 의무)
회원은 서비스 이용 시 관계 법령, 본 약관 및 회사가 공지하는 이용안내를 준수해야 하며, 타인의 정보를 도용하거나 서비스를 부정한 목적으로 이용해서는 안 됩니다.

제7조 (서비스 이용의 제한 및 중지)
회사는 회원이 본 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우, 사전 통지 후 서비스 이용을 제한하거나 중지할 수 있습니다.

제8조 (회원 탈퇴 및 개인정보의 파기)
1. 회원은 마이페이지의 회원 탈퇴 기능을 통해 언제든지 탈퇴를 요청할 수 있습니다.
2. 회원 탈퇴 시 회사는 회원의 개인정보를 지체 없이 파기합니다.
3. 다만 관계 법령에 따라 보존이 필요한 정보는 해당 법령이 정한 기간 동안 별도로 분리하여 보관한 후 파기합니다.
4. 탈퇴 시 회원이 등록한 보유 식재료 정보, AI 레시피 추천 이력, 찜한 레시피 등 서비스 이용 과정에서 생성된 데이터는 삭제 대상이며, 탈퇴 처리와 함께 모두 삭제됩니다.

제9조 (회사의 의무)
회사는 관계 법령과 본 약관이 금지하는 행위를 하지 않으며, 회원의 개인정보 보호를 위한 보안 시스템을 갖추고 지속적으로 관리합니다.

제10조 (책임의 제한)
회사는 천재지변, 회원의 귀책사유 등 회사의 고의 또는 과실 없이 발생한 서비스 장애로 인한 손해에 대해서는 책임을 지지 않습니다.

제11조 (분쟁 해결)
서비스 이용과 관련하여 분쟁이 발생한 경우, 회사와 회원은 분쟁 해결을 위해 성실히 협의하며, 협의가 이루어지지 않을 경우 관계 법령에 따른 관할 법원에 제소할 수 있습니다.

부칙
서비스명: SmartPantry
운영자: [추후 입력]
사업자등록번호: [추후 입력]
대표자명: [추후 입력]
고객센터 이메일: [추후 입력]
시행일자: [추후 입력]
최종 개정일: [추후 입력]`;

const PRIVACY_TEXT = `1. 수집하는 개인정보 항목
- 필수: 이메일, 이름/닉네임, 프로필 이미지 (카카오·구글·네이버 소셜 로그인 제공자로부터 수신)
- 서비스 이용 중 생성: 보유 식재료 정보(품목명, 수량, 유통기한, 보관위치), 영수증·식재료 촬영 이미지, AI 레시피 추천 이력, 찜한 레시피, 푸시 알림 구독 정보(endpoint, 암호화 키)

2. 개인정보의 이용 목적
- 회원 식별 및 소셜 로그인 인증
- 식재료 관리 및 유통기한 임박 알림 제공
- 보유 식재료 기반 AI 레시피 추천 생성 및 추천 품질 개선
- 공지사항 및 서비스 관련 푸시 알림 발송
- (선택 동의 시) 이벤트·혜택 등 마케팅 정보 안내

3. 보유 및 이용기간
- 회원 탈퇴 시까지 보유하며, 탈퇴 시 지체 없이 파기합니다.
- 다만 관계 법령에서 별도로 보존 기간을 정한 정보가 있는 경우 해당 기간 동안 분리 보관 후 파기합니다.

4. 이용자의 권리 및 행사 방법
- 회원은 마이페이지를 통해 자신의 개인정보를 조회·수정할 수 있으며, 푸시 알림·마케팅 정보 수신 동의는 언제든지 변경할 수 있습니다.
- 서비스 이용에 필수적인 동의 항목(이용약관, 만 14세 이상 확인, 개인정보 처리방침, 식재료 정보 처리)의 철회는 회원 탈퇴를 통해서만 가능합니다.

5. 개인정보 파기 절차 및 방법
- 파기 절차: 탈퇴 신청 접수 → 법령상 보존 필요 정보 분리 → 즉시 파기 대상 정보 삭제
- 파기 방법: 전자적 파일 형태의 정보는 복구가 불가능한 방법으로 영구 삭제하며, 인쇄물 형태의 정보는 분쇄 또는 소각합니다.

6. AI 처리 관련 고지
- 회원이 보유한 식재료 목록은 레시피 추천 생성을 위해 회사가 운영하는 AI 추천 서버로 전달될 수 있습니다.
- 생성된 추천 결과는 추천 이력 제공 및 서비스 품질 개선을 위해 저장될 수 있습니다.
- 저장된 추천 이력은 회원 탈퇴 시 삭제됩니다.

7. 개인정보 보호책임자
- 성명/직책: [추후 입력]
- 문의 이메일: [추후 입력]

8. 처리방침 변경 시 고지 방법
- 본 개인정보 처리방침이 변경되는 경우, 변경 사항을 시행 최소 7일 전(이용자 권리에 중대한 변경이 있는 경우 30일 전)에 서비스 내 공지사항을 통해 고지합니다.`;

const PANTRY_TEXT = `- 처리 항목: 식재료명, 수량, 유통기한, 보관 위치(냉장·냉동·실온)
- 이용 목적: 식재료 보관 현황 관리, 유통기한 임박 알림 제공, AI 레시피 추천 생성
- 보유 기간: 회원 탈퇴 시까지

AI 처리 관련 고지
- 회원이 보유한 식재료 목록은 회사가 운영하는 AI 추천 서버로 전달되어 레시피 추천 생성에 활용될 수 있습니다.
- 생성된 추천 결과는 추천 이력 제공 및 서비스 품질 개선을 위해 저장될 수 있습니다.
- 저장된 추천 이력은 회원 탈퇴 시 삭제됩니다.

본 항목에 동의하지 않으실 경우 식재료 등록 및 AI 레시피 추천 기능을 이용하실 수 없습니다.`;

const CONSENT_ITEMS = [
  {
    key: 'terms',
    required: true,
    label: '서비스 이용약관 동의',
    doc: TERMS_TEXT,
  },
  {
    key: 'age14',
    required: true,
    label: '만 14세 이상 확인',
    desc: '만 14세 미만은 회원가입이 제한됩니다. 만 14세 이상임을 확인합니다.',
  },
  {
    key: 'privacy',
    required: true,
    label: '개인정보 처리방침 동의',
    doc: PRIVACY_TEXT,
  },
  {
    key: 'pantry_data',
    required: true,
    label: '식재료(펜트리) 정보 처리 동의',
    doc: PANTRY_TEXT,
  },
  {
    key: 'camera',
    required: false,
    label: '카메라/사진(영수증·식재료 촬영) 이용 동의',
    desc: '영수증 스캔 및 식재료 촬영 기능 이용에 동의합니다. 카메라 권한은 동의와 별도로 해당 기능을 처음 사용하실 때 브라우저에서 요청됩니다.',
  },
  {
    key: 'push',
    required: false,
    label: '푸시 알림 수신 동의',
    desc: '유통기한 임박 알림, 운영 공지 등 푸시 알림 수신에 동의합니다. 실제 알림 활성화는 마이페이지에서 별도로 켜실 수 있습니다.',
  },
  {
    key: 'marketing',
    required: false,
    label: '마케팅 정보 수신 동의',
    desc: '이벤트, 혜택 등 마케팅 정보를 이메일/푸시로 받아보는 데 동의합니다.',
  },
];

const TermsPage = ({ onAgree }) => {
  const [checked, setChecked] = useState(() =>
    Object.fromEntries(CONSENT_ITEMS.map((item) => [item.key, false]))
  );
  const [expanded, setExpanded] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const allChecked = CONSENT_ITEMS.every((item) => checked[item.key]);
  const requiredOk = CONSENT_ITEMS.filter((item) => item.required).every((item) => checked[item.key]);

  const toggleAll = () => {
    const next = !allChecked;
    setChecked(Object.fromEntries(CONSENT_ITEMS.map((item) => [item.key, next])));
  };

  const toggleOne = (key) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  const toggleExpand = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async () => {
    if (!requiredOk || submitting) return;
    setSubmitting(true);
    try {
      await onAgree(checked);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 flex flex-col h-full bg-white">
      <h2 className="text-2xl font-black mb-1">서비스 이용 약관 동의</h2>
      <p className="text-sm text-gray-500 mb-5">SmartPantry 이용을 위해 아래 약관에 동의해주세요.</p>

      <button
        onClick={toggleAll}
        className={`flex items-center gap-3 p-4 rounded-2xl mb-3 border-2 transition-colors ${
          allChecked ? 'bg-black border-black text-white' : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}
      >
        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
            allChecked ? 'bg-white text-black' : 'bg-white border border-gray-300'
          }`}
        >
          {allChecked && <Check size={16} strokeWidth={3} />}
        </span>
        <span className="font-black">전체 동의하기</span>
      </button>

      <div className="flex-1 overflow-y-auto -mx-1 px-1">
        {CONSENT_ITEMS.map((item) => (
          <div key={item.key} className="border-b border-gray-100 py-3">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => toggleOne(item.key)}
                className="flex items-center gap-3 flex-1 text-left min-w-0"
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border-2 ${
                    checked[item.key] ? 'bg-black border-black text-white' : 'border-gray-300'
                  }`}
                >
                  {checked[item.key] && <Check size={12} strokeWidth={3} />}
                </span>
                <span className="text-sm min-w-0">
                  <span className={`font-bold mr-1 ${item.required ? 'text-red-500' : 'text-gray-400'}`}>
                    [{item.required ? '필수' : '선택'}]
                  </span>
                  <span className="font-bold text-gray-800">{item.label}</span>
                </span>
              </button>
              {item.doc && (
                <button
                  onClick={() => toggleExpand(item.key)}
                  className="p-1 text-gray-400 shrink-0"
                  aria-label="전문 보기"
                >
                  <ChevronDown
                    size={18}
                    className={`transition-transform ${expanded[item.key] ? 'rotate-180' : ''}`}
                  />
                </button>
              )}
            </div>

            {item.desc && (
              <p className="text-xs text-gray-400 mt-1.5 ml-8 leading-relaxed">{item.desc}</p>
            )}

            {item.doc && expanded[item.key] && (
              <div className="mt-3 ml-8 bg-gray-50 rounded-2xl p-4 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {item.doc}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!requiredOk || submitting}
        className="w-full bg-black text-white py-4 rounded-2xl font-bold active:scale-95 transition-all mt-4 disabled:opacity-30 disabled:active:scale-100"
      >
        {submitting ? '처리 중...' : '동의하고 시작하기'}
      </button>
    </div>
  );
};

export default TermsPage;
