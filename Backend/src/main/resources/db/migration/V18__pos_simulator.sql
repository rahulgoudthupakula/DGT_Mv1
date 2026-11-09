CREATE TABLE pos_connectors (
 connector_id uuid PRIMARY KEY, dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id),
 credential_hash varchar(64) NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true,
 source_system varchar(50) NOT NULL DEFAULT 'VERIFONE_COMMANDER_SIMULATOR' CHECK(source_system='VERIFONE_COMMANDER_SIMULATOR'),
 schedule_minutes integer NOT NULL DEFAULT 0 CHECK(schedule_minutes IN (0,5,15,30,60)),
 heartbeat_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE pos_mappings (
 connector_id uuid NOT NULL REFERENCES pos_connectors, kind varchar(12) NOT NULL CHECK(kind IN ('REGISTER','CASHIER','PRODUCT','TENDER')),
 source_code varchar(100) NOT NULL, target_id bigint NOT NULL, PRIMARY KEY(connector_id,kind,source_code)
);
CREATE TABLE pos_ingestions (
 ingestion_id uuid PRIMARY KEY, connector_id uuid NOT NULL REFERENCES pos_connectors,
 dgt_id varchar(50) NOT NULL REFERENCES stores(dgt_id), source_system varchar(50) NOT NULL,
 source_transaction_id varchar(100) NOT NULL, payload_hash varchar(64) NOT NULL, payload jsonb NOT NULL,
 status varchar(12) NOT NULL CHECK(status IN ('ACCEPTED','HELD','REJECTED')), reason varchar(300),
 sale_id bigint REFERENCES sales, attempts integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(dgt_id,source_system,source_transaction_id)
);
CREATE TABLE pos_sync_events (
 event_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 connector_id uuid NOT NULL REFERENCES pos_connectors, ingestion_id uuid REFERENCES pos_ingestions,
 result varchar(30) NOT NULL, detail varchar(300), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pos_ingestions_store_date ON pos_ingestions(dgt_id,created_at DESC);
CREATE INDEX pos_events_connector_date ON pos_sync_events(connector_id,created_at DESC);
