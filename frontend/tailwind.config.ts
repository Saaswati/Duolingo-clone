import type { Config } from "tailwindcss";

/**
 * Duolingo's palette, named the way their design system names it.
 * Every colour has a matching `-dark` used as the bottom border on buttons -
 * that 4px darker edge is what gives the whole interface its pressable,
 * toy-like feel, and it is the single most recognisable thing about the UI.
 */
const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        leaf: { DEFAULT: "#58CC02", light: "#89E219", dark: "#58A700" },
        sky: { DEFAULT: "#1CB0F6", dark: "#1899D6" },
        coral: { DEFAULT: "#FF4B4B", dark: "#EA2B2B" },
        sun: { DEFAULT: "#FFC800", dark: "#E5B200" },
        plum: { DEFAULT: "#CE82FF", dark: "#A568CC" },
        ember: { DEFAULT: "#FF9600", dark: "#E08600" },
        ink: "#4B4B4B",
        stone: "#777777",
        mist: "#AFAFAF",
        cloud: "#E5E5E5",
        snow: "#F7F7F7",
        correct: { bg: "#D7FFB8", text: "#58A700" },
        incorrect: { bg: "#FFDFE0", text: "#EA2B2B" },
      },
      fontFamily: {
        sans: ["var(--font-nunito)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "70%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        bounce_soft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "slide-up": "slide-up 250ms cubic-bezier(0.2, 0.8, 0.3, 1)",
        "pop-in": "pop-in 300ms cubic-bezier(0.2, 0.8, 0.3, 1)",
        shake: "shake 400ms ease-in-out",
        "bounce-soft": "bounce_soft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
