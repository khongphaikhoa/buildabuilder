import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8F9FA",
        primary: "#2D5BFF",
        ink: "#1A1A1A",
        accent: {
          lavender: "#F0E7FF",
          mint: "#E1F9F0",
        },
      },
      letterSpacing: {
        tighthead: "-0.02em",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
