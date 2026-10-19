/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vyay: {
          bg: 'var(--vyay-bg)',
          surface: 'var(--vyay-surface)',
          primary: 'var(--vyay-primary)',
          'primary-hover': 'var(--vyay-primary-hover)',
          'primary-soft': 'var(--vyay-primary-soft)',
          accent: 'var(--vyay-accent)',
          border: 'var(--vyay-border)',
          ink: 'var(--vyay-ink)',
          'ink-muted': 'var(--vyay-ink-muted)',
        },
      },
      borderRadius: {
        control: '12px',
        card: '14px',
      },
    },
  },
  plugins: [],
};
