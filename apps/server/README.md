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
