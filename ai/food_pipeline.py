import os, numpy as np
from datetime import date
from pathlib import Path
from collections import Counter

from pipeline_common import fix_exif_rotation, pass2_normalize

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("[경고] ultralytics 미설치 — YOLO 건너뜀")

YOLO_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "smai_v1.pt")

_yolo_model = None


def _get_yolo():
    global _yolo_model
    if _yolo_model is None and YOLO_AVAILABLE:
        model_path = Path(YOLO_MODEL_PATH)
        if not model_path.exists():
            alt = Path(__file__).parent / YOLO_MODEL_PATH
            if alt.exists():
                model_path = alt
        if model_path.exists():
            _yolo_model = YOLO(str(model_path))
            print(f"[YOLO] 모델 로드: {model_path}")
        else:
            print(f"[YOLO] 모델 파일 없음: {YOLO_MODEL_PATH}")
    return _yolo_model


def _yolo_detect(img: np.ndarray, conf_threshold: float = 0.6) -> list | None:
    model = _get_yolo()
    if model is None:
        return None

    results = model(img, conf=conf_threshold, verbose=False)
    if not results or len(results[0].boxes) == 0:
        print("[YOLO] 식재료 미감지")
        return None

    boxes = results[0].boxes
    names = model.names

    class_counts: Counter = Counter()
    for cls_id in boxes.cls.tolist():
        label = names.get(int(cls_id), f"class_{int(cls_id)}")
        class_counts[label] += 1

    items = [{"name": label, "qty": count}
             for label, count in class_counts.items()]
    print(f"[YOLO] 식재료 감지: {items}")
    return items


def process_food_image(img_path: str) -> dict:
    fallback_date = date.today().strftime("%Y-%m-%d")
    img = fix_exif_rotation(img_path)

    print("[식재료 모드] YOLO 식재료 감지 시도...")
    yolo_raw = _yolo_detect(img)

    if not yolo_raw:
        print("[식재료 모드] YOLO 미감지 → 결과 없음")
        return {
            "source": "yolo",
            "purchase_date": fallback_date,
            "items": []
        }

    print("[YOLO] 감지 성공 → Pass2 정규화 중...")
    items = pass2_normalize(fallback_date, yolo_raw, fallback_date)
    return {
        "source": "yolo",
        "purchase_date": fallback_date,
        "items": items
    }


if __name__ == "__main__":
    import sys, json
    img_path = sys.argv[1] if len(sys.argv) > 1 else "input.jpg"
    result = process_food_image(img_path)
    print(json.dumps(result, ensure_ascii=False, indent=2))
