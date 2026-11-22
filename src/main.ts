import { InfraiClient } from "./infrai_client.ts";
import { recordShipmentEvent } from "./shipment_presence.ts";

const input = {
  shipment_id: "SHP-1042",
  event: "in_transit",
  actor_id: "dispatcher-7",
  proof_of_delivery: []
};

if (process.argv.includes("--live")) {
  const result = await recordShipmentEvent(new InfraiClient(), input);
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log("Dry run:", JSON.stringify(input));
}
