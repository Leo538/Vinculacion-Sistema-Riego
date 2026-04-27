import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#070f1f",
        panel: "#0f1c34",
        panelSoft: "#132445",
        borderSoft: "rgba(139, 176, 255, 0.15)",
        success: "#22c55e",
        info: "#38bdf8",
        warning: "#f59e0b",
        danger: "#ef4444"
      },
      boxShadow: {
        panel: "0 12px 35px rgba(1, 9, 26, 0.45)"
      },
      backdropBlur: {
        xs: "2px"
      }
    }
  },
  plugins: []
};

export default config;
