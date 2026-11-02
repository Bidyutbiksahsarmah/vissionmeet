/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1F3A5F",
          hover: "#2B4C7A",
        },
        accent: {
          DEFAULT: "#0F766E",
        },
        surface: {
          light: "#F5F6F8",
          dark: "#171D25",
        },
        border: {
          light: "#E2E5EA",
          dark: "#2A323D",
        },
        slateText: {
          light: "#111827",
          lightSec: "#5B6472",
          dark: "#E8EBEF",
          darkSec: "#9AA4B2",
        },
      },
      borderRadius: {
        DEFAULT: "6px",
        md: "6px",
        lg: "8px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["IBM Plex Mono", "JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
