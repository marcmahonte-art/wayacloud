/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6300",
          light: "#FF8A20",
          dark: "#a43d00",
        },
        "wa-green": {
          DEFAULT: "#25D366",
          light: "#66FF8E",
          dark: "#007232",
        },
        dark: "#121212",
        background: "#F8F8F6",
        gray: "#6B7280",
        helper: "#9CA3AF",
        border: "#E5E7EB",
        "border-subtle": "#F3F4F6",
        card: "#FFFFFF",
        brand: {
          tint: "#FFF3ED",
          violet: "#EDE9FE",
        },
      },
      fontFamily: {
        jost: ["Jost", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        pill: "9999px",
        xl: "12px",
        "2xl": "16px",
        "3xl": "20px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08)",
        glow: "0 0 20px rgba(255, 99, 0, 0.15)",
        "glow-lg": "0 0 40px rgba(255, 99, 0, 0.25)",
        glass: "0 8px 32px rgba(0,0,0,0.08)",
      },
      backdropBlur: {
        glass: "20px",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};
