import os, requests, base64, json, re, cv2
import numpy as np
from json_repair import repair_json
from datetime import datetime, timedelta

try:
    from PIL import Image, ExifTags
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

OLLAMA_URL = os.getenv("OLLAMA_URL", "https://ollama.aikopo.net")
MODEL      = os.getenv("OLLAMA_MODEL", "gemma4:26b")
LLM_TIMEOUT = int(os.getenv("LLM_TIMEOUT", "120"))

VALID_STORAGE = {"냉장", "냉동", "실온"}
DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


# ══════════════════════════════════════════════════════════════
# 식약처 소비기한 참고값 (제조일 기준, 단위: 일)
#
# 출처: 식품의약품안전처 「식품 유형별 소비기한 참고값」
#       한국식품산업협회 (https://www.kfia.or.kr)
#
# ⚠️ 아래 값은 대표적인 참고값이며, 실제 식약처 공개 데이터로
#    검증/보완할 것. 키워드는 위에서부터 첫 매칭 적용.
# ══════════════════════════════════════════════════════════════
_MFDS_USE_BY: list[tuple[list[str], int]] = [
    # ── 유제품 ──
    (["발효유", "요거트", "요구르트"], 18),
    (["가공유", "딸기우유", "초코우유", "바나나우유"], 16),
    (["우유", "멸균우유"], 14),
    (["치즈", "체다", "모짜렐라"], 70),
    (["버터"], 180),
    (["생크림", "휘핑크림"], 14),

    # ── 두부/콩 ──
    (["두부"], 14),
    (["순두부"], 10),
    (["콩나물"], 5),
    (["숙주"], 4),

    # ── 어묵/가공수산 ──
    (["어묵", "맛살", "게맛살"], 29),
    (["젓갈"], 60),

    # ── 김치/절임 ──
    (["김치", "겉절이"], 30),
    (["단무지", "장아찌", "피클"], 90),

    # ── 육가공 ──
    (["햄", "소시지", "비엔나"], 38),
    (["베이컨"], 30),
    (["스팸", "런천미트"], 365),

    # ── 신선 육류 (냉장) ──
    (["다짐육", "간고기"], 2),
    (["삼겹살", "목살", "갈비", "불고기", "소고기", "돼지고기", "닭고기", "한우", "한돈"], 5),

    # ── 신선 수산 (냉장) ──
    (["회", "활어", "생물"], 1),
    (["고등어", "갈치", "삼치", "조기", "생선"], 2),
    (["연어"], 3),
    (["새우", "오징어", "조개", "게", "어패"], 2),

    # ── 달걀 ──
    (["달걀", "계란", "특란", "메추리알"], 30),

    # ── 면/즉석 ──
    (["라면", "국수", "당면", "파스타", "스파게티"], 180),
    (["즉석밥", "햇반"], 270),
    (["냉동만두", "만두"], 270),

    # ── 통조림/장류 ──
    (["참치캔", "통조림", "캔"], 365),
    (["간장", "된장", "고추장", "쌈장", "춘장"], 540),
    (["참기름", "들기름", "식용유", "올리브유"], 365),
    (["고춧가루", "소금", "설탕", "밀가루", "전분"], 365),
    (["케첩", "마요네즈", "소스", "드레싱"], 270),

    # ── 곡물 ──
    (["쌀", "현미", "잡곡", "보리", "콩"], 180),

    # ── 과자/스낵 ──
    (["과자", "스낵", "크래커", "쿠키", "비스킷", "초콜릿"], 180),
    (["빵", "식빵", "베이글"], 5),
    (["견과류", "아몬드", "호두", "땅콩", "캐슈"], 180),

    # ── 음료/주류 ──
    (["생수", "물"], 365),
    (["탄산음료", "콜라", "사이다"], 270),
    (["주스", "음료"], 180),
    (["맥주"], 365),
    (["소주", "막걸리", "와인"], 365),

    # ── 채소 (냉장) ──
    (["상추", "시금치", "깻잎", "배추", "잎채소", "쌈채소"], 5),
    (["오이", "애호박", "호박", "가지", "파프리카", "고추"], 7),
    (["당근", "무", "양배추", "브로콜리"], 10),
    (["대파", "쪽파", "부추"], 7),
    (["버섯", "표고", "느타리", "팽이"], 7),

    # ── 과일 (실온/냉장) ──
    (["딸기", "블루베리", "산딸기"], 4),
    (["복숭아", "자두", "포도", "체리"], 7),
    (["사과", "배", "감", "귤", "오렌지", "레몬", "자몽"], 14),
    (["바나나", "망고", "키위", "참외", "수박", "멜론"], 7),

    # ── 뿌리채소 (실온) ──
    (["양파", "마늘", "감자", "고구마", "생강"], 21),
]

# 식약처 매핑에 없을 때 storage별 기본값
_STORAGE_DEFAULT_DAYS = {"냉동": 90, "냉장": 5, "실온": 90}


def is_valid_date(s: str) -> bool:
    if not DATE_RE.match(s):
        return False
    try:
        datetime.strptime(s, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def _add_days(base_date_str: str, days: int) -> str:
    base = datetime.strptime(base_date_str, "%Y-%m-%d")
    return (base + timedelta(days=days)).strftime("%Y-%m-%d")


def calculate_use_by(name: str, storage: str, purchase_date: str) -> str:
    """
    소비기한 계산 (우선순위)
      1. 식약처 참고값(_MFDS_USE_BY) 키워드 매칭
      2. 매칭 없으면 storage별 기본값
    """
    # 1순위: 식약처 참고값
    for keywords, days in _MFDS_USE_BY:
        if any(kw in name for kw in keywords):
            # 냉동이면 신선식품 기한을 크게 연장
            if storage == "냉동":
                days = max(days, 90)
            return _add_days(purchase_date, days)

    # 2순위: storage별 기본값
    return _add_days(purchase_date, _STORAGE_DEFAULT_DAYS.get(storage, 7))


def fix_exif_rotation(img_path: str) -> np.ndarray:
    if not PIL_AVAILABLE:
        return cv2.imread(img_path)
    try:
        pil_img = Image.open(img_path)
        exif = pil_img.getexif()
        if exif:
            orientation_key = next(
                (k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None
            )
            orientation = exif.get(orientation_key, 1) if orientation_key else 1
            rotate_map = {3: 180, 6: 270, 8: 90}
            angle = rotate_map.get(orientation, 0)
            if angle:
                pil_img = pil_img.rotate(angle, expand=True)
        return cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
    except Exception:
        return cv2.imread(img_path)


def encode_image(img: np.ndarray, max_width: int = 1000) -> str:
    h, w = img.shape[:2]
    if w > max_width:
        scale = max_width / w
        img = cv2.resize(img, (int(w * scale), int(h * scale)),
                         interpolation=cv2.INTER_AREA)
    _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
    return base64.b64encode(buf).decode("utf-8")


def _wrap(parsed):
    if isinstance(parsed, list):
        return {"items": parsed}
    return parsed


def _try_parse(text: str):
    try:
        return _wrap(json.loads(text))
    except json.JSONDecodeError:
        pass
    try:
        return _wrap(json.loads(repair_json(text)))
    except Exception:
        pass
    return None


def parse_llm_json(text: str) -> dict:
    result = _try_parse(text)
    if result is not None:
        return result
    for start_char in ['{', '[']:
        idx = text.rfind(start_char)
        if idx != -1:
            result = _try_parse(text[idx:])
            if result is not None:
                return result
    print("[경고] JSON 파싱 실패")
    print("[RAW]", text[:300])
    return {"items": []}


def stream_llm(payload: dict) -> str:
    try:
        resp = requests.post(f"{OLLAMA_URL}/api/chat",
                             json=payload, stream=True, timeout=LLM_TIMEOUT)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"[LLM 오류] {e}")
        return ""
    content_buf = ""
    thinking_buf = ""
    for line in resp.iter_lines():
        if line:
            chunk = json.loads(line)
            msg = chunk.get("message", {})
            content_buf += msg.get("content", "")
            thinking_buf += msg.get("thinking", "")
            if chunk.get("done"):
                break
    return content_buf.strip() if content_buf.strip() else thinking_buf


_PASS2_PROMPT = """너는 한국 식재료 정보 처리 전문가다. 생각하지 말고 바로 JSON만 출력해라.
이미지는 없다. 아래 텍스트 데이터만 처리한다.

처리할 상품 목록:
{items_json}

[중요] 입력 상품 목록에 없는 항목을 절대 추가하지 마라. 있는 것만 정규화한다.

[영어 식재료 번역 규칙]
apple → 사과, potato → 감자, egg → 달걀, tofu → 두부,
carrot → 당근, onion → 양파, milk → 우유, banana → 바나나,
strawberry → 딸기, watermelon → 수박, orange → 오렌지,
peach → 복숭아, pear → 배, mango → 망고, kiwi → 키위,
cherry → 체리, pineapple → 파인애플, sesame oil → 참기름,
kimchi → 김치, seaweed → 김, spam → 스팸, canned tuna → 참치캔,
green onion → 대파, chili powder → 고춧가루, doenjang → 된장

[OCR 오류 교정 규칙]
  목 ↔ 묵  (어목사 → 어묵)
  탕 ↔ 땅  (볶음탕 → 볶음땅)
  보 ↔ 볶  (보음 → 볶음)
  어 ↔ 여  (여묵 → 어묵)
  알뜰어묵사 / 알부어목사 / 알보르묵사 / 알부어묵사 → "어묵"
  볶음탕 → "볶음 땅콩"
  자숙새구 → "자숙새우"

[영문 코드 → 식재료 변환 규칙]
영수증에서 자주 나오는 코드를 아래와 같이 변환한다:
  HMPIA우유 / HMP우유 / IA우유 → "우유"
  HMP암란 / HMP달걀 / 암란 → "달걀"
  HMP미니양배추 / HMP양배추 → "양배추"
  HMP다이어트닭 / HMP닭가슴살 → "닭가슴살"
  HMP베추 / HMP배추 → "배추"
  HMP미니양배추 → "양배추"
  오두기후레시햄 / 오두기햄 → "햄"
  흠플러스흑은삼품 / 흑은삼품 → "흑삼"
  GSI그라시아멜로 → "멜론"
  흑마늘 → "흑마늘"
  짜장분말 → "짜장분말"
  볶음우엉 → "우엉볶음"
  녹두돼지쪽개육 / 돼지쪽개육 → "돼지고기"
  양다리훈합닭다리 / 훈합닭다리 → "훈제닭다리"

[name 정규화 규칙]
다음을 제거한다:
- 브랜드명: CJ, 대림, 신라, 한성, 돌, 서울, 제주 삼다수, 풀무원, 오뚜기 등
- 단순 원산지: 국산, 제주산, 부산 등 (단, 한우/한돈처럼 품종·등급 의미인 경우 유지)
- 마케팅 수식어: ZERO, 클래식, 오리지널, 알뜰, 고당도, 박사, 특선 등
- 크기 등급: (대), (소), (특) 단독 표기
- 상품코드 숫자 접두어

다음은 반드시 유지한다:
- 조리/처리 상태: 냉동, 생물, 훈제, 건조, 볶음, 자숙
- 품종/등급: 한우, 한돈, 무항생제, 특란, 저지방
- 부위/종류: 국거리, 삼겹살, 가브리살, 목살 등
- 무게/부피: g, kg, ml, mL, L (name 뒤에 공백 한 칸 후 표기)

[qty 계산 규칙]
qty = 전달받은 qty × 상품명에 표시된 묶음 수량
- 묶음 단위(name에서 제거): 개입, 구, 봉, 봉지, 팩, 매, 장, 미, 송이, 입
- 무게/부피(name에 포함): g, kg, ml, mL, L

[storage 규칙]
"냉동", "냉장", "실온" 중 하나:
  냉동: 냉동 가공식품, 냉동만두, 냉동새우 등 냉동 표기 상품
  냉장: 신선 육류, 생선·어패류, 우유·유제품, 달걀, 두부, 어묵, 채소류, 김치, 유부
  실온: 라면·면류, 통조림, 과자·스낵, 생수·음료, 쌀·잡곡, 견과류, 과일, 양념류

[category_name 규칙]
반드시 아래 11개 중 하나만 출력한다:
  채소류      → 당근, 양파, 배추, 가지, 파프리카, 버섯, 콩나물 등 신선 채소
  과일류      → 사과, 바나나, 딸기, 수박, 포도, 망고 등 신선 과일
  육류        → 소고기, 돼지고기, 닭고기, 삼겹살, 베이컨, 스팸, 햄, 런천미트 등
  수산물      → 고등어, 오징어, 새우, 참치, 어묵, 김, 미역 등
  유제품·계란 → 우유, 치즈, 요거트, 버터, 달걀, 계란 등
  두부·콩류   → 두부, 순두부, 두유, 콩, 콩나물 등
  가공·즉석식품 → 라면, 즉석밥, 냉동만두, 통조림, 참치캔 등
  음료·주류   → 생수, 주스, 사이다, 콜라, 맥주, 소주, 에너지드링크 등
  양념·소스   → 간장, 고추장, 된장, 케첩, 마요네즈, 참기름, 고춧가루 등
  곡류·면류   → 쌀, 밀가루, 국수, 식빵, 오트밀, 파스타 등
  스낵·과자   → 과자, 아이스크림, 초콜릿, 젤리, 견과류 등

출력 스키마:
{{
  "items": [
    {{
      "name": "정규화된 식재료/음식명 (반드시 한국어)",
      "category_name": "11개 카테고리 중 하나",
      "qty": 1,
      "storage": "냉장 | 냉동 | 실온"
    }}
  ]
}}
JSON만 출력.
"""


def pass2_normalize(purchase_date: str, raw_items: list, fallback_date: str) -> list:
    items_json = json.dumps(raw_items, ensure_ascii=False, indent=2)

    payload = {
        "model": MODEL,
        "think": False,
        "messages": [
            {"role": "system", "content": _PASS2_PROMPT.format(items_json=items_json)},
            {"role": "user", "content": "위 상품 목록을 정규화해줘."}
        ],
        "format": "json",
        "stream": True,
        "options": {"temperature": 0, "num_predict": 2048}
    }

    raw_text = stream_llm(payload)
    result = parse_llm_json(raw_text)

    items = []
    seen = set()
    for it in result.get("items", []):
        if isinstance(it, str):
            it = {"name": it, "qty": 1, "storage": "실온"}
        if not isinstance(it, dict):
            continue

        name = (it.get("name") or "").strip()
        name = re.sub(r'^\d+\s+', '', name).strip()
        name = re.sub(r'^[\w가-힣]+\)\s*', '', name).strip()
        name = re.sub(r'^\([^)]*\)\s*', '', name).strip()
        if not name or name in seen:
            continue

        seen.add(name)

        storage = (it.get("storage") or "").strip()
        if storage not in VALID_STORAGE:
            storage = "실온"

        use_by = calculate_use_by(name, storage, purchase_date)

        VALID_CATEGORIES = {
            "채소류", "과일류", "육류", "수산물",
            "유제품·계란", "두부·콩류", "가공·즉석식품",
            "음료·주류", "양념·소스", "곡류·면류", "스낵·과자"
        }
        category_name = (it.get("category_name") or "").strip()
        if category_name not in VALID_CATEGORIES:
            category_name = None  # 유효하지 않으면 None
            
        items.append({
            "name": name,
            "category_name": category_name,   # ← 추가
            "qty": int(it.get("qty") or 1),
            "storage": storage,
            "use_by": use_by,
        })

    return items