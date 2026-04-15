/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan:   '#00f5ff',
          pink:   '#ff006e',
          purple: '#8b00ff',
          green:  '#00ff88',
          gold:   '#ffd700',
          orange: '#ff4500',
        },
        game: {
          bg:     '#0a0014',
          panel:  '#12002a',
          card:   '#1a003a',
          border: '#3d00a0',
        }
      },
      fontFamily: {
        arcade: ['"Press Start 2P"', 'monospace'],
        game:   ['"Rajdhani"', 'sans-serif'],
      },
      boxShadow: {
        neon:       '0 0 20px rgba(0,245,255,0.6)',
        'neon-pink':'0 0 20px rgba(255,0,110,0.6)',
        glow:       '0 0 40px rgba(139,0,255,0.4)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.5s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
        'spin-slow':  'spin 4s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.7', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
