#!/bin/bash
# Azure App Service custom startup script
# Installs fonts required by Sharp for SVG text rendering in OG images
# Without these fonts, all SVG text renders as tofu boxes (□□□□)

apt-get update -qq && apt-get install -y -qq --no-install-recommends \
  fontconfig \
  fonts-liberation \
  fonts-dejavu-core \
  > /dev/null 2>&1 && fc-cache -f > /dev/null 2>&1

echo "[startup] Fonts installed successfully"

# Start the Next.js standalone server
node server.js
