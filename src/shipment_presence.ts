import { z } from "zod";
import { InfraiClient, infrai } from "./infrai_client.ts";

export const shipmentEvent = z.object({
  shipment_id: z.string().min(1),
  event: z.enum(["picked_up", "in_transit", "delivered", "exception"]),
  actor_id: z.string().min(1),
  proof_of_delivery: z.array(z.string()).default([]),
  exception_reason: z.string().optional()
});

export type ShipmentEvent = z.infer<typeof shipmentEvent>;

export function shouldShowPresence(event: ShipmentEvent): boolean {
  return event.event !== "delivered" && event.event !== "exception";
}

export async function recordShipmentEvent(client: InfraiClient, input: unknown) {
  const event = shipmentEvent.parse(input);
  const channel = `shipment-${event.shipment_id}`;
  await client.request("/v1/realtime/channel/create", "POST", { channel, type: "presence", vendor: "tencent_im" });
  const presence = await client.request(`/v1/realtime/presence/get/${channel}`, "GET");
  if (shouldShowPresence(event)) {
    await client.request("/v1/realtime/publish", "POST", {
      channel,
      event: "shipment.event",
      data: { ...event, event_id: `${event.shipment_id}:${event.event}:${event.actor_id}` },
      account_id: event.actor_id
    });
  }
  return { channel, event, online: presence.data ?? [], presenceCapability: infrai.realtime.presence.get };
}
