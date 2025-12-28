const foodEmojis = [
  '🍎', '🍊', '🥕', '🥬', '🍋', '🥛', '🍅', '🥒', '🍇', '🧀',
  '🥚', '🍞', '🥦', '🌽', '🍌', '🥑', '🍓', '🧅', '🥖', '🍳'
];

const emojiPositions = [
  { top: '5%', left: '8%', rotate: 15, size: 'text-3xl', delay: 0 },
  { top: '12%', left: '85%', rotate: -20, size: 'text-2xl', delay: 1 },
  { top: '25%', left: '3%', rotate: 25, size: 'text-2xl', delay: 2 },
  { top: '18%', left: '45%', rotate: -10, size: 'text-xl', delay: 3 },
  { top: '35%', left: '92%', rotate: 30, size: 'text-3xl', delay: 4 },
  { top: '45%', left: '7%', rotate: -25, size: 'text-2xl', delay: 0 },
  { top: '55%', left: '88%', rotate: 15, size: 'text-xl', delay: 1 },
  { top: '65%', left: '15%', rotate: -15, size: 'text-3xl', delay: 2 },
  { top: '72%', left: '78%', rotate: 20, size: 'text-2xl', delay: 3 },
  { top: '82%', left: '5%', rotate: -30, size: 'text-2xl', delay: 4 },
  { top: '88%', left: '55%', rotate: 10, size: 'text-xl', delay: 0 },
  { top: '8%', left: '65%', rotate: -20, size: 'text-xl', delay: 1 },
  { top: '40%', left: '50%', rotate: 35, size: 'text-lg', delay: 2 },
  { top: '60%', left: '35%', rotate: -5, size: 'text-lg', delay: 3 },
  { top: '78%', left: '90%', rotate: 25, size: 'text-2xl', delay: 4 },
  { top: '92%', left: '25%', rotate: -15, size: 'text-xl', delay: 0 },
  { top: '30%', left: '70%', rotate: 12, size: 'text-lg', delay: 1 },
  { top: '50%', left: '25%', rotate: -22, size: 'text-lg', delay: 2 },
];

export const FoodBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {emojiPositions.map((pos, index) => (
        <span
          key={index}
          className={`absolute ${pos.size} opacity-20 select-none animate-float`}
          style={{
            top: pos.top,
            left: pos.left,
            transform: `rotate(${pos.rotate}deg)`,
            animationDelay: `${pos.delay}s`,
          }}
        >
          {foodEmojis[index % foodEmojis.length]}
        </span>
      ))}
    </div>
  );
};
