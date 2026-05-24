// tailwind.config.js
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
        primary: "#FF6300",
        "primary-light": "#FF8A20",
        dark: "#121212",
        "wa-green": "#25D366",
        background: "#F8F8F6",
        gray: "#6B7280",
        helper: "#9CA3AF",
        border: "#E5E7EB",
        card: "#FFFFFF",
      },
      fontFamily: {
        jost: ["Jost", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
        pill: "99px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
