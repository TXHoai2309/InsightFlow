"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { isDemoRuntime } from "@/lib/demo-navigation";

export interface AlertViewer {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  lastSeenAt: string;
}

interface UseViewPresenceOptions {
  resource: "alerts" | "leads";
  resourceId: string | null;
  enabled: boolean;
}

const HEARTBEAT_INTERVAL_MS = 15_000;
const REFRESH_INTERVAL_MS = 5_000;

function useViewPresence({ resource, resourceId, enabled }: UseViewPresenceOptions) {
  const [viewers, setViewers] = useState<AlertViewer[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (isDemoRuntime() || !enabled || !resourceId || !currentUser) {
      setViewers([]);
      return;
    }

    let disposed = false;
    let bearerToken = "";
    let requestInFlight = false;
    const endpoint = `/api/view-presence/${resource}/${encodeURIComponent(resourceId)}`;

    const syncPresence = async (method: "GET" | "POST") => {
      if (disposed || requestInFlight) return;
      requestInFlight = true;
      try {
        const token = await currentUser.getIdToken();
        if (disposed) return;
        bearerToken = token;
        const response = await fetch(endpoint, {
          method,
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.error || `HTTP ${response.status}`);
        }
        if (!disposed) {
          setViewers(Array.isArray(payload.viewers) ? payload.viewers : []);
        }
      } finally {
        requestInFlight = false;
      }
    };

    const sendHeartbeat = () => {
      void syncPresence("POST").catch((error) => {
        console.error("[View presence] heartbeat failed:", error);
      });
    };

    const refreshViewers = () => {
      void syncPresence("GET").catch((error) => {
        console.error("[View presence] refresh failed:", error);
      });
    };

    const leave = () => {
      if (!bearerToken) return;
      void fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${bearerToken}` },
        keepalive: true,
      }).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
      else leave();
    };

    sendHeartbeat();
    const heartbeatInterval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    const refreshInterval = window.setInterval(refreshViewers, REFRESH_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", leave);

    return () => {
      disposed = true;
      window.clearInterval(heartbeatInterval);
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", leave);
      leave();
      setViewers([]);
    };
  }, [resource, resourceId, enabled]);

  return viewers;
}

export function useAlertViewPresence({ alertId, enabled }: { alertId: string | null; enabled: boolean }) {
  return useViewPresence({ resource: "alerts", resourceId: alertId, enabled });
}

export function useLeadViewPresence({ leadId, enabled }: { leadId: string | null; enabled: boolean }) {
  return useViewPresence({ resource: "leads", resourceId: leadId, enabled });
}
