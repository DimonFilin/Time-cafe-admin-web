#!/usr/bin/env bash
# Run on VPS as root once: bash setup-pm2.sh
set -euo pipefail

cd ~/timecafe

echo "==> Install htop + pm2"
apt-get update -qq
apt-get install -y htop
npm install -g pm2

mkdir -p logs

echo "==> Pull latest admin"
cd Time-cafe-admin-web && git pull && npm ci && rm -rf .next && npm run build && cd ..

# Ensure logout redirect uses public IP, not localhost
ADMIN_ENV=Time-cafe-admin-web/.env
if [ -f "$ADMIN_ENV" ] && ! grep -q '^PUBLIC_APP_URL=' "$ADMIN_ENV"; then
  echo 'PUBLIC_APP_URL=http://68.183.212.112:3001' >>"$ADMIN_ENV"
fi

echo "==> Pull latest backend (if needed)"
cd Time-cafe-backend && git pull && npm ci && npm run build:api && cd ..

echo "==> Stop old processes"
pkill -f 'node dist/src/main' 2>/dev/null || true
pkill -f 'next start' 2>/dev/null || true
pkill -f 'next-server' 2>/dev/null || true
sleep 2

echo "==> Sync deploy scripts to ~/timecafe/deploy"
mkdir -p deploy logs
cp -f Time-cafe-admin-web/deploy/ecosystem.config.cjs deploy/
cp -f Time-cafe-admin-web/deploy/server-stats.sh deploy/
chmod +x deploy/server-stats.sh

echo "==> Start PM2"
pm2 delete timecafe-api timecafe-admin 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || pm2 startup

chmod +x deploy/server-stats.sh
CRON_LINE="*/5 * * * * ${HOME}/timecafe/deploy/server-stats.sh"
(crontab -l 2>/dev/null | grep -v server-stats.sh; echo "$CRON_LINE") | crontab -

echo "==> Done. pm2 status:"
pm2 status
echo "Stats log: ~/timecafe/logs/server-stats.log"
echo "htop: run 'htop' interactively"
