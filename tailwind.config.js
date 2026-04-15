/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#EFF6FF', 100:'#DBEAFE', 200:'#BFDBFE', 300:'#93C5FD', 400:'#60A5FA', 500:'#3B82F6', 600:'#2563EB', 700:'#1D4ED8', 800:'#1E40AF', 900:'#1E3A8A' },
        accent:  { 400:'#FBBF24', 500:'#F59E0B', 600:'#D97706' },
        success: { 500:'#22C55E', 600:'#16A34A' },
        danger:  { 500:'#EF4444', 600:'#DC2626' },
        surface: { 50:'#F8FAFC', 100:'#F1F5F9', 200:'#E2E8F0', 300:'#CBD5E1' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
