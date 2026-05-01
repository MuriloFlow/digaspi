import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        digaspi: {
          blue: "#214f8f",
          red: "#dc1f2a",
          ink: "#10213d",
          pale: "#f4f8fd",
          line: "#dbe5f2",
          green: "#14804a"
        }
      },
      boxShadow: {
        panel: "0 16px 42px rgba(16, 33, 61, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
