/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.35s ease-out",
        "bounce-dot": "bounceDot 0.65s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite",
        "shimmer-bar": "shimmerBar 1.4s ease-in-out infinite",
        "shimmer-text": "shimmerText 2.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        bounceDot: {
          "0%, 100%": { transform: "translateY(0) scale(1)" },
          "35%": { transform: "translateY(-10px) scale(1.08)" },
          "70%": { transform: "translateY(0) scale(1)" },
        },
        shimmerBar: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(400%)" },
        },
        shimmerText: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
      },
    },
  },
  plugins: [],
};
