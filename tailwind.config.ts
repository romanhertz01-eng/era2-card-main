import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lime: {
          DEFAULT: '#C6F94D',
          hi: '#B8EE38',
          soft: '#EFFCC8',
          tint: '#FAFBF4',
        },
        ink: {
          DEFAULT: '#0A0A0F',
          2: '#1A1B22',
          3: '#2A2B33',
        },
        line: {
          DEFAULT: '#ECECEF',
          2: '#E4E4E7',
          3: '#D4D4D8',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F7F7F8',
          3: '#FAFBF4',
        },
        muted: {
          DEFAULT: '#6B7280',
          2: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-unbounded)', 'var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'display-xs': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-md': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.035em' }],
        'display-lg': ['4.5rem', { lineHeight: '0.95', letterSpacing: '-0.04em' }],
        'display-xl': ['5.75rem', { lineHeight: '0.92', letterSpacing: '-0.045em' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 10, 15, 0.04), 0 4px 12px rgba(10, 10, 15, 0.04)',
        'card-hover': '0 2px 4px rgba(10, 10, 15, 0.06), 0 12px 32px rgba(10, 10, 15, 0.08)',
        'lime-glow': '0 0 0 1px rgba(198, 249, 77, 0.3), 0 8px 32px rgba(198, 249, 77, 0.35)',
        'dark-glow': '0 0 0 1px rgba(198, 249, 77, 0.15), 0 0 48px rgba(198, 249, 77, 0.2)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'grid-light':
          'radial-gradient(circle, rgba(10,10,15,0.06) 1px, transparent 1px)',
        'grid-dark':
          'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
        'lime-radial':
          'radial-gradient(circle at 50% 0%, rgba(198,249,77,0.35) 0%, transparent 55%)',
      },
      backgroundSize: {
        'grid-md': '24px 24px',
      },
      animation: {
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.04)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
