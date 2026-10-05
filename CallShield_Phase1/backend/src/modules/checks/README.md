# Scam-check pilot

The visible frontend uses GET/POST /v1/checks/demo. Only a server-owned fictional
scenario ID, supported language and explicit consent are accepted. Arbitrary text
and images are rejected by validation before the unpaid Gemini service is called.
Model: gemini-3.5-flash-lite. Secret: GEMINI_API_KEY, backend only.

AI_PROVIDER=gemini-demo is the intended deployment configuration. Real evidence
checks at POST /v1/checks remain disabled unless AI_PROVIDER=openai is explicitly
set and OPENAI_API_KEY configured. Never silently route real evidence to Gemini.

The AiCheckBudget migration enforces 100 reserved requests per database day across
instances. Failures consume reservations. Provider quota may impose lower limits.
No submitted messages, images or identities are stored in this budget table.

Verification: npm run build, then node --test test/*.test.cjs. Live fictional
payment, blackmail, Hindi OTP and ordinary invitation checks were exercised.
These are smoke checks, not a validated scam-detection accuracy benchmark.
