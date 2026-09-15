#!/bin/sh
# Development is isolated to dgt_test; never source the real database .env here.
set -eu
cd "$(dirname "$0")"
if [ ! -f target/dgt-backend-0.1.0-SNAPSHOT.jar ]; then
  echo 'Build the backend first: mvn package -DskipTests' >&2
  exit 1
fi
exec env DB_URL=jdbc:postgresql://127.0.0.1:55439/dgt_test DB_USERNAME=dgt_test \
  DB_PASSWORD="${DGT_TEST_DB_PASSWORD:-only-test-password}" PORT=8181 \
  CORS_ORIGINS=http://localhost:5173 \
  java -jar target/dgt-backend-0.1.0-SNAPSHOT.jar --server.address=127.0.0.1 --app.profile.enabled=true --app.billing.enabled=true --app.workweek.enabled=true --app.workforce.enabled=true --app.pricebook.enabled=true --app.gas.settings.enabled=true --app.gas.delivery.enabled=true --app.gas.price.enabled=true --app.gas.adjustments.enabled=true --app.gas.tank-report.enabled=true --app.sales.activity.enabled=true --app.daily-closing.enabled=true --app.tender.credit-card.enabled=true --app.tender.ebt.enabled=true --app.tender.fleet.enabled=true
