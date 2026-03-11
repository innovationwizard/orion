import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        unit: {
          available: "#22c55e",
          "soft-hold": "#f59e0b",
          reserved: "#3b82f6",
          frozen: "#a855f7",
          sold: "#6b7280",
        },
      },
    },
  },
  plugins: [],
};

export default config;
