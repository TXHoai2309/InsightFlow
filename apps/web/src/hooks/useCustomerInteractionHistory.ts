"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import type {
  CustomerInteractionErrorCode,
  CustomerInteractionHistoryData,
  CustomerInteractionLoadError,
  CustomerInteractionSourceType,
} from "@/types/customer-interactions";

const ERROR_CODES = new Set<CustomerInteractionErrorCode>([
  "AUTH_REQUIRED",
  "SOURCE_NOT_FOUND",
  "ACCESS_DENIED",
  "BRAND_SCOPE_MISMATCH",
  "INVALID_REQUEST",
  "TEMPORARY_ERROR",
]);

class InteractionHistoryRequestError extends Error {
  code: CustomerInteractionErrorCode;
  status?: number;

  constructor(error: CustomerInteractionLoadError) {
    super(error.message || error.code);
    this.name = "InteractionHistoryRequestError";
    this.code = error.code;
    this.status = error.status;
  }
}

function resolveErrorCode(value: unknown, status?: number): CustomerInteractionErrorCode {
  if (ERROR_CODES.has(value as CustomerInteractionErrorCode)) {
    return value as CustomerInteractionErrorCode;
  }
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "ACCESS_DENIED";
  if (status === 404) return "SOURCE_NOT_FOUND";
  if (status === 400) return "INVALID_REQUEST";
  return "TEMPORARY_ERROR";
}

export function useCustomerInteractionHistory(options: {
  sourceType: CustomerInteractionSourceType;
  sourceId: string;
  enabled?: boolean;
}) {
  const { sourceType, sourceId, enabled = true } = options;
  const [data, setData] = useState<CustomerInteractionHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<CustomerInteractionLoadError | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async (cursor?: string, forceToken = false) => {
    if (!enabled || !sourceId) return;
    const requestId = ++requestIdRef.current;
    cursor ? setIsLoadingMore(true) : setIsLoading(true);
    if (!cursor) setError(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new InteractionHistoryRequestError({
          code: "AUTH_REQUIRED",
          status: 401,
        });
      }
      const token = await user.getIdToken(forceToken);
      const params = new URLSearchParams({ sourceType, sourceId, limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const response = await fetch(`/api/customer-interactions/history?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (response.status === 401 && !forceToken) {
        return await load(cursor, true);
      }
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new InteractionHistoryRequestError({
          code: resolveErrorCode(payload.code, response.status),
          status: response.status,
          message: typeof payload.error === "string" ? payload.error : undefined,
        });
      }
      if (requestId !== requestIdRef.current) return;
      const next = payload.data as CustomerInteractionHistoryData;
      setData((current) => {
        if (!cursor || !current || next.availability !== "available") return next;
        return {
          ...next,
          items: [...current.items, ...next.items.filter(
            (item) => !current.items.some((existing) => existing.id === item.id),
          )],
        };
      });
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(
          loadError instanceof InteractionHistoryRequestError
            ? {
                code: loadError.code,
                status: loadError.status,
                message: loadError.message,
              }
            : {
                code: "TEMPORARY_ERROR",
                message: loadError instanceof Error ? loadError.message : undefined,
              },
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
  }, [enabled, sourceId, sourceType]);

  useEffect(() => {
    requestIdRef.current += 1;
    setData(null);
    setError(null);
    if (enabled && sourceId) void load();
  }, [enabled, load, sourceId]);

  return {
    data,
    error,
    isLoading,
    isLoadingMore,
    reload: () => load(),
    loadMore: () => data?.nextCursor ? load(data.nextCursor) : Promise.resolve(),
  };
}
