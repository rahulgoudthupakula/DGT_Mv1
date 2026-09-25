# Run DGT_Mv1 locally

Requires Java 21, Maven, Node.js 22+, npm and Docker Desktop (running).
Production deployment does not update GitHub automatically. Start by pulling main.
Run commands from the repository root unless another directory is specified.

## 1. Create a fresh local database

For a new checkout only (do not recreate an existing container):

```sh
docker run --name dgt-local-db -d \
  -p 127.0.0.1:55439:5432 \
  -e POSTGRES_DB=dgt_test -e POSTGRES_USER=dgt_test \
  -e POSTGRES_PASSWORD=only-test-password \
  -v dgt-local-data:/var/lib/postgresql/data postgres:17
docker exec dgt-local-db pg_isready -U dgt_test -d dgt_test
```

Wait until PostgreSQL accepts connections. On subsequent runs use
`docker start dgt-local-db`. These credentials are for local development only.

## 2. Start the backend in terminal 1

```sh
mvn -f Backend/pom.xml -DskipTests package
FLYWAY_ENABLED=true sh Backend/run-development.sh
```

This starts port 8181 and applies V1–V16 to the fresh database. For an existing
non-Flyway database, follow FLYWAY_DEPLOYMENT.md instead; do not bypass validation
or automatically baseline it. Leave this terminal running.

Check from another terminal:

```sh
curl --fail http://localhost:8181/api/v1/health
```

Expected response: `{"status":"UP"}`.

## 3. Start the frontend in terminal 2

```sh
cd Frontend
npm ci
VITE_API_BASE_URL=http://localhost:8181/api/v1 VITE_DATA_ENV=development \
  npm run dev -- --host localhost --port 5173 --strictPort
```

Open http://localhost:5173. Use this exact port; backend CORS permits it.
`localhost` means your own computer, not the deployed EC2 server.

## 4. Accounts and optional portal integration

The migrations create schema/reference catalogs, not user accounts, stores or
production data. Production credentials will not work in an empty local database.
For signup, approval, account setup and support, clone the separate repository
https://github.com/rahulgoudthupakula/DGT_Client_handling alongside this repository
and follow its README to start its own PostgreSQL, backend (8182) and frontend
(5174). Configure a locally generated DGT_BRIDGE_KEY on both backends and use
local URLs. Bootstrap a local staff account using DGT_PORTAL_BOOTSTRAP_EMAIL and
DGT_PORTAL_BOOTSTRAP_PASSWORD (16–72 bytes); these are environment variables,
not values to commit. Submit a local signup, approve it in the local portal,
and open the generated account-setup link to create the client password.

Do not connect a developer checkout to production databases or reuse production
bridge keys. Portal integration is unnecessary for the backend health check.

## Connection errors

If the browser says “Cannot reach the configured backend”, first run the health
check above. A connection refusal means the backend is not listening. Inspect
terminal 1 for database connection, Java version or migration errors. A browser
CORS error can accompany a connection failure; it does not by itself prove CORS
is the cause. Restart Vite after changing VITE_API_BASE_URL.
