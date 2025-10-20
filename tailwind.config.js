/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6',
          dark: '#1D4ED8',
        },
        success: {
          light: '#48BB78',
          DEFAULT: '#059669',
          bg: '#F0FDF4',
        },
        warning: {
          light: '#F6AD55',
          DEFAULT: '#D97706',
          bg: '#FFFBEB',
        },
        danger: {
          light: '#F87171',
          DEFAULT: '#DC2626',
          bg: '#FEF2F2',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'Roboto', 'System'],
      },
      fontSize: {
        'heading': ['24px', '32px'],
        'subheading': ['18px', '28px'],
        'body': ['16px', '24px'],
        'small': ['14px', '20px'],
      },
    },
  },
  plugins: [],
};
