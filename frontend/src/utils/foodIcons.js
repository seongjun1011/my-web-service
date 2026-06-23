import radish from '../assets/icons/foods/radish.svg';
import persimmon from '../assets/icons/foods/persimmon.svg';
import tofu from '../assets/icons/foods/tofu.svg';
import celery from '../assets/icons/foods/celery.svg';
import doenjang from '../assets/icons/foods/doenjang.svg';
import gochujang from '../assets/icons/foods/gochujang.svg';
import ssamjang from '../assets/icons/foods/ssamjang.svg';
import sesameOil from '../assets/icons/foods/sesame-oil.svg';
import perillaOil from '../assets/icons/foods/perilla-oil.svg';
import cookingOil from '../assets/icons/foods/cooking-oil.svg';
import oliveOil from '../assets/icons/foods/olive-oil.svg';
import pepper from '../assets/icons/foods/pepper.svg';
import mayo from '../assets/icons/foods/mayo.svg';
import mustard from '../assets/icons/foods/mustard.svg';
import oysterSauce from '../assets/icons/foods/oyster-sauce.svg';
import vinegar from '../assets/icons/foods/vinegar.svg';
import mirin from '../assets/icons/foods/mirin.svg';
import cookingWine from '../assets/icons/foods/cooking-wine.svg';
import jeotgal from '../assets/icons/foods/jeotgal.svg';
import pickle from '../assets/icons/foods/pickle.svg';

// 유니코드에 전용 이모지가 없어 다른 식재료와 뭉뚱그려지던 항목만 커스텀 아이콘으로 대체한다.
// (예: 무/셀러리/양배추가 전부 🥬, 된장~장아찌까지 양념 16종이 전부 🫙로 표시되던 문제)
const CUSTOM_FOOD_ICONS = [
  ['순두부', tofu],
  ['연두부', tofu],
  ['두부', tofu],
  ['셀러리', celery],
  ['된장', doenjang],
  ['고추장', gochujang],
  ['쌈장', ssamjang],
  ['참기름', sesameOil],
  ['들기름', perillaOil],
  ['식용유', cookingOil],
  ['올리브유', oliveOil],
  ['후추', pepper],
  ['마요네즈', mayo],
  ['머스타드', mustard],
  ['굴소스', oysterSauce],
  ['식초', vinegar],
  ['미림', mirin],
  ['맛술', cookingWine],
  ['젓갈', jeotgal],
  ['장아찌', pickle],
];

// 한 글자 키워드는 부분일치만으로는 위험하다 — "무"는 무항생제/무첨가/무가당/무화과처럼
// "~없는"을 뜻하는 접두어로도 흔히 쓰이고, "감"도 감자/감귤 안에 그대로 들어있다.
// 그래서 단어의 시작(뒤에 다른 한글 음절이 안 붙을 때)이거나 끝일 때만 인정한다.
const SINGLE_CHAR_FOOD_ICONS = [
  ['무', radish],
  ['감', persimmon],
];

const isHangulSyllable = (ch) => !!ch && ch >= '가' && ch <= '힣';

function matchesAsWholeWord(base, keyword) {
  const idx = base.indexOf(keyword);
  if (idx === -1) return false;
  const endIdx = idx + keyword.length;
  const isSuffix = endIdx === base.length;
  const isCleanPrefix = idx === 0 && !isHangulSyllable(base[endIdx]);
  return isSuffix || isCleanPrefix;
}

export function getCustomFoodIcon(name) {
  const base = (name || '').split('(')[0].trim();
  if (!base) return null;

  const multiChar = CUSTOM_FOOD_ICONS.find(([keyword]) => base.includes(keyword));
  if (multiChar) return multiChar[1];

  const singleChar = SINGLE_CHAR_FOOD_ICONS.find(([keyword]) => matchesAsWholeWord(base, keyword));
  return singleChar ? singleChar[1] : null;
}
