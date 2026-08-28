# Nitto API

The API is the authoritative owner of accounts, garages, economy and online
race settlement. From the repository root:

```powershell
npm run typecheck
$env:NITTO_DATA_PATH = "C:\path\to\nitto.json"
$env:NITTO_WEB_ORIGIN = "http://127.0.0.1:5173"
npm run server
```

The web client uses `VITE_API_URL` in a production build. GitHub Pages cannot
run this process; deploy `apps/server` on a Node host with persistent storage,
HTTPS and backups before enabling public accounts.

## Production boundary

- Build the root `Dockerfile`, mount durable storage at `/data`, and terminate
  HTTPS at the hosting platform or reverse proxy.
- Set one exact `NITTO_WEB_ORIGIN`; do not use `*` with authenticated requests.
- Set a long random `NITTO_ADMIN_KEY`. Admin endpoints expose aggregate status,
  the economy ledger, verified race inspection, account moderation and an
  on-demand data backup. They are intentionally not linked from the game UI.
- Monitor `GET /api/health`. Server errors are written as timestamped structured
  stack records to stderr for the host's log collector.
- Back up the mounted data volume independently. The admin backup endpoint is a
  convenient snapshot, not a substitute for off-host backups.

The API applies request-size limits, per-address rate limits, strict input
timeline validation, security headers, replay-based race verification, wager
escrow and session revocation for moderated accounts.
