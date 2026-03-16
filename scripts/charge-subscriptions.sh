#!/bin/bash
# ──────────────────────────────────────────────────────────
# charge-subscriptions.sh
# Nightly cron script to charge due subscriptions.
# Calls the local Next.js app directly (bypasses Cloudflare).
#
# Crontab entry (runs daily at 8:30 AM UTC):
#   30 8 * * * /var/www/vhosts/basalthq.com/surge.basalthq.com/scripts/charge-subscriptions.sh
#
# Adjust the SCRIPT_DIR / APP_PORT / LOG path as needed.
# ──────────────────────────────────────────────────────────

set -u  # warn on unset vars, but don't abort on errors

# Resolve the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"

# The app runs via Phusion Passenger behind Apache — there is no direct
# Node.js port.  We call through the local web server with a Host header
# so Apache routes to the correct vhost, staying entirely on-server
# (never touches Cloudflare).
APP_HOST="${APP_HOST:-surge.basalthq.com}"

# Log file — lives alongside the app
LOG="${APP_ROOT}/logs/charge-subscriptions.log"
mkdir -p "$(dirname "$LOG")"

# Load CRON_SECRET from the app's env file (production → local → default)
# Handles both `CRON_SECRET=value` and `export CRON_SECRET="value"` formats
echo "[$(date -u)] DEBUG: APP_ROOT=${APP_ROOT}" >> "$LOG"
echo "[$(date -u)] DEBUG: .env.production exists? $([ -f "${APP_ROOT}/.env.production" ] && echo YES || echo NO)" >> "$LOG"

extract_secret() {
  grep -E '(^|export\s+)CRON_SECRET=' "$1" | sed 's/^export\s*//' | cut -d'=' -f2- | tr -d '"' | tr -d "'"
}

if [ -f "${APP_ROOT}/.env.production" ]; then
  CRON_SECRET=$(extract_secret "${APP_ROOT}/.env.production")
elif [ -f "${APP_ROOT}/.env.local" ]; then
  CRON_SECRET=$(extract_secret "${APP_ROOT}/.env.local")
elif [ -f "${APP_ROOT}/.env" ]; then
  CRON_SECRET=$(extract_secret "${APP_ROOT}/.env")
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$(date -u)] ❌ CRON_SECRET not found in .env.production, .env.local, or .env" >> "$LOG"
  exit 1
fi

# ── Run ──────────────────────────────────────────────────
echo "========================================" >> "$LOG"
echo "[$(date -u)] 🔄 Starting subscription charges" >> "$LOG"
echo "[$(date -u)] DEBUG: Calling https://${APP_HOST} (resolved to local IP)" >> "$LOG"

# Use --resolve to route the domain to the local server IP.
# This sets both Host header AND SSL SNI correctly so Apache
# matches the right vhost. The request never leaves the server.
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  --resolve "${APP_HOST}:443:51.81.186.244" \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  "https://${APP_HOST}/api/cron/charge-subscriptions" \
  --max-time 120 2>>"$LOG") || true

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status: ${HTTP_CODE}" >> "$LOG"
echo "Response: ${BODY}" >> "$LOG"

if [ -z "$HTTP_CODE" ] || [ "$HTTP_CODE" = "000" ]; then
  echo "[$(date -u)] ❌ FAILED — could not connect to 127.0.0.1 (is Apache running?)" >> "$LOG"
  exit 1
elif [ "$HTTP_CODE" -ge 400 ]; then
  echo "[$(date -u)] ❌ FAILED (HTTP ${HTTP_CODE})" >> "$LOG"
  exit 1
else
  echo "[$(date -u)] ✅ Success" >> "$LOG"
fi
