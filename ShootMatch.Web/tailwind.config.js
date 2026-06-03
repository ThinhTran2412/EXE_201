/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e65a28", // Vibrant orange from screenshot
        background: "#f5f2eb", // Warm beige from mobile app background
        foreground: "#1c1917",
        card: "#ffffff",
        border: "#e5e5e5",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "Liberation Sans",
          "sans-serif",
        ],
        display: ["Anton", "sans-serif"],
        mono: ["Courier New", "Courier", "monospace"],
      },
      fontSize: {
        xs: ["11px", { lineHeight: "1.4" }],
        sm: ["13px", { lineHeight: "1.4" }],
        base: ["15px", { lineHeight: "1.4" }],
        md: ["17px", { lineHeight: "1.4" }],
        lg: ["20px", { lineHeight: "1.3" }],
        xl: ["24px", { lineHeight: "1.2" }],
        "2xl": ["30px", { lineHeight: "1.1" }],
        "3xl": ["38px", { lineHeight: "1.05" }],
        "4xl": ["48px", { lineHeight: "1.05" }],
      },
      lineHeight: {
        tight: "1.1",
        normal: "1.4",
        relaxed: "1.6",
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
    },
  },
  plugins: [],
};
