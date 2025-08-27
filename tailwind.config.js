/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Headings: Inter for Latin, fallback to Noto Sans KR for Korean (clean look)
        'playfair': [
          'var(--font-heading)',
          'var(--font-noto-sans-kr)',
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'
        ],
        // Body: Prefer Noto Sans KR for consistent Korean, then Source Sans 3
        'sans': [
          'var(--font-noto-sans-kr)',
          'var(--font-source-sans)',
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'
        ],
      },
    },
  },
  plugins: [],
}
