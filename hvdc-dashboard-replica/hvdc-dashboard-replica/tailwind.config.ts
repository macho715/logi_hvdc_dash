import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './pages/**/*.{ts,tsx,js,jsx,mdx}',
    './components/**/*.{ts,tsx,js,jsx,mdx}',
    './lib/**/*.{ts,tsx,js,jsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        hud: {
          bg: '#050A18',
          panel: '#0E1427',
          panelAlt: '#10192E',
          panelWarm: '#221623',
          panelHot: '#2B1721',
          line: '#1D2744',
          lineStrong: '#243256',
          text: '#F2F5FF',
          textSoft: '#C7D0E8',
          textMuted: '#7C89A8',
          blue: '#2F76FF',
          blueSoft: '#4F8EFF',
          teal: '#58E1C9',
          tealSoft: '#71EED7',
          amber: '#F5C366',
          amberSoft: '#FFC56E',
          violet: '#8A58FF',
          violetSoft: '#AB7CFF',
          orange: '#FF9157',
          red: '#FF6E63',
        },
      },
      fontSize: {
        'hud-2xs': ['11px', { lineHeight: '14px', letterSpacing: '0.02em' }],
        'hud-xs': ['12px', { lineHeight: '16px', letterSpacing: '0.015em' }],
        'hud-sm': ['13px', { lineHeight: '18px', letterSpacing: '0.01em' }],
        'hud-md': ['16px', { lineHeight: '22px', letterSpacing: '-0.01em' }],
        'hud-lg': ['20px', { lineHeight: '26px', letterSpacing: '-0.015em' }],
        'hud-xl': ['30px', { lineHeight: '34px', letterSpacing: '-0.03em' }],
        'hud-2xl': ['44px', { lineHeight: '48px', letterSpacing: '-0.04em' }],
      },
      borderRadius: {
        hud: '24px',
        'hud-lg': '28px',
      },
      boxShadow: {
        hud: '0 18px 60px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.05)',
        panel: '0 10px 32px rgba(0,0,0,.32), inset 0 1px 0 rgba(255,255,255,.04)',
        'glow-blue': '0 0 0 1px rgba(47,118,255,.25), 0 0 26px rgba(47,118,255,.22)',
        'glow-teal': '0 0 0 1px rgba(88,225,201,.22), 0 0 26px rgba(88,225,201,.18)',
        'glow-amber': '0 0 0 1px rgba(245,195,102,.24), 0 0 26px rgba(245,195,102,.18)',
      },
      backgroundImage: {
        'hud-shell':
          'radial-gradient(1000px 500px at 35% -10%, rgba(39,81,203,.18), transparent 55%), radial-gradient(700px 360px at 82% 18%, rgba(167,73,125,.12), transparent 60%), linear-gradient(180deg, #060B19 0%, #040915 100%)',
        'hud-card':
          'radial-gradient(120% 150% at 0% 0%, rgba(66,107,241,.18), transparent 55%), linear-gradient(180deg, rgba(17,24,46,.94) 0%, rgba(11,17,31,.96) 100%)',
        'hud-card-hot':
          'radial-gradient(120% 170% at 50% 0%, rgba(165,72,60,.32), transparent 58%), linear-gradient(180deg, rgba(39,24,32,.94) 0%, rgba(23,15,24,.96) 100%)',
        'hud-card-warm':
          'radial-gradient(120% 170% at 50% 0%, rgba(168,113,58,.22), transparent 58%), linear-gradient(180deg, rgba(34,25,34,.94) 0%, rgba(19,14,22,.96) 100%)',
        'hud-panel':
          'radial-gradient(120% 150% at 12% 0%, rgba(40,82,210,.14), transparent 55%), linear-gradient(180deg, rgba(14,20,39,.92) 0%, rgba(10,15,28,.95) 100%)',
        'hud-divider':
          'linear-gradient(90deg, rgba(84,110,186,0) 0%, rgba(84,110,186,.75) 16%, rgba(84,110,186,.18) 100%)',
        'hud-grid':
          'linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)',
      },
      backdropBlur: {
        hud: '18px',
      },
      animation: {
        'hud-pulse': 'hud-pulse 2.8s ease-in-out infinite',
        'hud-drift': 'hud-drift 16s linear infinite',
      },
      keyframes: {
        'hud-pulse': {
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.08)' },
        },
        'hud-drift': {
          '0%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(14px)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
