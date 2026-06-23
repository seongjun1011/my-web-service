import { getCustomFoodIcon } from '../utils/foodIcons';

// 식재료명에 커스텀 아이콘이 매칭되면 이미지로, 아니면 기존 이모지 문자를 그대로 보여준다.
export default function FoodIcon({ name, emoji, size = 24, className = '' }) {
  const icon = getCustomFoodIcon(name);
  if (icon) {
    return (
      <img
        src={icon}
        alt={name || ''}
        className={className}
        style={{ width: size, height: size, display: 'inline-block', objectFit: 'contain' }}
      />
    );
  }
  return <span className={className}>{emoji || '📦'}</span>;
}
