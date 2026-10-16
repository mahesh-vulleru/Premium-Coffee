/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FAF6F0',
          100: '#F5ECE1',
          200: '#EBDCCE',
          300: '#D5BC9F',
          400: '#AF8359',
          500: '#8A5934',
          600: '#6E4022',
          700: '#532D16',
          800: '#3A1E0E',
          900: '#231208',
          950: '#140A04',
        },
        terracotta: {
          400: '#E37A47',
          500: '#D46430',
          600: '#BC5121',
          700: '#9C3D15',
        },
        cream: {
          DEFAULT: '#FDFBF7',
          light: '#FFFDF9',
          dark: '#F5EFE6',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(35, 18, 8, 0.06)',
        'elevated': '0 12px 32px -4px rgba(35, 18, 8, 0.12)',
        'glow': '0 0 24px -2px rgba(212, 100, 48, 0.25)',
      }
    },
  },
  plugins: [],
}

