"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import type {
  LeadActivityHistoryData,
  LeadActivityLoadErrorCode,
} from "@/types/lead-activity";

export function useLeadActivityHistory(leadId: string) {
  const [data, setData] = useState<LeadActivityHistoryData | null>(null);
  const [errorCode, setErrorCode] = useState<LeadActivityLoadErrorCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (cursor?: string, forceToken = false) => {
    if (!leadId) return;
    const requestId = ++requestIdRef.current;
    cursor ? setIsLoadingMore(true) : setIsLoading(true);
    if (!cursor) setErrorCode(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        setErrorCode("AUTH_REQUIRED");
        return;
      }
      const token = await user.getIdToken(forceToken);
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(
        `/api/leads/${encodeURIComponent(leadId)}/activity?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
      );
      if (response.status === 401 && !forceToken) {
        return await load(cursor, true);
      }
      const payload = await response.json().catch(() => ({}));
      if (response.status === 404 || payload.code === "LEAD_NOT_FOUND") {
        if (requestId === requestIdRef.current) {
          setData({ availability: "legacy_snapshot", total: 0, events: [] });
        }
        return;
      }
      if (!response.ok) {
        if (response.status === 401) throw new Error("AUTH_REQUIRED");
        if (response.status === 403) throw new Error("ACCESS_DENIED");
        throw new Error("TEMPORARY_ERROR");
      }
      if (requestId !== requestIdRef.current) return;
      const next = payload.data as LeadActivityHistoryData;
      setData((current) => {
        if (!cursor || !current) return next;
        return {
          ...next,
          total: current.total || next.total,
          events: [
            ...current.events,
            ...next.events.filter(
              (event) => !current.events.some((existing) => existing.id === event.id),
            ),
          ],
        };
      });
    } catch (error) {
      if (requestId === requestIdRef.current) {
        const code = error instanceof Error ? error.message : "TEMPORARY_ERROR";
        setErrorCode(
          code === "AUTH_REQUIRED" || code === "ACCESS_DENIED"
            ? code
            : "TEMPORARY_ERROR",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [leadId]);

  useEffect(() => {
    requestIdRef.current += 1;
    setData(null);
    setErrorCode(null);
    if (leadId) void load();
  }, [leadId, load]);

  return {
    data,
    errorCode,
    isLoading,
    isLoadingMore,
    reload: () => load(),
    loadMore: () => data?.nextCursor ? load(data.nextCursor) : Promise.resolve(),
  };
}

