import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowPresence, shipmentEvent } from "./shipment_presence.ts";

test("delivery and exception events stop presence publication", () => {
  const delivered = shipmentEvent.parse({ shipment_id: "S1", event: "delivered", actor_id: "u1" });
  const exception = shipmentEvent.parse({ shipment_id: "S1", event: "exception", actor_id: "u1", exception_reason: "seal" });
  const moving = shipmentEvent.parse({ shipment_id: "S1", event: "in_transit", actor_id: "u1" });
  assert.equal(shouldShowPresence(delivered), false);
  assert.equal(shouldShowPresence(exception), false);
  assert.equal(shouldShowPresence(moving), true);
});
