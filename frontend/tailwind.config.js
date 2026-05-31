/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#fff9ee",
        mint: "#dff4e5",
        peach: "#ffd8c2",
        butter: "#ffe89a",
        tomato: "#ed735d",
        ink: "#244139",
      },
    },
  },
  plugins: [],
};
