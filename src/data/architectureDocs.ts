export const POSTGRESQL_TRANSACTION_SCHEMA = `-- =====================================================================
-- COMMUNITY POWER SHARE (CPS) SCALABLE DATABASE ARCHITECTURE (POSTGRESQL + TIMESCALEDB)
-- High-throughput, ACID-compliant ledger with partition strategies
-- =====================================================================

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    handle VARCHAR(64) UNIQUE NOT NULL,
    display_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    avatar_url TEXT,
    tier VARCHAR(32) NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'verified_monthly', 'verified_yearly')),
    is_active_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_heartbeat_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_tier_online ON users(tier, is_active_online);
CREATE INDEX idx_users_wallet ON users(wallet_address);

-- 2. SUBSCRIPTION BILLING TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier VARCHAR(32) NOT NULL CHECK (tier IN ('verified_monthly', 'verified_yearly')),
    plan_cost_usd NUMERIC(10, 2) NOT NULL, -- $1.00 or $12.00
    billing_provider VARCHAR(32) NOT NULL DEFAULT 'stripe', -- stripe, crypto_pay, apple_iap
    provider_subscription_id VARCHAR(128),
    status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

-- 3. PARTITIONED TRANSACTION HISTORY TABLE (High-Scale Financial Ledger)
-- Partitioned by month to ensure sub-millisecond query latency at 100M+ rows
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid(),
    idempotency_key VARCHAR(128) NOT NULL,
    user_id UUID NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('buy', 'sell', 'subscription', 'dividend', 'transfer')),
    token_amount NUMERIC(28, 8) NOT NULL,
    token_price_usd NUMERIC(20, 12) NOT NULL, -- Supports micro-prices down to 1e-12
    usd_total NUMERIC(18, 4) NOT NULL,
    active_verified_online_at_tx INT NOT NULL,
    tx_hash VARCHAR(66) NOT NULL,
    status VARCHAR(24) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Monthly Partitions Example
CREATE TABLE transactions_2026_09 PARTITION OF transactions
    FOR VALUES FROM ('2026-09-01 00:00:00+00') TO ('2026-10-01 00:00:00+00');
CREATE TABLE transactions_2026_10 PARTITION OF transactions
    FOR VALUES FROM ('2026-10-01 00:00:00+00') TO ('2026-11-01 00:00:00+00');

-- High-performance composite indexes
CREATE UNIQUE INDEX idx_transactions_idempotency 
    ON transactions (idempotency_key, created_at);
CREATE INDEX idx_transactions_user_time 
    ON transactions (user_id, created_at DESC);
CREATE INDEX idx_transactions_type 
    ON transactions (type, created_at DESC);

-- 4. REAL-TIME MARKET TICKS (TimescaleDB Hypertable)
CREATE TABLE IF NOT EXISTS market_price_ticks (
    time TIMESTAMPTZ NOT NULL,
    price_usd NUMERIC(20, 12) NOT NULL,
    active_verified_count INT NOT NULL,
    free_online_count INT NOT NULL,
    volume_usd NUMERIC(18, 4) NOT NULL,
    tick_sequence BIGSERIAL
);

-- Convert to Timescale hypertable (chunks by 1 day)
-- SELECT create_hypertable('market_price_ticks', 'time', chunk_time_interval => INTERVAL '1 day');
`;

export const REALTIME_API_INTEGRATION_STRATEGY = `
# Community Power Share (CPS) Real-Time Market Data & Presence Engine Architecture

## 1. Architecture Overview
To achieve sub-second dynamic pricing reactive to Actuators online, Community Power Share (CPS) employs a dual-channel real-time pipeline:
- **Downlink (Price Feed)**: Pub/Sub WebSocket stream broadcasting compressed price delta ticks to clients.
- **Uplink (Heartbeat)**: Ephemeral sliding-window heartbeats from Actuator clients via Redis HyperLogLog / Redis Sets.

\`\`\`
[Actuator Client] --- Heartbeat Ping (15s) ---> [Edge API Gateway / Cloudflare]
                                                       |
                                               [Redis Cluster]
                                            (SADD active_actuators:ts uid)
                                            (EXPIRE 30s)
                                                       |
[Price Engine Worker] <--- SCARD active_actuators:ts ---+
         |
    Calculate: P(N) = N * $0.0000001 (5 Actuators = $0.0000005, 6 Actuators = $0.0000006)
         |
         +---> Broadcast to [WebSocket Gateway / Redis PubSub]
                                     |
                             [Connected Clients]
\`\`\`

---

## 2. Presence Tracking & Sybil Resistance
1. **JWT Verification**: Each WebSocket handshake validates the user's active Actuator subscription JWT before registering into the presence count.
2. **Sliding Window TTL**:
   - Clients send a WebSocket ping every 15 seconds.
   - Redis key \`active_actuators\` maintains a Set with an atomic TTL of 30 seconds.
   - If a client disconnects, their presence naturally lapses within 30 seconds.
3. **Observer vs. Actuator Segregation**:
   - Observers connect to read-only room \`room:public_ticker\`.
   - Actuators join \`room:actuator_presence\` and register their unique user ID in the Actuator presence tally.
   - Even if 1,000,000 Observers connect, the price formula only queries \`SCARD active_actuators\`.

---

## 3. Real-Time API Endpoints & WebSocket Protocol

### WebSocket Connection: \`wss://api.cps.network/v1/market/stream\`

#### Client Subscription Message:
\`\`\`json
{
  "action": "subscribe",
  "channels": ["ticker", "presence", "trades"],
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
\`\`\`

#### Server Ticker Broadcast (Sent on tick change or 1Hz max):
\`\`\`json
{
  "type": "TICK",
  "data": {
    "symbol": "CPS",
    "priceUsd": 0.00000085,
    "basePrice": 0.00000010,
    "activeVerifiedOnline": 15,
    "freeUsersOnline": 420,
    "priceChange24h": "+14.8%",
    "timestamp": 1726588800000
  }
}
\`\`\`

### REST Fallback Endpoints:
- \`GET /api/v1/market/price\`: Current dynamic price, 24h stats, and online count.
- \`GET /api/v1/market/history?interval=1m&limit=100\`: Historical tick OHLCV.
- \`POST /api/v1/presence/heartbeat\`: Fallback HTTP heartbeat for mobile backgrounding.
- \`POST /api/v1/trade/execute\`: Idempotent execution with slippage tolerance.

---

## 4. Latency Mitigation & Optimistic UI
1. **Delta Compression**: Broadcast messages contain only changed values.
2. **Optimistic Presence Pulse**: When a user logs in or upgrades to Actuator, the client immediately estimates the single-user impact ($P_0 \\times \\alpha$) locally while the WebSocket round-trip confirms.
3. **Automatic Reconnection**: Reconnect with exponential backoff (1s, 2s, 4s, 8s max 30s) + jitter.
`;
