import colors from 'tailwindcss/colors'

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", 
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.blue['700'], 
      },
    },
  },
  plugins: [],
}
