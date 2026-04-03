/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      /* ──────────────────────────────────────
         🌙  DreamStation — Finch-Style Warm Palette
         Cream base, soft pastels, cozy & playful
         ────────────────────────────────────── */
      colors: {
        // Warm cream base
        cream: {
          50:  '#FFFDF8',
          100: '#FFF9EE',
          200: '#F5E6D3',
          300: '#E8D5BC',
          400: '#D4BFA3',
        },
        // Sleep palette (kept for backward compat + dark elements)
        sleep: {
          950: '#1B2838',
          900: '#1E2D3D',
          850: '#243548',
          800: '#2A3D52',
          750: '#324A60',
          700: '#3A566E',
          650: '#43637C',
          600: '#4D718B',
          500: '#5E8AA6',
          450: '#6F9AB5',
          400: '#82ABC4',
          350: '#96BCD3',
          300: '#ABCDE1',
          250: '#C1DEEE',
          200: '#D8EEFA',
          150: '#E8F4FC',
          100: '#F0F8FE',
          50:  '#F7FBFF',
        },
        // Dream accents (warm orange/peach)
        dream: {
          glow:     '#E8956A',
          shimmer:  '#F0B89A',
          aurora:   '#D4764E',
          nebula:   '#2A3D52',
          stardust: '#FDE8D8',
          moonbeam: '#F5D5C0',
        },
        // Pastel accents
        pastel: {
          pink:     '#F4A7BB',
          mint:     '#A8D8C8',
          lavender: '#C4B5E0',
          sky:      '#A8C8E8',
          peach:    '#F5C4A1',
          yellow:   '#F5D98A',
          sage:     '#B8D4B8',
        },
        // Semantic
        success: '#7BC67E',
        warning: '#F5D98A',
        danger:  '#E88B8B',
      },
      fontFamily: {
        sans:    ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Fraunces', 'DM Sans', 'system-ui', 'serif'],
        body:    ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg': ['3.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'display-sm': ['2rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        'glass':    '18px',
        'glass-lg': '24px',
        'glass-xl': '32px',
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'glass':      '0 12px 32px rgba(8, 5, 3, 0.32)',
        'glass-md':   '0 18px 44px rgba(8, 5, 3, 0.38)',
        'glass-lg':   '0 28px 72px rgba(8, 5, 3, 0.42)',
        'glass-glow': '0 0 36px rgba(232, 149, 106, 0.18)',
        'glow-sm':    '0 0 18px rgba(232, 149, 106, 0.20)',
        'glow':       '0 0 30px rgba(232, 149, 106, 0.28)',
        'glow-lg':    '0 0 56px rgba(232, 149, 106, 0.34)',
        'inner-glow': 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
        'dream':      '0 24px 64px -24px rgba(0, 0, 0, 0.65)',
        'card':       '0 18px 48px -30px rgba(0, 0, 0, 0.7)',
        'soft':       '0 12px 28px -22px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        'glass':    '12px',
        'glass-md': '20px',
        'glass-lg': '40px',
      },
      backgroundImage: {
        'sleep-gradient':        'linear-gradient(180deg, #140E0A 0%, #1C130D 45%, #24170F 100%)',
        'sleep-gradient-radial': 'radial-gradient(ellipse at center, #2A1B11 0%, #140E0A 75%)',
        'sleep-gradient-soft':   'linear-gradient(135deg, #1A120D 0%, #231711 55%, #120C08 100%)',
        'sleep-glow':            'radial-gradient(ellipse at 50% 0%, rgba(232, 149, 106, 0.14) 0%, rgba(232, 149, 106, 0.04) 35%, transparent 72%)',
        'aurora-gradient':       'linear-gradient(135deg, #D4764E 0%, #E8956A 30%, #F0B89A 60%, #FDE8D8 100%)',
        'glass-gradient':        'linear-gradient(135deg, rgba(43, 29, 19, 0.88) 0%, rgba(27, 18, 12, 0.78) 100%)',
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'glow-pulse':  'glowPulse 3s ease-in-out infinite',
        'shimmer':     'shimmer 2.5s ease-in-out infinite',
        'fade-in':     'fadeIn 0.6s ease-out',
        'fade-in-up':  'fadeInUp 0.6s ease-out',
        'slide-in':    'slideIn 0.4s ease-out',
        'scale-in':    'scaleIn 0.3s ease-out',
        'aurora':      'aurora 8s ease-in-out infinite',
        'bounceIn':    'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'wiggle':      'wiggle 0.5s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(232, 149, 106, 0.15)' },
          '50%':      { boxShadow: '0 0 30px rgba(232, 149, 106, 0.30)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-10px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        bounceIn: {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '50%':  { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%':      { transform: 'rotate(-5deg)' },
          '75%':      { transform: 'rotate(5deg)' },
        },
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
