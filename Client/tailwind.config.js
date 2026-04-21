/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#10b981', 
          hover: '#059669',
        },
        secondary: '#0f172a',
        mint: {
          50: '#f0fdf4',
          100: '#dcfce7',
        }
      },
    },
  },
  plugins: [],
}