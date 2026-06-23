import json, cv2
import numpy as np
from datetime import date

from pipeline_common import (
    MODEL, encode_image, fix_exif_rotation,
    is_valid_date, parse_llm_json, stream_llm, pass2_normalize
)

"""
PASS1_PROMPT — 20종 영수증 패턴 분석 반영 (최종)

분석한 영수증 출처:
  - 일반 마트 (별표* 형식)
  - HMP마트 (번호+불릿• 형식)
  - 주류마트 (NO. + 바코드 별도줄)
  - 농협 (P코드 형식)
  - 이마트/할인마트 (번호없음)
  - 지구마트 (품명/수/금액 심플)
  - 해피유통/푸르너/신비로마트 (NO. + 바코드 같은줄)
  - 다온마트 (번호없음 심플)
  - 식당 영수증 (한도니, J House)
  - 카페/베이커리 (타르틴베이커리)
"""

PASS1_PROMPT = """너는 한국 영수증 OCR 전문가다. 생각하지 말고 바로 JSON만 출력해라.

할 일은 딱 두 가지다:
1. 영수증에서 구매/판매 날짜를 찾아 YYYY-MM-DD 형식으로 변환
2. 식품/식재료 상품명과 수량을 영수증에 인쇄된 그대로 읽기

[날짜 변환]
아래 키워드 뒤에 오는 날짜를 찾는다:
  판매일, 판매일자, 매출일, 거래일시, 일시, 영수일자
- "2026-04-22 11:45"        → "2026-04-22"
- "25-10-24 13:38"          → "2025-10-24"  (YY → 20YY)
- "26-04-12 14:59,일요일"   → "2026-04-12"
- "2026/04/22"              → "2026-04-22"
- "매출일 2025-06-25 13:32" → "2025-06-25"
- 날짜 없으면 "unknown"

[영수증 형식별 읽기 규칙]

형식1 — 별표(*) 접두사 (마트):
  "*깻잎           2,500  1   2,500"  → name:"깻잎", qty:1
  "*돈 왕정살     10,640  1  10,640"  → name:"돈 왕정살", qty:1
  다음 줄의 6자리 이하 숫자(상품코드)는 무시

형식2 — 번호+불릿(•) 접두사:
  "01• 양다리훈합 닭다리  6,000  1"    → name:"양다리훈합 닭다리", qty:1
  "04•HMP다이어트닭(위)50  4,840  1"   → name:"HMP다이어트닭(위)50", qty:1
  번호와 •는 제거, 상품명만 추출

형식3 — NO./번호 + 바코드 별도줄 (지역마트):
  "001 시금치/국산 1단"
  "22207505  495  2  990"              → name:"시금치 1단", qty:2
  "001 반판두부 1팩(3kg)"
  "8809879970245  2,980  1  2,980"     → name:"반판두부 1팩(3kg)", qty:1
  "001 한성유부초밥박사 4봉한정 160g"
  "8801074800648  990  2  1,980"       → name:"한성유부초밥박사 160g", qty:2
  바코드(7자리 이상 숫자)줄에서 수량 추출, 바코드 제거
  "4봉한정", "1+1행사", "기획전" 같은 프로모션 문구는 제거

형식4 — P코드 접두사 (농협):
  "001 P 국모닝우유 900ML  [2,150]"    → name:"국모닝우유 900ML", qty:1
  "002 P 양파               3,300"     → name:"양파", qty:1
  번호와 "P " 제거, 상품명만 추출

형식5 — 번호없음 심플 (지구마트/다온마트):
  "한우 안심 1kg      1    62,900"     → name:"한우 안심 1kg", qty:1
  "볶음땅콩 450g   2,980   1   2,980"  → name:"볶음땅콩 450g", qty:1
  "대림)알뜰어묵사  2,580   1   2,580" → name:"대림)알뜰어묵사", qty:1

형식6 — 번호없음 이마트/할인마트 (바코드 별도줄):
  "어메이징닭강정"
  "2452480139803  13,980  1  13,980"   → name:"어메이징닭강정", qty:1
  "* 깐마늘(300g/봉)"
  "1500000186425   2,480  2   4,960"   → name:"깐마늘(300g/봉)", qty:2

형식7 — 6자리 상품코드 (카페/베이커리):
  "002173  자몽에이드"
  "7,500   1개   0   7,500"            → name:"자몽에이드", qty:1
  "002177  우유"
  "3,000   2개   0   6,000"            → name:"우유", qty:2
  6자리 숫자 코드는 상품코드이므로 제거
  수량이 "N개" 형식으로 표기될 수 있음

[괄호/옵션/원산지 처리]
- 괄호 안 내용은 상품명에 포함
  예) "처음처럼(병) 360ml"      → "처음처럼(병) 360ml"
  예) "무항생제 특란 (30구)"    → "무항생제 특란 (30구)"
  예) "냉동 자숙새우 500g"      → "냉동 자숙새우 500g"
- /원산지 표기는 제거
  예) "시금치/국산 1단"         → "시금치 1단"
  예) "제주산 은갈치(대)"       → "제주산 은갈치(대)" (제주산은 품질 정보라 유지)
- 프로모션 문구는 제거
  예) "한성유부초밥박사 4봉한정 160g" → "한성유부초밥박사 160g"
  예) "부사 사과(5입/봉)"       → "부사 사과(5입/봉)" (묶음 정보라 유지)

[식당/카페 영수증 처리]
아래와 같은 조리 음식이 보이면 해당 항목은 제외한다:
- 오믈렛, 스크램블, 에그베네딕트, 샌드위치, 팬케이크 등 조리 음식
- 아이스크림(단품), ICE, 음료(단품) 단, 마트에서 구매한 음료는 포함
- (신규), (추가) 접두사 항목 → 식당 추가주문이므로 식재료로 처리
  예) "(신규)생삼겹살" → name:"생삼겹살", qty:2
  예) "(추가)가브리살" → name:"가브리살", qty:1

[반드시 제외할 줄]
아래는 상품이 아니므로 절대 포함하지 않는다:
- 할인 줄: (*) 할인금액, $특매할인, [키데]e날특가할인, [델리]주말e날, 행사할인
- 묶음행사: 컵라면3개구매33%, 통)과일통조림1+1, 조)파스타소스행사, e데이행사, 냉장음료(할인표시)
- 합계/세금: 소계, 합계, 합 계, 과세물품, 면세물품, 부가세, 결제대상금액, 받을금액
- 카드/결제 정보: 카드번호, 승인번호, 신용카드지불
- 바코드/상품코드만 있는 줄

[수량 추출 규칙]
- "N개" 형식도 수량으로 인식: "1개" → 1, "2개" → 2
- 수량 컬럼명이 "수" 또는 "수량" 모두 인식
- 묶음 표기가 있어도 실제 구매 수량만 기록
  예) "제주 삼다수 2L   6   6,480" → qty:6
  예) "지리산샘물 묶음(20)  2,480  4  9,920" → qty:4

[영문 코드/브랜드 처리]
- HMP, GSI, B3, CJ 등 영문 코드는 그대로 유지
  예) "HMPIA우유1L" → name:"HMPIA우유1L"
  예) "CJ 스팸 클래식 200g" → name:"CJ 스팸 클래식 200g"
  예) "Easy meal 황도400g" → name:"Easy meal 황도400g"

출력 스키마:
{
  "purchase_date": "YYYY-MM-DD 또는 unknown",
  "items": [
    {"name": "영수증 원문 그대로 (정제 후)", "qty": 1}
  ]
}
JSON만 출력.
"""


def _preprocess_for_ocr(img: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
    kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
    return cv2.filter2D(img, -1, kernel)


def _pass1_ocr(img: np.ndarray, fallback_date: str) -> dict:
    img_b64 = encode_image(img, max_width=1200)

    payload = {
        "model": MODEL,
        "think": False,
        "messages": [
            {"role": "system", "content": PASS1_PROMPT},
            {
                "role": "user",
                "content": "이 영수증의 날짜와 상품 목록을 원문 그대로 읽어줘.",
                "images": [img_b64]
            }
        ],
        "format": "json",
        "stream": True,
        "options": {"temperature": 0, "num_predict": 2048}
    }

    raw_text = stream_llm(payload)
    result = parse_llm_json(raw_text)

    purchase_date = (result.get("purchase_date") or "").strip()
    if purchase_date == "unknown" or not is_valid_date(purchase_date):
        purchase_date = fallback_date

    items = []
    for it in result.get("items", []):
        if isinstance(it, str):
            it = {"name": it, "qty": 1}
        if not isinstance(it, dict):
            continue
        name = (it.get("name") or "").strip()
        if not name:
            continue
        items.append({"name": name, "qty": int(it.get("qty") or 1)})

    return {"purchase_date": purchase_date, "items": items}


def process_receipt_image(img_path: str) -> dict:
    fallback_date = date.today().strftime("%Y-%m-%d")
    img = fix_exif_rotation(img_path)
    img_ocr = _preprocess_for_ocr(img)

    print("[영수증 모드] OCR 시작 (1pass)...")
    pass1 = _pass1_ocr(img_ocr, fallback_date)
    purchase_date = pass1["purchase_date"]
    raw_items = pass1["items"]
    print(f"  구매일: {purchase_date}")
    print(f"  원문 상품 수: {len(raw_items)}개")

    if not raw_items:
        return {"source": "receipt_ocr", "purchase_date": purchase_date, "items": []}

    print("[영수증 모드] 정규화 중 (2pass)...")
    items = pass2_normalize(purchase_date, raw_items, fallback_date)
    print(f"  정규화 완료: {len(items)}개")

    return {
        "source": "receipt_ocr",
        "purchase_date": purchase_date,
        "items": items
    }


if __name__ == "__main__":
    import sys
    img_path = sys.argv[1] if len(sys.argv) > 1 else "input.jpg"
    result = process_receipt_image(img_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
