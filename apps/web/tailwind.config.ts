import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["'Vazirmatn Variable'", "Vazirmatn", "system-ui", "sans-serif"] },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        border: "hsl(var(--border))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        "accent-ink": "hsl(var(--accent-ink))",
        violet: "hsl(var(--violet))",
        danger: "hsl(var(--danger))",
        success: "hsl(var(--success))",
      },
      borderRadius: { lg: "0.9rem", md: "0.6rem", sm: "0.4rem" },
      boxShadow: {
        paper: "0 1px 0 hsl(var(--border)), 0 10px 30px -18px hsl(var(--foreground) / 0.35)",
        glow: "0 0 0 4px hsl(var(--primary) / 0.15), 0 0 32px 4px hsl(var(--primary) / 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
