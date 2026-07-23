"use client";

import { useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
import { auth, dbSecond } from "@/lib/firebase";
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
const ACTIVE_WINDOW_MS = 120_000;

function useViewPresence({ resource, resourceId, enabled }: UseViewPresenceOptions) {
  const [viewers, setViewers] = useState<AlertViewer[]>([]);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (isDemoRuntime() || !enabled || !resourceId || !currentUser || !dbSecond) {
      setViewers([]);
      return;
    }

    let disposed = false;
    const collectionName = resource === "alerts" ? "alert_view_presence" : "lead_view_presence";
    const viewersCollection = collection(dbSecond, collectionName, resourceId, "viewers");
    const viewerRef = doc(viewersCollection, currentUser.uid);

    const heartbeat = async () => {
      if (disposed) return;
      await setDoc(viewerRef, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || currentUser.email || "Người dùng",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || "",
        lastSeenAt: Timestamp.now(),
      }, { merge: true });
    };

    const sendHeartbeat = () => {
      void heartbeat().catch((error) => {
        console.error("[View presence] Firestore heartbeat failed:", error);
      });
    };

    const leave = () => {
      void deleteDoc(viewerRef).catch(() => undefined);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };

    const unsubscribe = onSnapshot(viewersCollection, (snapshot) => {
      if (disposed) return;
      const activeSince = Date.now() - ACTIVE_WINDOW_MS;
      const activeViewers = snapshot.docs.flatMap((viewerDoc) => {
        const data = viewerDoc.data() as Partial<AlertViewer> & { lastSeenAt?: Timestamp };
        const lastSeenAtMs = data.lastSeenAt?.toMillis?.() || 0;
        if (lastSeenAtMs < activeSince) return [];
        return [{
          uid: viewerDoc.id,
          displayName: data.displayName || data.email || "Người dùng",
          email: data.email || "",
          photoURL: data.photoURL || "",
          lastSeenAt: new Date(lastSeenAtMs).toISOString(),
        }];
      });
      setViewers(activeViewers.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt)));
    }, (error) => {
      console.error("[View presence] Firestore subscription failed:", error);
      if (!disposed) setViewers([]);
    });

    sendHeartbeat();
    const heartbeatInterval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", leave);

    return () => {
      disposed = true;
      window.clearInterval(heartbeatInterval);
      unsubscribe();
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
