/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Windows 11 Fluent Design System Colors
        windows: {
          accent: '#0078D4',
          accentLight: '#60CDFF',
          accentDark: '#003B5C',
          background: '#F3F3F3',
          backgroundDark: '#202020',
          surface: '#FFFFFF',
          surfaceDark: '#2D2D2D',
          text: '#000000',
          textDark: '#FFFFFF',
          textSecondary: '#6B6B6B',
          textSecondaryDark: '#9E9E9E',
          border: '#E0E0E0',
          borderDark: '#3D3D3D',
          success: '#107C10',
          warning: '#FFB900',
          error: '#D13438',
          info: '#0078D4',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'windows': '0 2px 4px rgba(0, 0, 0, 0.14), 0 0 2px rgba(0, 0, 0, 0.12)',
        'windows-hover': '0 4px 8px rgba(0, 0, 0, 0.14), 0 0 4px rgba(0, 0, 0, 0.12)',
        'windows-elevated': '0 8px 16px rgba(0, 0, 0, 0.14), 0 0 8px rgba(0, 0, 0, 0.12)',
      },
      borderRadius: {
        'windows': '4px',
        'windows-lg': '8px',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
