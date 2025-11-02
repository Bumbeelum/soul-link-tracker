/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'poke-dark': '#0B1020',
        'poke-accent': '#FFD54D',
        'poke-card': '#1A2332',
        'poke-hover': '#242D3F',
      },
    },
  },
  plugins: [],
}


