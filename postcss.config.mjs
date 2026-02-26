const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    /*
    "postcss-preset-env": {
      stage: 1, // Transpile modern drafting stage CSS
      features: {
        "nesting-rules": false, // Handled implicitly by Tailwind 
        "cascade-layers": true, // Critical for Chrome < 99 (VP550)
        "color-mix": true, // Critical for Chrome < 111
        "oklab-function": true,
      },
      browsers: [
        "Chrome >= 70", // Target older Android Systems WebViews (NDroid)
        "Safari >= 12",
        "last 2 versions",
        "not dead"
      ]
    }
    */
  }
};

export default config;
