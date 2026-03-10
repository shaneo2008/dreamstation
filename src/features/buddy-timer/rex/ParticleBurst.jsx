const PARTICLES = [
  { type: 'star',   tx: '-45px', ty: '-55px', rot: '45deg',   size: 6,  delay: '0ms',   color: '#FFD700' },
  { type: 'circle', tx: '40px',  ty: '-60px', rot: '-30deg',  size: 5,  delay: '30ms',  color: '#FF6B6B' },
  { type: 'star',   tx: '-30px', ty: '35px',  rot: '120deg',  size: 5,  delay: '60ms',  color: '#7BC74D' },
  { type: 'circle', tx: '50px',  ty: '25px',  rot: '-60deg',  size: 4,  delay: '20ms',  color: '#5BC0EB' },
  { type: 'star',   tx: '10px',  ty: '-70px', rot: '90deg',   size: 7,  delay: '40ms',  color: '#FFB347' },
  { type: 'circle', tx: '-55px', ty: '10px',  rot: '150deg',  size: 4,  delay: '50ms',  color: '#9B8FE8' },
];

function StarShape({ cx, cy, size, fill }) {
  const points = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI / 5);
    const innerAngle = outerAngle + Math.PI / 5;
    points.push(`${cx + size * Math.cos(outerAngle)},${cy - size * Math.sin(outerAngle)}`);
    points.push(`${cx + (size * 0.4) * Math.cos(innerAngle)},${cy - (size * 0.4) * Math.sin(innerAngle)}`);
  }
  return <polygon points={points.join(' ')} fill={fill} />;
}

export default function ParticleBurst({ active, themeColor }) {
  if (!active) return null;

  return (
    <svg
      viewBox="-80 -80 160 160"
      width="160"
      height="160"
      className="absolute pointer-events-none"
      style={{ top: '45%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}
    >
      {PARTICLES.map((p, i) => (
        <g
          key={i}
          className="particle"
          style={{ '--tx': p.tx, '--ty': p.ty, '--rot': p.rot, animationDelay: p.delay }}
        >
          {p.type === 'circle' ? (
            <circle cx={0} cy={0} r={p.size} fill={themeColor || p.color} />
          ) : (
            <StarShape cx={0} cy={0} size={p.size} fill={themeColor || p.color} />
          )}
        </g>
      ))}
    </svg>
  );
}
