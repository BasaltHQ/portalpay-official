const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    "postcss-preset-env": {
      stage: 1,
      features: {
        "nesting-rules": false,
        "cascade-layers": false,
        "media-query-ranges": false,
        "custom-properties": false,
        "color-mix": true,
        "oklab-function": true,
        "color-function": true
      },
      browsers: [
        "Chrome >= 70",
        "Safari >= 12",
        "last 2 versions",
        "not dead"
      ]
    }
  }
};

export default config;
