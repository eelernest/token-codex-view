import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      borderColor: {
        border: "hsl(var(--border))",
      },
      backgroundColor: {
        background: "hsl(var(--background))",
        muted: "hsl(var(--muted))",
        card: "hsl(var(--card))",
      },
      textColor: {
        foreground: "hsl(var(--foreground))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        "card-foreground": "hsl(var(--card-foreground))",
      },
      stroke: {
        border: "hsl(var(--border))",
      },
    },
  },
  plugins: [],
};
export default config;
