# Ownership and deployment contract

This document is required reading for any person or AI changing hosting,
environment variables, authentication, persistence, the GitHub Pages workflow,
or the Garage data model.

## Current public state

The public GitHub Pages site is a static web-client deployment. At the time of
writing it has no deployed API configured through `VITE_API_URL`.

That means the public site currently runs the intentional offline fallback:

- garage state is saved in that browser's `localStorage`;
- cash and owned cars can be edited by the browser user;
- progress does not follow the player to another browser or device;
- the displayed car is **not yet tied to a server account id**.

Never describe GitHub Pages by itself as an online or server-authoritative game.
Pushing `main` updates the client but does not deploy the Node API.

## Identity and ownership chain

The online implementation already establishes two independent identities:

```text
Account UUID
  -> Account.garage
     -> selectedVehicleId
     -> owned vehicle instance UUID
        -> model/build
        -> owned and fitted parts
        -> tune
        -> condition
        -> appearance recipe
```

- Registration assigns `Account.id` with `randomUUID()`.
- A session token maps to exactly one `accountId` and expires after 30 days.
- `requireAccount` resolves every protected request from that session; the
  client is never allowed to nominate which account receives a garage mutation.
- `Account.garage` is the authoritative wallet, record and vehicle collection.
- An online car purchase assigns a new vehicle-instance id with `randomUUID()`.
  This is separate from the model id, so one account may own two independently
  modified copies of the same model.
- `selectedVehicleId` points to the exact owned instance used by Garage,
  Speedshop, paint, tuning and verified races.
- Each authenticated garage action loads the session's account, applies shared
  game-core rules to `account.garage`, and persists the returned state.
- A verified race locks the selected vehicle id and a garage snapshot so later
  configuration changes cannot rewrite an already-submitted run.

Do not flatten this into a list of model ids, attach appearance to a model, or
accept account ids, balances, owned vehicles or result slips from the client.

## Activation configuration

Deploy the API first. Its required production boundary is:

```text
PORT=8787
NITTO_DATA_PATH=/data/nitto.json
NITTO_WEB_ORIGIN=https://evaken.github.io
NITTO_ADMIN_KEY=<long random secret>
```

`NITTO_DATA_PATH` must be on durable mounted storage with off-host backups.
`NITTO_WEB_ORIGIN` must be the exact HTTPS web origin, never `*`.
The admin key must be stored as a host secret and must never be committed or
placed in the web build.

After the API has a stable HTTPS URL, rebuild the web client with:

```text
VITE_API_URL=https://<api-host>
```

`VITE_API_URL` is a Vite build-time variable. Adding it only to a running API
container does nothing; it must be present when the GitHub Pages client bundle
is built. Never put database credentials, the admin key or other secrets in a
`VITE_` variable because Vite embeds those values in public JavaScript.

## Do not declare activation complete until

- `GET /api/health` succeeds over HTTPS;
- the API has durable storage and a tested off-host backup;
- the API permits only the exact Pages origin;
- the Pages build was produced with the correct `VITE_API_URL`;
- the Main screen offers registration/login rather than “Online server not
  configured”;
- registering two users returns two different account UUIDs;
- buying two copies of one model returns two different vehicle UUIDs;
- signing out and signing back in restores cash, cars, parts, tune, condition
  and appearance from the server;
- opening a second browser/device restores the same garage after login;
- changing browser `localStorage` does not change an authenticated account;
- unauthenticated and cross-account garage mutations return `401`/`403`;
- CI typecheck, tests and production build pass.

## Persistence maturity

The current `JsonStore` serializes in-process mutations and writes by temporary
file plus rename. It is a sound single-instance prototype and includes migration
and backup support, but it is not a horizontally scalable production database.

Before running multiple API replicas or treating the economy as durable at
public scale, replace the store with a transactional database such as PostgreSQL
while preserving the `Account.garage` and vehicle-instance identity model. The
game rules should remain in `game-core`; changing persistence must not move
authority back into the React client.

## Source map

- Ownership model: `packages/game-core/src/garage.ts`
- Account/session model: `apps/server/src/types.ts`
- Authenticated mutations and race verification: `apps/server/src/service.ts`
- Atomic prototype persistence: `apps/server/src/store.ts`
- Browser online/offline switch: `apps/web/src/App.tsx`
- API client and `VITE_API_URL`: `apps/web/src/onlineApi.ts`
- Server environment example: `apps/server/server.env.example`
- Container and durable `/data` boundary: `Dockerfile`
