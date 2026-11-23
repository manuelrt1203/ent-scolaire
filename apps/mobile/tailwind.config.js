/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "indigo-ink": "#533afd",
        "periwinkle-wash": "#e8e9ff",
        "deep-violet": "#182659",
        "midnight-ink": "#061b31",
      },
    },
  },
  plugins: [],
};
