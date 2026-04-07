/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Grayish, subtle palette
        bg: '#f3f4f6',
        surface: '#ffffff',
        surface2: '#eef0f3',
        border: '#d5d9df',
        text: '#1f2937',
        muted: '#6b7280',
        primary: '#6b7280',
        secondary: '#4b5563',
        favorite: '#9ca3af',
      },
      fontFamily: {
        'primary' : ["Montserrat", "sans-serif"],
        'secondary' : ["Nunito Sans", "sans-serif"]
      }
    },
  },
  plugins: [],
}

