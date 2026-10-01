import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          cyan: '#06b6d4',
          violet: '#7c3aed',
          fuchsia: '#d946ef',
        },
      },
      fontFamily: {
        heading: ['var(--font-unbounded)', 'system-ui', 'sans-serif'],
        body: ['var(--font-manrope)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        bento: '1.5rem',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(124, 58, 237, 0.5)',
        'glow-cyan': '0 0 40px -8px rgba(6, 182, 212, 0.5)',
        bento: '0 8px 32px -12px rgba(15, 23, 42, 0.18)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #06b6d4 0%, #7c3aed 50%, #d946ef 100%)',
      },
      keyframes: {
        aurora1: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(60px, 40px) scale(1.15)' },
        },
        aurora2: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1.1)' },
          '50%': { transform: 'translate(-70px, -30px) scale(0.95)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.35)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        aurora1: 'aurora1 14s ease-in-out infinite',
        aurora2: 'aurora2 18s ease-in-out infinite',
        marquee: 'marquee 30s linear infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
