/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gym: {
          dark: "#0f0f0f",
          card: "#1a1a1a",
          border: "#2a2a2a",
          accent: "#f97316",     // naranja vibrante
          accentHover: "#ea6c0a",
          green: "#22c55e",
          red: "#ef4444",
          yellow: "#eab308",
          muted: "#6b7280",
          light: "#e5e7eb",
        },
      },
    },
  },
  plugins: [],
};
