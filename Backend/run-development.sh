#!/bin/sh
set -eu
cd "$(dirname "$0")"

if [ ! -f target/dgt-backend-0.1.0-SNAPSHOT.jar ]; then
  echo 'Build the backend first: mvn package -DskipTests' >&2
  exit 1
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "${DB_PASSWORD:-}" ]; then
  echo 'DB_PASSWORD is not set. Add it to .env (see .env.example).' >&2
  exit 1
fi

exec java -jar target/dgt-backend-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=dev
