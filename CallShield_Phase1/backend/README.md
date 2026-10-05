# CallShield API

## Prerequisites

- Node.js 20+
- PostgreSQL 18+
- npm

## Setup

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

The API will be available at `http://localhost:3000`.

## Core endpoints

- `GET /health`
- `GET /v1/numbers/:e164`
- `POST /v1/numbers/:e164/reports`
- `GET /v1/numbers/:e164/risk`
- `GET /v1/blocklist`
- `POST /v1/blocklist`
- `DELETE /v1/blocklist/:e164`
- `GET /v1/whitelist`
- `POST /v1/whitelist`
- `DELETE /v1/whitelist/:e164`

This is the Phase 1 foundation. Authentication middleware is intentionally kept as a replaceable boundary until the identity provider is selected.

## Protection API smoke test

Run against a **disposable test database** after building and starting the API:

```bash
CALLSHIELD_TEST_API=http://127.0.0.1:3000/v1 node scripts/protection-smoke.cjs
```

This checks health, protection actions for unknown callers, block/trust reversals,
repeat writes, and report submission. It creates two test phone records and a
report; discard the test database afterward.
