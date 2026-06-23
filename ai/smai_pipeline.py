# import requests, base64, json, re, cv2
# import numpy as np
# from json_repair import repair_json
# from datetime import date, datetime, timedelta
# from pathlib import Path
# from collections import Counter

# try:
#     from PIL import Image, ExifTags
#     PIL_AVAILABLE = True
# except ImportError:
#     PIL_AVAILABLE = False

# try:
#     from ultralytics import YOLO
#     YOLO_AVAILABLE = True
# except ImportError:
#     YOLO_AVAILABLE = False
#     print("[경고] ultralytics 미설치 — YOLO 건너뜀")

# OLLAMA_URL = "https://ollama.aikopo.net"
# MODEL = "gemma4:26b"
# YOLO_MODEL_PATH = "smai_v1.pt"

# _yolo_model = None


# def _get_yolo():
#     global _yolo_model
#     if _yolo_model is None and YOLO_AVAILABLE:
#         model_path = Path(YOLO_MODEL_PATH)
#         if not model_path.exists():
#             alt = Path(__file__).parent / YOLO_MODEL_PATH
#             if alt.exists():
#                 model_path = alt
#         if model_path.exists():
#             _yolo_model = YOLO(str(model_path))
#             print(f"[YOLO] 모델 로드: {model_path}")
#         else:
#             print(f"[YOLO] 모델 파일 없음: {YOLO_MODEL_PATH}")
#     return _yolo_model


# def yolo_detect_ingredients(img: np.ndarray,
#                              conf_threshold: float = 0.6) -> list | None:
#     model = _get_yolo()
#     if model is None:
#         return None

#     results = model(img, conf=conf_threshold, verbose=False)
#     if not results or len(results[0].boxes) == 0:
#         print("[YOLO] 식재료 미감지 → 영수증 OCR로 전환")
#         return None

#     boxes = results[0].boxes
#     names = model.names

#     class_counts: Counter = Counter()
#     for cls_id in boxes.cls.tolist():
#         label = names.get(int(cls_id), f"class_{int(cls_id)}")
#         class_counts[label] += 1

#     items = [{"name": label, "qty": count}
#              for label, count in class_counts.items()]

#     print(f"[YOLO] 식재료 감지: {items}")
#     return items


# def _add_days(base_date_str: str, days: int) -> str:
#     base = datetime.strptime(base_date_str, "%Y-%m-%d")
#     return (base + timedelta(days=days)).strftime("%Y-%m-%d")


# def fix_exif_rotation(img_path: str) -> np.ndarray:
#     if not PIL_AVAILABLE:
#         return cv2.imread(img_path)
#     try:
#         pil_img = Image.open(img_path)
#         exif = pil_img._getexif()
#         if exif:
#             orientation_key = next(
#                 (k for k, v in ExifTags.TAGS.items() if v == "Orientation"), None
#             )
#             orientation = exif.get(orientation_key, 1) if orientation_key else 1
#             rotate_map = {3: 180, 6: 270, 8: 90}
#             angle = rotate_map.get(orientation, 0)
#             if angle:
#                 pil_img = pil_img.rotate(angle, expand=True)
#         return cv2.cvtColor(np.array(pil_img.convert("RGB")), cv2.COLOR_RGB2BGR)
#     except Exception:
#         return cv2.imread(img_path)


# def preprocess_for_ocr(img: np.ndarray) -> np.ndarray:
#     lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
#     l, a, b = cv2.split(lab)
#     clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
#     l = clahe.apply(l)
#     img = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
#     kernel = np.array([[0, -1, 0], [-1, 5, -1], [0, -1, 0]])
#     return cv2.filter2D(img, -1, kernel)


# def encode_image(img: np.ndarray, max_width: int = 1000) -> str:
#     h, w = img.shape[:2]
#     if w > max_width:
#         scale = max_width / w
#         img = cv2.resize(img, (int(w * scale), int(h * scale)),
#                          interpolation=cv2.INTER_AREA)
#     _, buf = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 85])
#     return base64.b64encode(buf).decode("utf-8")


# VALID_STORAGE = {"냉장", "냉동", "실온"}
# DATE_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$')


# def is_valid_date(s: str) -> bool:
#     if not DATE_RE.match(s):
#         return False
#     try:
#         datetime.strptime(s, "%Y-%m-%d")
#         return True
#     except ValueError:
#         return False


# def _wrap(parsed):
#     if isinstance(parsed, list):
#         return {"items": parsed}
#     return parsed


# def _try_parse(text: str):
#     try:
#         return _wrap(json.loads(text))
#     except json.JSONDecodeError:
#         pass
#     try:
#         return _wrap(json.loads(repair_json(text)))
#     except Exception:
#         pass
#     return None


# def parse_llm_json(text: str) -> dict:
#     result = _try_parse(text)
#     if result is not None:
#         return result
#     for start_char in ['{', '[']:
#         idx = text.rfind(start_char)
#         if idx != -1:
#             result = _try_parse(text[idx:])
#             if result is not None:
#                 return result
#     print("[경고] JSON 파싱 실패")
#     print("[RAW]", text[:300])
#     return {"items": []}


# def stream_llm(payload: dict) -> str:
#     resp = requests.post(f"{OLLAMA_URL}/api/chat",
#                          json=payload, stream=True, timeout=300)
#     resp.raise_for_status()
#     content_buf = ""
#     thinking_buf = ""
#     for line in resp.iter_lines():
#         if line:
#             chunk = json.loads(line)
#             msg = chunk.get("message", {})
#             content_buf += msg.get("content", "")
#             thinking_buf += msg.get("thinking", "")
#             if chunk.get("done"):
#                 break
#     return content_buf.strip() if content_buf.strip() else thinking_buf


# PASS1_PROMPT = """너는 한국 영수증 OCR 전문가다. 생각하지 말고 바로 JSON만 출력해라.

# 할 일은 딱 두 가지다:
# 1. 영수증에서 구매/판매 날짜를 찾아 YYYY-MM-DD 형식으로 변환
# 2. 상품명과 수량을 영수증에 인쇄된 그대로 읽어서 출력 (절대 수정하거나 해석하지 말 것)

# [날짜 변환]
# - "2026-04-22 11:45"  → "2026-04-22"
# - "26-04-12 15:41"    → "2026-04-12"  (YY → 20YY)
# - "2026/04/22"        → "2026-04-22"
# - 날짜 없으면 "unknown"

# [영수증 형식]
# 상품명과 가격이 다른 줄에 있는 경우 두 줄을 하나로 묶어서 처리:
#   "002173  자몽에이드"
#   "7,500   1개   0   7,500"
#   → name: "자몽에이드", qty: 1

# [주의]
# - 상품명은 보이는 글자 그대로 출력 (수정·번역·해석 금지)
# - 합계/부가세/카드정보/면세/할인 제외
# - qty는 영수증의 구매 수량 숫자만 (묶음 계산 하지 말 것)

# 출력 스키마:
# {
#   "purchase_date": "YYYY-MM-DD 또는 unknown",
#   "items": [
#     {"name": "영수증 원문 그대로", "qty": 1}
#   ]
# }
# JSON만 출력.
# """


# def pass1_ocr(img: np.ndarray, fallback_date: str) -> dict:
#     img_b64 = encode_image(img, max_width=1200)

#     payload = {
#         "model": MODEL,
#         "think": False,
#         "messages": [
#             {"role": "system", "content": PASS1_PROMPT},
#             {
#                 "role": "user",
#                 "content": "이 영수증의 날짜와 상품 목록을 원문 그대로 읽어줘.",
#                 "images": [img_b64]
#             }
#         ],
#         "format": "json",
#         "stream": True,
#         "options": {"temperature": 0, "num_predict": 2048}
#     }

#     raw_text = stream_llm(payload)
#     result = parse_llm_json(raw_text)

#     purchase_date = (result.get("purchase_date") or "").strip()
#     if purchase_date == "unknown" or not is_valid_date(purchase_date):
#         purchase_date = fallback_date

#     items = []
#     for it in result.get("items", []):
#         if isinstance(it, str):
#             it = {"name": it, "qty": 1}
#         if not isinstance(it, dict):
#             continue
#         name = (it.get("name") or "").strip()
#         if not name:
#             continue
#         items.append({"name": name, "qty": int(it.get("qty") or 1)})

#     return {"purchase_date": purchase_date, "items": items}


# def build_pass2_prompt(purchase_date: str, items_json: str) -> str:
#     return f"""너는 한국 식재료 정보 처리 전문가다. 생각하지 말고 바로 JSON만 출력해라.
# 이미지는 없다. 아래 텍스트 데이터만 처리한다.

# 구매일: {purchase_date}

# 처리할 상품 목록:
# {items_json}

# [영어 식재료 번역 규칙]
# 영어로 된 식재료명은 반드시 한국어로 번역한다:
# apple → 사과, potato → 감자, egg → 달걀, tofu → 두부,
# carrot → 당근, onion → 양파, milk → 우유, banana → 바나나,
# strawberry → 딸기, watermelon → 수박, orange → 오렌지,
# peach → 복숭아, pear → 배, mango → 망고, kiwi → 키위,
# cherry → 체리, pineapple → 파인애플, sesame oil → 참기름,
# kimchi → 김치, seaweed → 김, spam → 스팸, canned tuna → 참치캔,
# green onion → 대파, chili powder → 고춧가루, doenjang → 된장

# [OCR 오류 교정 규칙]
#   목 ↔ 묵  (어목사 → 어묵)
#   탕 ↔ 땅  (볶음탕 → 볶음땅)
#   보 ↔ 볶  (보음 → 볶음)
#   어 ↔ 여  (여묵 → 어묵)
#   알뜰어묵사 / 알부어목사 / 알보르묵사 / 알부어묵사 → "어묵"
#   볶음탕 → "볶음 땅콩"
#   자숙새구 → "자숙새우"

# [name 정규화 규칙]
# 다음을 제거한다:
# - 브랜드명: CJ, 대림, 신라, 한성, 돌, 서울, 제주 삼다수, 풀무원, 오뚜기 등
# - 단순 원산지: 국산, 제주산, 부산 등 (단, 한우/한돈처럼 품종·등급 의미인 경우 유지)
# - 마케팅 수식어: ZERO, 클래식, 오리지널, 알뜰, 고당도, 박사, 특선 등
# - 크기 등급: (대), (소), (특) 단독 표기
# - 상품코드 숫자 접두어

# 다음은 반드시 유지한다:
# - 조리/처리 상태: 냉동, 생물, 훈제, 건조, 볶음, 자숙
# - 품종/등급: 한우, 한돈, 무항생제, 특란, 저지방
# - 부위/종류: 국거리, 삼겹살, 가브리살, 목살 등
# - 무게/부피: g, kg, ml, mL, L (name 뒤에 공백 한 칸 후 표기)

# [qty 계산 규칙]
# qty = 전달받은 qty × 상품명에 표시된 묶음 수량
# - 묶음 단위(name에서 제거): 개입, 구, 봉, 봉지, 팩, 매, 장, 미, 송이, 입
# - 무게/부피(name에 포함): g, kg, ml, mL, L

# [storage 규칙]
# "냉동", "냉장", "실온" 중 하나:
#   냉동: 냉동 가공식품, 냉동만두, 냉동새우 등 냉동 표기 상품
#   냉장: 신선 육류, 생선·어패류, 우유·유제품, 달걀, 두부, 어묵, 채소류, 김치, 유부
#   실온: 라면·면류, 통조림, 과자·스낵, 생수·음료, 쌀·잡곡, 견과류, 과일, 양념류

# [use_by 계산 규칙]
# 구매일({purchase_date}) 기준으로 더해서 YYYY-MM-DD 출력:
#   냉동: 냉동 육류/어패류 +90일 / 냉동 가공식품 +60일
#   냉장: 신선 육류 +3일 / 생선 +2일 / 달걀 +30일 / 우유 +14일
#         두부 +7일 / 어묵 +7일 / 잎채소 +4일 / 콩나물 +3일
#         김치 +90일 / 유부·가공 +7일 / 호박 +5일
#   실온: 라면 +180일 / 통조림 +365일 / 과자·스낵 +90일
#         음료·생수 +180일 / 견과류 +90일 / 과일 +7일 / 쌀 +180일

# 출력 스키마:
# {{
#   "items": [
#     {{
#       "name": "정규화된 식재료/음식명 (반드시 한국어)",
#       "qty": 1,
#       "storage": "냉장 | 냉동 | 실온",
#       "use_by": "YYYY-MM-DD"
#     }}
#   ]
# }}
# JSON만 출력.
# """


# def pass2_normalize(purchase_date: str, raw_items: list, fallback_date: str) -> list:
#     items_json = json.dumps(raw_items, ensure_ascii=False, indent=2)

#     payload = {
#         "model": MODEL,
#         "think": False,
#         "messages": [
#             {"role": "system", "content": build_pass2_prompt(purchase_date, items_json)},
#             {"role": "user", "content": "위 상품 목록을 정규화해줘."}
#         ],
#         "format": "json",
#         "stream": True,
#         "options": {"temperature": 0, "num_predict": 2048}
#     }

#     raw_text = stream_llm(payload)
#     result = parse_llm_json(raw_text)

#     items = []
#     seen = set()
#     for it in result.get("items", []):
#         if isinstance(it, str):
#             it = {"name": it, "qty": 1, "storage": "실온", "use_by": purchase_date}
#         if not isinstance(it, dict):
#             continue

#         name = (it.get("name") or "").strip()
#         name = re.sub(r'^\d+\s+', '', name).strip()
#         name = re.sub(r'^[\w가-힣]+\)\s*', '', name).strip()
#         name = re.sub(r'^\([^)]*\)\s*', '', name).strip()
#         if not name:
#             continue
#         if name in seen:
#             continue
#         seen.add(name)

#         storage = (it.get("storage") or "").strip()
#         if storage not in VALID_STORAGE:
#             storage = "실온"

#         use_by = (it.get("use_by") or "").strip()
#         if not is_valid_date(use_by):
#             use_by = purchase_date

#         items.append({
#             "name": name,
#             "qty": int(it.get("qty") or 1),
#             "storage": storage,
#             "use_by": use_by
#         })
#     return items


# def process_image(img_path: str, mode: str = 'food') -> dict:
#     fallback_date = date.today().strftime("%Y-%m-%d")
#     img = fix_exif_rotation(img_path)

#     # ── 식재료 모드: YOLO만 실행, 실패 시 빈 결과 반환 ──
#     if mode == 'food':
#         print("[식재료 모드] YOLO 식재료 감지 시도...")
#         yolo_raw = yolo_detect_ingredients(img)

#         if yolo_raw:
#             print("[YOLO] 감지 성공 → Pass2 정규화 중...")
#             items = pass2_normalize(fallback_date, yolo_raw, fallback_date)
#             return {
#                 "source": "yolo",
#                 "purchase_date": fallback_date,
#                 "items": items
#             }
#         else:
#             # OCR로 넘어가지 않고 빈 결과 반환
#             print("[식재료 모드] YOLO 미감지 → 결과 없음")
#             return {
#                 "source": "yolo",
#                 "purchase_date": fallback_date,
#                 "items": []
#             }

#     # ── 영수증 모드: OCR만 실행, YOLO 없음 ──
#     else:
#         print("[영수증 모드] YOLO 건너뜀 → OCR 시작")
#         img_ocr = preprocess_for_ocr(img)

#         print("[1pass] OCR 중...")
#         pass1 = pass1_ocr(img_ocr, fallback_date)
#         purchase_date = pass1["purchase_date"]
#         raw_items = pass1["items"]
#         print(f"  구매일: {purchase_date}")
#         print(f"  원문 상품 수: {len(raw_items)}개")

#         if not raw_items:
#             return {"source": "receipt_ocr", "purchase_date": purchase_date, "items": []}

#         print("[2pass] 정규화 중...")
#         items = pass2_normalize(purchase_date, raw_items, fallback_date)
#         print(f"  정규화 완료: {len(items)}개")

#         return {
#             "source": "receipt_ocr",
#             "purchase_date": purchase_date,
#             "items": items
#         }


# if __name__ == "__main__":
#     import sys
#     img_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/input/receipt9.jpg"
#     mode = sys.argv[2] if len(sys.argv) > 2 else "food"
#     result = process_image(img_path, mode=mode)
#     print(json.dumps(result, ensure_ascii=False, indent=2))