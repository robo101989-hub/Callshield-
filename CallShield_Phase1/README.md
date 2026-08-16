# CallShield — Phase 1 Backend Foundation

Phase 1 turns the CallShield prototype into a real backend foundation.

## Scope

- PostgreSQL data model
- REST API foundation
- Number intelligence
- Community reports
- Deterministic risk engine
- Block/whitelist
- Basic admin controls
- Authentication-ready structure
- Health endpoint
- OpenAPI-ready API conventions

## Stack

- Node.js + TypeScript
- NestJS
- Prisma ORM
- PostgreSQL 18
- JWT authentication
- Redis reserved for Phase 2 caching

PostgreSQL 18 is the current supported major release; this scaffold deliberately avoids using the PostgreSQL 19 beta in production. See the official PostgreSQL versioning policy.

## Run

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL`.
3. Install dependencies.
4. Run Prisma migration.
5. Start the API.

See `backend/README.md`.
