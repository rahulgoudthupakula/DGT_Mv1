CREATE TABLE refresh_tokens (
    token_id   BIGSERIAL    PRIMARY KEY,
    token_hash VARCHAR(64)  NOT NULL UNIQUE,
    user_id    BIGINT       NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ  NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
