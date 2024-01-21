/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./{pages, components,layouts}/**/*.{vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
}

