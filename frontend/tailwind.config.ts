import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        lagoon: "#0f766e",
        coral: "#f97316",
        paper: "#f8fafc"
      }
    }
  },
  plugins: []
};

export default config;
