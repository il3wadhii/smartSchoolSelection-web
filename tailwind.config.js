/** @type {import('tailwindcss').Config} */
// Brand theme — single source of truth for the future redesign:
// change these tokens (and components/ui) and the whole site restyles.
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E6F4F4',
          200: '#B3DDDE',
          300: '#80C6C7',
          400: '#4DAFB1',
          500: '#1A8A8C',
          600: '#157173',
          700: '#105859',
          800: '#0B3F40',
          900: '#062627',
          DEFAULT: '#1A8A8C'
        },
        secondary: {
          100: '#E8ECEF',
          200: '#BCC6D0',
          300: '#90A0B1',
          400: '#647A92',
          500: '#1B3A57',
          600: '#162E46',
          700: '#112335',
          800: '#0C1824',
          900: '#070D13',
          DEFAULT: '#1B3A57'
        },
        accent: {
          100: '#FDEAEB',
          200: '#F9C1C4',
          300: '#F5989D',
          400: '#F16F76',
          500: '#E63946',
          600: '#CC2E3A',
          700: '#B2232E',
          800: '#991822',
          900: '#660D16',
          DEFAULT: '#E63946'
        },
        orange: {
          100: '#FFF3E6',
          200: '#FEDBB3',
          300: '#FDC380',
          400: '#FCAB4D',
          500: '#F77F00',
          600: '#DE7100',
          700: '#C56300',
          800: '#AC5500',
          900: '#934700',
          DEFAULT: '#F77F00'
        },
        // "Roots" design tokens (prototype roles mapped to the brand):
        ink: '#1B3A57',     // text — brand navy (logo text color)
        muted: '#6B7A8C',
        line: '#E3E8EE',
        surface: '#F6F8FA', // page background
        good: '#2E8B6E',    // positive / best-value
        // Stage Line signature colors
        stage: {
          nur: '#F77F00',   // nursery — pencil orange
          kg: '#1A8A8C',    // KG — brand teal
          pri: '#5B8FD9',   // primary
          sec: '#9B7ED9',   // secondary
        }
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-fraunces)', 'Fraunces', 'Georgia', 'serif'],
      },
      borderRadius: {
        card: '20px',
        btn: '16px',
        chip: '14px',
      },
    },
  },
  plugins: [],
}
