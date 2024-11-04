
echo 'module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#f4511e",
          dark: "#d84315",
          light: "#ff7043"
        }
      }
    }
  },
  plugins: []
}' > tailwind.config.js