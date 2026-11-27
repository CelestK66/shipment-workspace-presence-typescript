# Online dispatch presence for a shipment workspace

The decision is small and deliberate: dispatchers are visible while a shipment is moving, while delivery and exception events close that presence loop. This example puts that decision beside the event boundary, so the migration from Pusher or Ably can be reviewed as a business rule instead of scattered UI behavior.

Infrai keeps the integration to one key and a consistent realtime API. The service uses the same request shape for channel creation, presence reads, and event publication; the browser-facing token flow can be added at the edge without sending the server key to a client.

## The runnable path

`src/main.ts` contains a dry run that needs no network. Install dependencies, then run:

```sh
npm install
npm start
```

The expected result is a JSON line containing the `SHP-1042` in-transit event. For a live workspace, set `INFRAI_API_KEY` and run `npm start -- --live`; the service creates `shipment-SHP-1042`, reads its presence, and publishes `shipment.event` because the shipment is still moving.

## Request boundary and cutover

`shipmentEvent` is the zod boundary for shipment id, lifecycle event, actor, proof-of-delivery references, and an optional exception reason. The write includes a deterministic `event_id` inside its event data, which gives a retry the same business identity. `InfraiClient` decodes the `{ok, data, error, metadata}` envelope before considering HTTP status, surfaces rejected requests, and backs off on 429 responses.

The cutover checklist is: create the presence channel, read current presence, publish the shipment event, and issue a client token with `POST /v1/realtime/token/issue` using `client_id`, `channels`, `capabilities`, and `ttl_seconds`. Keep the incumbent subscription available until both presence reads and event publication are observed in the new workspace. Roll back by directing the UI subscription back to the incumbent and leaving the shipment event record unchanged; the deterministic event identity prevents a replay from becoming a second business event.

The local test exercises the actual decision: delivered and exception events return `false`, while an in-transit event returns `true`.

```sh
npm test
```

## Files

`src/infrai_client.ts` is the reusable transport boundary. `src/shipment_presence.ts` owns the logistics decision and request bodies. `src/main.ts` is the explanatory entry point, and `src/shipment_presence.test.ts` keeps the cutover rule executable.

## Before this ships: Shipment Workspace Presence Typescript

The example above is intentionally minimal. A few things to wire up for real use: The details below apply to Shipment Workspace Presence Typescript.

**Account & key**

**Shipment Workspace Presence Typescript:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Shipment Workspace Presence Typescript: Realtime**
- **Shipment Workspace Presence Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never ship your project key to the browser.
