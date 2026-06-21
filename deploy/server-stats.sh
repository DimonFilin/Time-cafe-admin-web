#!/usr/bin/env bash
# Append minimal host stats (for cron). htop is interactive only; this logs snapshots.
set -euo pipefail

LOG_DIR="${HOME}/timecafe/logs"
LOG_FILE="${LOG_DIR}/server-stats.log"
mkdir -p "$LOG_DIR"

{
  echo "=== $(date -Is) ==="
  uptime
  free -h | head -2
  df -h / | tail -1
  if command -v docker >/dev/null; then
    docker stats --no-stream --format 'docker {{.Name}} cpu={{.CPUPerc}} mem={{.MemUsage}}' 2>/dev/null || true
  fi
  if command -v pm2 >/dev/null; then
    pm2 jlist 2>/dev/null | python3 -c "
import json,sys
try:
  apps=json.load(sys.stdin)
  for a in apps:
    m=a.get('monit') or {}
    print(f\"pm2 {a.get('name')} cpu={m.get('cpu')}% mem={m.get('memory')}B status={a.get('pm2_env',{}).get('status')}\")
except Exception:
  pass
" 2>/dev/null || true
  fi
  echo
} >>"$LOG_FILE"

# Keep log bounded (~2 MB)
if [ -f "$LOG_FILE" ] && [ "$(wc -c <"$LOG_FILE")" -gt 2097152 ]; then
  tail -n 2000 "$LOG_FILE" >"${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi
