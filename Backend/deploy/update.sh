#!/usr/bin/env bash
# Run on EC2 as root: sudo bash /root/dgt-release/update.sh
# Called by CI/CD after artifacts are uploaded to /root/dgt-release/.
# Handles routine updates (new JAR, new frontend). Schema migrations are
# run separately via activate.sh or Migrate.java when SQL files change.
set -euo pipefail

release=$(cd -- "$(dirname -- "$0")" && pwd)
current=/opt/dgt/current
service=dgt-backend

if [[ ! -f "$release/backend.jar" ]]; then
  echo "ERROR: $release/backend.jar not found" >&2
  exit 1
fi

echo "--- Stopping $service ---"
systemctl stop "$service"

echo "--- Backing up current JAR ---"
if [[ -f "$current/backend.jar" ]]; then
  cp "$current/backend.jar" "$current/backend.jar.prev"
fi

rollback() {
  echo "--- ROLLBACK: restoring previous JAR ---" >&2
  if [[ -f "$current/backend.jar.prev" ]]; then
    cp "$current/backend.jar.prev" "$current/backend.jar"
    chown dgt:dgt "$current/backend.jar"
  fi
  systemctl start "$service"
}
trap rollback ERR

echo "--- Deploying new artifacts ---"
install -o dgt -g dgt -m 640 "$release/backend.jar" "$current/backend.jar"
if [[ -d "$release/frontend" ]]; then
  rsync -a --delete "$release/frontend/" "$current/frontend/"
  chown -R dgt:dgt "$current/frontend"
fi

echo "--- Starting $service ---"
systemctl start "$service"

echo "--- Health check ---"
for attempt in $(seq 1 30); do
  if curl --fail --silent http://127.0.0.1:8080/api/v1/health; then
    echo ""
    echo "--- Deploy complete ---"
    trap - ERR
    exit 0
  fi
  echo "Attempt $attempt/30 — waiting..."
  sleep 3
done

echo "ERROR: health check failed after 30 attempts" >&2
exit 1
