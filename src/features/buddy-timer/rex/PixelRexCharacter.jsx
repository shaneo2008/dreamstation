import { useEffect, useState } from 'react';

const LARGE_CHARACTERS = ['rex', 'snapper', 'snoozy', 'masha', 'hoppy', 'stella', 'flutty'];
const SMALL_CHARACTERS = ['zen', 'sparky', 'luna', 'buddy', 'finn'];

const CHARACTER_SIZE_MULTIPLIERS = {
  hoppy: 1.2, snoozy: 1.2, luna: 1.3, buddy: 1.2,
  rex: 1.3, snapper: 1.3, masha: 1.2, stella: 1.2, flutty: 1.2,
};

export default function PixelRexCharacter({ state, eatPhase = 'none', className = '', size = 120, characterId = 'rex' }) {
  const [currentAnim, setCurrentAnim] = useState('idle');
  const [isChomping, setIsChomping] = useState(false);

  const isLarge = LARGE_CHARACTERS.includes(characterId);
  const SPRITE_FRAME_SIZE = isLarge ? 128 : 64;
  const FRAME_COUNT = isLarge ? 4 : 16;
  const SPRITE_WIDTH = SPRITE_FRAME_SIZE * FRAME_COUNT;
  const ANIM_DURATION = isLarge ? 0.8 : 1.6;

  useEffect(() => {
    if (state !== 'eating' && isChomping) {
      setIsChomping(false);
    }
    if (state === 'celebrating') {
      setCurrentAnim('celebrate');
    } else if (state === 'eating' && (eatPhase === 'jaw-open' || eatPhase === 'chomp') && !isChomping) {
      setIsChomping(true);
      setCurrentAnim('chomp');
      const t = setTimeout(() => {
        setIsChomping(false);
        setCurrentAnim((prev) => (prev === 'chomp' ? 'idle' : prev));
      }, 800);
      return () => clearTimeout(t);
    } else if (state === 'bored' || state === 'hungry') {
      setCurrentAnim('bored');
    } else if (state === 'idle') {
      setCurrentAnim('idle');
    }
  }, [state, eatPhase, isChomping]);

  const scale = (size / SPRITE_FRAME_SIZE) * (CHARACTER_SIZE_MULTIPLIERS[characterId] || 1);

  const animStyles = {
    idle:      { backgroundImage: `url('/${characterId}-idle.png')` },
    bored:     { backgroundImage: `url('/${characterId}-bored.png')` },
    chomp:     { backgroundImage: `url('/${characterId}-chomp.png')` },
    celebrate: { backgroundImage: `url('/${characterId}-celebrate.png')` },
  };

  return (
    <div
      className={className}
      style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <div
        style={{
          width: SPRITE_FRAME_SIZE,
          height: SPRITE_FRAME_SIZE,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
          willChange: 'transform',
          imageRendering: 'pixelated',
          backgroundRepeat: 'no-repeat',
          backgroundSize: `${SPRITE_WIDTH}px ${SPRITE_FRAME_SIZE}px`,
          animation: `pixel-${currentAnim}-${characterId} ${ANIM_DURATION}s steps(${FRAME_COUNT}) ${currentAnim === 'chomp' ? 'forwards' : 'infinite'}`,
          ...animStyles[currentAnim],
        }}
      />
      <style>{`
        @keyframes pixel-idle-${characterId} {
          from { background-position: 0 0; }
          to   { background-position: -${SPRITE_WIDTH}px 0; }
        }
        @keyframes pixel-bored-${characterId} {
          from { background-position: 0 0; }
          to   { background-position: -${SPRITE_WIDTH}px 0; }
        }
        @keyframes pixel-chomp-${characterId} {
          from { background-position: 0 0; }
          to   { background-position: -${SPRITE_WIDTH}px 0; }
        }
        @keyframes pixel-celebrate-${characterId} {
          from { background-position: 0 0; }
          to   { background-position: -${SPRITE_WIDTH}px 0; }
        }
      `}</style>
    </div>
  );
}
