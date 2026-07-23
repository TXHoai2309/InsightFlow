import { supabaseClient } from "@/lib/supabaseClient";
import type { Lead } from "@/types/dashboard";

let activeLeadRealtimeChannel: ReturnType<NonNullable<typeof supabaseClient>["channel"]> | null = null;

export function setActiveLeadRealtimeChannel(
  channel: ReturnType<NonNullable<typeof supabaseClient>["channel"]> | null,
) {
  activeLeadRealtimeChannel = channel;
}

export function getActiveLeadRealtimeChannel() {
  return activeLeadRealtimeChannel;
}

export async function broadcastLeadRealtimeUpdate(
  payload: { leadId: string } & Partial<Lead>,
) {
  if (activeLeadRealtimeChannel) {
    try {
      await activeLeadRealtimeChannel.send({
        type: "broadcast",
        event: "lead_assigned",
        payload,
      });
      console.log("[realtimeLeads] ✅ Broadcast lead_assigned sent:", payload.leadId);
    } catch (err) {
      console.warn("[realtimeLeads] Failed to broadcast lead update:", err);
    }
  }
}
