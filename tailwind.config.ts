import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        'rubik-dirt': ['Rubik Dirt', 'cursive'],
      },
      colors: {
        border: "#d4dbe3",
        input: "#d4dbe3",
        ring: "#cfb408",
        background: "#f5f6f7",
        foreground: "#22252b",
        primary: {
          DEFAULT: "#cfb408",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "#d95c9c",
          foreground: "#ffffff",
        },
        destructive: {
          DEFAULT: "#cc3333",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f2f5f7",
          foreground: "#4a4f59",
        },
        accent: {
          DEFAULT: "#f7b500",
          foreground: "#22252b",
        },
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#22252b",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#22252b",
        },
      },
      borderRadius: {
        lg: "0.5rem",
        md: "calc(0.5rem - 2px)",
        sm: "calc(0.5rem - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;