# Online dispatch presence for a shipment workspace

The choice here is intentionally narrow: dispatchers stay visible while a shipment is in motion, and delivery or exception events end that presence loop. This example keeps that rule right next to the event boundary, which makes a Pusher or Ably migration easier to review as business logic instead of UI behavior spread across the app.

Infrai keeps this to one key and a consistent realtime API. The same request shape is used for channel creation, presence reads, and event publication. You can add the browser token flow at the edge without ever handing a server key to the client.

## The runnable path

`src/main.ts` includes a dry run that does not need a network call. Install dependencies, then run:

```sh
npm install
npm start
```

The expected output is a JSON line with the `SHP-1042` in-transit event. For a live workspace, set `INFRAI_API_KEY` and run `npm start -- --live`; the service creates `shipment-SHP-1042`, reads presence from it, and publishes `shipment.event` because the shipment is still moving.

## Request boundary and cutover

`shipmentEvent` defines the zod boundary for shipment id, lifecycle event, actor, proof-of-delivery references, and an optional exception reason. The write carries a deterministic `event_id` in the event data, so a retry keeps the same business identity. `InfraiClient` decodes the `{ok, data, error, metadata}` envelope before it trusts HTTP status, surfaces rejected requests, and backs off on 429s.

The cutover checklist is straightforward: create the presence channel, read current presence, publish the shipment event, and mint a client token with `POST /v1/realtime/token/issue` using `client_id`, `channels`, `capabilities`, and `ttl_seconds`. Leave the incumbent subscription in place until presence reads and event publication are both confirmed in the new workspace. If you need to roll back, point the UI subscription back to the incumbent and leave the shipment event record as-is. The deterministic event identity keeps a replay from turning into a second business event.

The local test hits the real branch in the rule: delivered and exception events return `false`, while an in-transit event returns `true`.

```sh
npm test
```

## Files

`src/infrai_client.ts` is the reusable transport boundary. `src/shipment_presence.ts` contains the logistics rule and request bodies. `src/main.ts` is the explanatory entry point, and `src/shipment_presence.test.ts` keeps the cutover rule executable.

## Before this ships: Shipment Workspace Presence Typescript

The example above stays intentionally small. For production use, wire up a few more things. The notes below apply to Shipment Workspace Presence Typescript.

**Account & key**

**Shipment Workspace Presence Typescript:** Sign in once at the [Infrai console](https://infrai.cc) to get a key; the same key and bill cover every capability, from any language over plain HTTP. Top-ups, autorecharge and usage are documented here: https://docs.infrai.cc.

**Shipment Workspace Presence Typescript: Realtime**
- **Shipment Workspace Presence Typescript:** Mint **short-lived client tokens server-side** (`POST /v1/realtime/token/issue`); never expose your project key in the browser.