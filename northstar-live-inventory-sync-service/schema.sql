CREATE TABLE IF NOT EXISTS inventory (
    sku TEXT PRIMARY KEY,

    product_name TEXT NOT NULL,

    quantity INTEGER NOT NULL
        CHECK (quantity >= 0),

    source_version BIGINT NOT NULL,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS outbox (
    id BIGSERIAL PRIMARY KEY,

    event_id UUID NOT NULL UNIQUE,

    sku TEXT NOT NULL
        REFERENCES inventory(sku),

    event_type TEXT NOT NULL,

    payload JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    processed_at TIMESTAMPTZ
);


CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed
ON outbox (id)
WHERE processed_at IS NULL;


INSERT INTO inventory (
    sku,
    product_name,
    quantity,
    source_version
)
VALUES
    ('NS-1001', 'Northstar Everyday Mug', 24, 100),
    ('NS-1002', 'Northstar Canvas Tote', 7, 41),
    ('NS-1003', 'Northstar Desk Lamp', 0, 88)
ON CONFLICT (sku) DO NOTHING;