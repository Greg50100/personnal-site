import colors from 'tailwindcss/colors'

/**
 * Thème du site : deux jetons de couleur seulement.
 *  - night  : bleus nuit (fonds, textes, bordures)
 *  - accent : couleur d'accentuation (ambre)
 * Changer de style = modifier ces deux palettes.
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        accent: colors.amber,
        night: {
          50: '#f4f6fb',
          100: '#e8ecf5',
          200: '#d0d7e6',
          300: '#aab5cd',
          400: '#7e8cab',
          500: '#5c6b8d',
          600: '#475474',
          700: '#36405d',
          800: '#242c46',
          900: '#161c33',
          950: '#0a0f21',
        },
      },
    },
  },
  plugins: [],
}
