import type { Config } from "tailwindcss";

/**
 * Restrict Tailwind content scanning to application source directories.
 * This avoids traversing unrelated or restricted paths (e.g., tmp/certbot)
 * that can cause EACCES errors during build.
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./public/**/*.{html}"
  ],
  theme: {
    extend: {}
  },
  plugins: []
};

export default config;
