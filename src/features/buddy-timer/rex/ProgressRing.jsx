import { motion } from 'framer-motion';

export default function ProgressRing({ timeLeft, totalTime, themeColor, size = 220, strokeWidth = 12, children }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  const strokeDashoffset = circumference * (1 - progress);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isUrgent = timeLeft <= 10 && timeLeft > 0;
  const isImpatient = timeLeft === 0;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isImpatient ? undefined : 'rgba(232, 220, 200, 0.3)'}
          strokeWidth={strokeWidth}
          className={isImpatient ? 'ring-impatient' : ''}
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isImpatient ? '#FF9800' : themeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'linear' }}
          style={{ filter: isUrgent ? 'url(#glow)' : 'none' }}
          className={isImpatient ? 'ring-impatient' : ''}
        />
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
        {children}
        <motion.span
          className="font-display text-2xl font-bold leading-none"
          style={{ color: isImpatient ? '#FF9800' : themeColor }}
          animate={isUrgent ? { scale: [1, 1.1, 1], transition: { duration: 0.5, repeat: Infinity } } : { scale: 1 }}
        >
          {timeDisplay}
        </motion.span>
        {isImpatient && (
          <motion.span
            className="text-xs font-semibold text-muted-foreground mt-0.5"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Time's up!
          </motion.span>
        )}
      </div>
    </div>
  );
}
