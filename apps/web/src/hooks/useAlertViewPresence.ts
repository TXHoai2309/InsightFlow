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

interface UseAlertViewPresenceOptions {
  alertId: string | null;
  enabled: boolean;
}

const LOAD_INTERVAL_MS = 5_000;
const HEARTBEAT_INTERVAL_MS = 15_000;

export function useAlertViewPresence({ alertId, enabled }: UseAlertViewPresenceOptions) {
  const [viewers, setViewers] = useState<AlertViewer[]>([]);

  useEffect(() => {
    if (!enabled || !alertId) {
      setViewers([]);
      return;
    }

    let disposed = false;
    let cachedToken = "";
    const endpoint = `/api/alerts/${encodeURIComponent(alertId)}/viewers`;

    const getToken = async () => {
      cachedToken = cachedToken || await auth.currentUser?.getIdToken() || "";
      return cachedToken;
    };

    const loadViewers = async () => {
      const token = await getToken();
      if (!token || disposed) return;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!response.ok) return;
      const payload = await response.json() as { viewers?: AlertViewer[] };
      if (!disposed) setViewers(Array.isArray(payload.viewers) ? payload.viewers : []);
    };

    const heartbeat = async () => {
      if (document.visibilityState === "hidden") return;
      const token = await getToken();
      if (!token || disposed) return;
      await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadViewers();
    };

    const leave = () => {
      if (!cachedToken) return;
      void fetch(endpoint, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${cachedToken}` },
        keepalive: true,
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") leave();
      else void heartbeat();
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
  }, [alertId, enabled]);

  return viewers;
}
