/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
          muted: "rgba(124, 58, 237, 0.12)"
        },
        lime: {
          DEFAULT: "#A3E635",
          dark: "#84CC16"
        },
        coral: {
          DEFAULT: "#FF5C7A",
          dark: "#F43F5E"
        },
        surface: {
          dark: "#0F0F14",
          darkCard: "#181822",
          darkBorder: "#272736",
          light: "#FAFAFC",
          lightCard: "#FFFFFF",
          lightBorder: "#E5E7EB"
        },
        status: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6"
        }
      },
      fontFamily: {
        sans: ["PlusJakartaSans", "System"],
        urdu: ["NotoNastaliqUrdu", "System"],
        arabic: ["NotoSansArabic", "System"],
        devanagari: ["NotoSansDevanagari", "System"],
        sc: ["NotoSansSC", "System"]
      },
      borderRadius: {
        card: "20px",
        pill: "9999px"
      }
    }
  },
  plugins: []
};
