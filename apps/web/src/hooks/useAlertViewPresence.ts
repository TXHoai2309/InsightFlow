"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";

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

const LOAD_INTERVAL_MS = 2_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

function useViewPresence({ resource, resourceId, enabled }: UseViewPresenceOptions) {
  const [viewers, setViewers] = useState<AlertViewer[]>([]);

  useEffect(() => {
    if (!enabled || !resourceId) {
      setViewers([]);
      return;
    }

    let disposed = false;
    let cachedToken = "";
    const endpoint = `/api/${resource}/${encodeURIComponent(resourceId)}/viewers`;

    const getToken = async () => {
      cachedToken = cachedToken || await auth.currentUser?.getIdToken() || "";
      return cachedToken;
    };

    const loadViewers = async () => {
      try {
        const token = await getToken();
        if (!token || disposed) return;
        const response = await fetch(endpoint, {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        if (response.status === 401 || response.status === 403) {
          cachedToken = "";
          if (!disposed) setViewers([]);
          return;
        }
        if (!response.ok) return;
        const payload = await response.json() as { viewers?: AlertViewer[] };
        if (!disposed) setViewers(Array.isArray(payload.viewers) ? payload.viewers : []);
      } catch {
        // Presence is supplementary and must never interrupt the workbench.
      }
    };

    const heartbeat = async () => {
      try {
        const token = await getToken();
        if (!token || disposed) return;
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 401 || response.status === 403) cachedToken = "";
        if (response.ok) await loadViewers();
      } catch {
        // A transient heartbeat failure expires naturally on the server.
      }
    };

    const leave = () => {
      if (!cachedToken) return;
      void fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cachedToken}` },
        keepalive: true,
      }).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void heartbeat();
    };

    void heartbeat();
    const loadInterval = window.setInterval(() => void loadViewers(), LOAD_INTERVAL_MS);
    const heartbeatInterval = window.setInterval(() => void heartbeat(), HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", leave);

    return () => {
      disposed = true;
      window.clearInterval(loadInterval);
      window.clearInterval(heartbeatInterval);
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
