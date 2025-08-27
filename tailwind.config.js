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
        // Headings: Playfair for Latin, Noto Serif KR for Korean glyphs
        'playfair': [
          'var(--font-playfair)',
          'var(--font-noto-serif-kr)',
          'Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'
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
