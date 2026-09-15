#!/usr/bin/env bash
# Run on EC2: bash ~/dgt-release/activate.sh <domain>
set -euo pipefail
umask 077
release=$(cd -- "$(dirname -- "$0")" && pwd)
domain=${1:?Supply the approved website domain}
[[ "$domain" =~ ^[a-zA-Z0-9.-]+$ ]] || { echo 'Invalid domain'; exit 1; }
rds=dgt-postgres.cdsqkuge0wp7.us-east-2.rds.amazonaws.com
export PGHOST="$rds" PGPORT=5432 PGDATABASE=dgt PGUSER=postgres PGSSLMODE=verify-full PGSSLROOTCERT="$HOME/global-bundle.pem" PGCONNECT_TIMEOUT=10
read -r -s -p 'RDS postgres password: ' PGPASSWORD
printf '\n'
export PGPASSWORD
trap 'unset PGPASSWORD FLYWAY_PASSWORD DGT_RUNTIME_PASSWORD' EXIT
psql -X -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;' >/dev/null
mkdir -p "$HOME/dgt-backups"
pg_dump -Fc --no-owner --no-privileges -f "$HOME/dgt-backups/before-migration-$(date +%Y%m%d-%H%M%S).dump"
export FLYWAY_URL="jdbc:postgresql://$rds:5432/dgt?sslmode=verify-full&sslrootcert=$PGSSLROOTCERT" FLYWAY_USER=postgres FLYWAY_PASSWORD="$PGPASSWORD"
java -cp "$release/migration-libs/*" "$release/Migrate.java" "$release/migrations"
psql -X -v runtime_user=dgt_app -f "$release/runtime-permissions.sql"
unset FLYWAY_PASSWORD PGPASSWORD
read -r -s -p 'Existing dgt_app password: ' DGT_RUNTIME_PASSWORD
printf '\n'
export DGT_RUNTIME_PASSWORD
PGUSER=dgt_app PGPASSWORD="$DGT_RUNTIME_PASSWORD" psql -X -v ON_ERROR_STOP=1 -c 'SELECT count(*) FROM public.stores;' >/dev/null
sudo install -d -m 750 -o root -g dgt /etc/dgt
# JSON is valid YAML. Avoid shell interpolation and preserve special password characters.
python3 - <<'PY' | sudo tee /etc/dgt/application-secrets.yml >/dev/null
import json,os
print(json.dumps({'spring':{'datasource':{'password':os.environ['DGT_RUNTIME_PASSWORD']}}}))
PY
unset DGT_RUNTIME_PASSWORD
sudo chown root:dgt /etc/dgt/application-secrets.yml
sudo chmod 640 /etc/dgt/application-secrets.yml
sudo install -m 644 "$PGSSLROOTCERT" /etc/dgt/global-bundle.pem
sudo install -m 640 -o root -g dgt "$release/application-production.yml" /etc/dgt/application-production.yml
sudo install -m 644 "$release/dgt-backend.service" /etc/systemd/system/dgt-backend.service
sudo systemctl daemon-reload
sudo systemctl enable --now dgt-backend
sudo systemctl restart dgt-backend
for attempt in {1..30}; do
 if curl --fail --silent http://127.0.0.1:8080/api/v1/health; then break; fi
 sleep 2
done
curl --fail --silent http://127.0.0.1:8080/api/v1/health
printf '\nBackend started. TLS setup follows after DNS and ports 80/443 are ready.\n'
bash "$release/enable-https.sh"
