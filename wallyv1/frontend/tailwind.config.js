/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
    './src/context/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}', // Catch-all for any TypeScript files
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        primary: '#7c3aed',
        accent: '#00ffcc',
        'wally-pink': '#ff0077',
        'wally-cyan': '#00ffcc',
        'wally-purple': '#7c3aed',
      },
      fontFamily: {
        'orbitron': ['Orbitron', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0px 0px 15px #00ffcc',
        'neon-pink': '0px 0px 15px #ff0077',
        'neon-purple': '0px 0px 15px #7c3aed',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}