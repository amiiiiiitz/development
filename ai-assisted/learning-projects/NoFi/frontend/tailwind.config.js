/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#10100f",
        panel: "#191918",
        accent: "#c6f277",
      },
      boxShadow: {
        glow: "0 0 50px rgba(198, 242, 119, 0.08)",
      },
    },
  },
  plugins: [],
};
