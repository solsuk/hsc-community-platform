import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#d7dce0", // Specified flat grey background
        "tile-sell": "#22c55e", // Green for SELL listings
        "tile-trade": "#eab308", // Yellow for TRADE listings
        "tile-announce": "#3b82f6", // Blue for ANNOUNCE listings
        "tile-wanted": "#8B5CF6", // Purple for WANTED listings
      },
      borderRadius: {
        'tile': '0.5rem', // Consistent border radius for the bento-box tiles
      },
    },
  },
  plugins: [],
};
export default config; 