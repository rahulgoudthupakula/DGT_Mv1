#!/bin/sh
# Development is isolated to dgt_test; never source the real database .env here.
set -eu
cd "$(dirname "$0")"
if [ -f ../../DGT_client_handling/.env.integration.local ]; then
 set -a
 . ../../DGT_client_handling/.env.integration.local
 set +a
fi
if [ ! -f target/dgt-backend-0.1.0-SNAPSHOT.jar ]; then
  echo 'Build the backend first: mvn package -DskipTests' >&2
  exit 1
fi
exec env DB_URL=jdbc:postgresql://127.0.0.1:55439/dgt_test DB_USERNAME=dgt_test \
  DB_PASSWORD="${DGT_TEST_DB_PASSWORD:-only-test-password}" PORT=8181 APP_ENVIRONMENT=development APP_POS_SIMULATOR_ENABLED=true \
  CORS_ORIGINS=http://localhost:5173,http://localhost:5174 \
  java -jar target/dgt-backend-0.1.0-SNAPSHOT.jar --spring.profiles.active=dev --debug=false --logging.level.root=INFO --logging.level.org.springframework=INFO
