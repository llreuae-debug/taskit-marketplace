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
        lime: {
          DEFAULT: "#B9FF66",
          dark: "#9BE34A",
          subtle: "rgba(185, 255, 102, 0.25)"
        },
        ink: {
          DEFAULT: "#191A23",
          light: "#23242E",
          border: "#191A23"
        },
        greyCard: "#F3F3F3",
        white: "#FFFFFF",
        muted: "#6B6B73",
        line: "#E4E4E7",
        primary: {
          DEFAULT: "#191A23",
          lime: "#B9FF66",
          purple: "#7C3AED",
          light: "#8B5CF6",
          dark: "#111218"
        },
        surface: {
          dark: "#0E0F14",
          darkCard: "#191A23",
          darkBorder: "#23242E",
          light: "#FFFFFF",
          lightCard: "#F3F3F3",
          lightBorder: "#191A23"
        },
        status: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#FF4D4D",
          danger: "#FF4D4D",
          info: "#3B82F6"
        }
      },
      fontFamily: {
        sans: ["SpaceGrotesk", "PlusJakartaSans", "System"],
        urdu: ["NotoNastaliqUrdu", "System"],
        arabic: ["NotoSansArabic", "System"],
        devanagari: ["NotoSansDevanagari", "System"],
        sc: ["NotoSansSC", "System"]
      },
      borderRadius: {
        cardWeb: "45px",
        cardMobile: "28px",
        button: "14px",
        highlight: "7px",
        pill: "9999px"
      },
      boxShadow: {
        sticker: "0 5px 0 0 #191A23",
        stickerHover: "0 7px 0 0 #191A23",
        stickerActive: "0 2px 0 0 #191A23"
      }
    }
  },
  plugins: []
};
