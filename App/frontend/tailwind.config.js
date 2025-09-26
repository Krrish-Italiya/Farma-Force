module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6D28D9', // purple-800
          dark: '#4C1D95',   // purple-900
          light: '#EDE9FE',  // purple-100
        },
        background: '#F9FAFB', // gray-50
        surface: '#FFFFFF',
        border: '#E5E7EB', // gray-200
        input: '#F3F4F6', // gray-100
        text: '#171717',
        muted: '#6B7280',
      },
    },
  },
  plugins: [],
};
