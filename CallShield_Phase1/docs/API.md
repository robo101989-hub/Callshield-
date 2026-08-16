# CallShield Phase 1 API Contract

Base URL: `/v1`

## Health

`GET /health`

## Number intelligence

`GET /numbers/:e164`

Returns reputation, reports, campaign links and source-aware location metadata.

## Risk

`GET /numbers/:e164/risk`

Returns score and classification.

## Report

`POST /numbers/:e164/reports`

Body:

```json
{
  "category": "UPI_FRAUD",
  "severity": "HIGH",
  "description": "Suspicious payment request"
}
```

## Blocklist

- `GET /blocklist`
- `POST /blocklist`
- `DELETE /blocklist/:e164`

## Whitelist

- `GET /whitelist`
- `POST /whitelist`
- `DELETE /whitelist/:e164`
