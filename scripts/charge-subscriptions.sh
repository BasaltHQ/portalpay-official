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

set -euo pipefail

# Resolve the directory this script lives in
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_ROOT="$(dirname "$SCRIPT_DIR")"

# App port (Next.js default)
APP_PORT="${APP_PORT:-3000}"

# Log file — lives alongside the app
LOG="${APP_ROOT}/logs/charge-subscriptions.log"
mkdir -p "$(dirname "$LOG")"

# Load CRON_SECRET from the app's env file (production → local → default)
echo "[$(date -u)] DEBUG: APP_ROOT=${APP_ROOT}" >> "$LOG"
echo "[$(date -u)] DEBUG: .env.production exists? $([ -f "${APP_ROOT}/.env.production" ] && echo YES || echo NO)" >> "$LOG"
echo "[$(date -u)] DEBUG: .env.local exists? $([ -f "${APP_ROOT}/.env.local" ] && echo YES || echo NO)" >> "$LOG"
echo "[$(date -u)] DEBUG: .env exists? $([ -f "${APP_ROOT}/.env" ] && echo YES || echo NO)" >> "$LOG"

if [ -f "${APP_ROOT}/.env.production" ]; then
  CRON_SECRET=$(grep -E '^CRON_SECRET=' "${APP_ROOT}/.env.production" | cut -d'=' -f2-)
elif [ -f "${APP_ROOT}/.env.local" ]; then
  CRON_SECRET=$(grep -E '^CRON_SECRET=' "${APP_ROOT}/.env.local" | cut -d'=' -f2-)
elif [ -f "${APP_ROOT}/.env" ]; then
  CRON_SECRET=$(grep -E '^CRON_SECRET=' "${APP_ROOT}/.env" | cut -d'=' -f2-)
fi

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$(date -u)] ❌ CRON_SECRET not found in .env.production, .env.local, or .env" >> "$LOG"
  exit 1
fi

# ── Run ──────────────────────────────────────────────────
echo "========================================" >> "$LOG"
echo "[$(date -u)] 🔄 Starting subscription charges" >> "$LOG"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: ${CRON_SECRET}" \
  "http://localhost:${APP_PORT}/api/cron/charge-subscriptions" \
  --max-time 120 2>>"$LOG")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Status: ${HTTP_CODE}" >> "$LOG"
echo "Response: ${BODY}" >> "$LOG"

if [ "$HTTP_CODE" -ge 400 ] || [ -z "$HTTP_CODE" ]; then
  echo "[$(date -u)] ❌ FAILED (HTTP ${HTTP_CODE})" >> "$LOG"
  exit 1
else
  echo "[$(date -u)] ✅ Success" >> "$LOG"
fi
