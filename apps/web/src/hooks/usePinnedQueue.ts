"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export const MAX_PINNED_QUEUE_ITEMS = 3;

function readPinnedIds(storageKey: string, maxItems: number) {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return Array.from(
      new Set(parsed.filter((value): value is string => typeof value === "string" && value.trim().length > 0)),
    ).slice(0, maxItems);
  } catch {
    return [];
  }
}

export function usePinnedQueue(storageKey: string, maxItems = MAX_PINNED_QUEUE_ITEMS) {
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const hydratedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    setPinnedIds(readPinnedIds(storageKey, maxItems));
    hydratedKeyRef.current = storageKey;
  }, [maxItems, storageKey]);

  useEffect(() => {
    if (typeof window === "undefined" || hydratedKeyRef.current !== storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(pinnedIds.slice(0, maxItems)));
  }, [maxItems, pinnedIds, storageKey]);

  const togglePinned = useCallback((id: string) => {
    if (pinnedIds.includes(id)) {
      setPinnedIds((current) => current.filter((itemId) => itemId !== id));
      return true;
    }
    if (pinnedIds.length >= maxItems) return false;
    setPinnedIds((current) => [...current, id].slice(0, maxItems));
    return true;
  }, [maxItems, pinnedIds]);

  const prunePinned = useCallback((validIds: Iterable<string>) => {
    const validIdSet = new Set(validIds);
    setPinnedIds((current) => {
      const next = current.filter((id) => validIdSet.has(id)).slice(0, maxItems);
      return next.length === current.length && next.every((id, index) => id === current[index])
        ? current
        : next;
    });
  }, [maxItems]);

  return {
    pinnedIds,
    pinnedCount: pinnedIds.length,
    atLimit: pinnedIds.length >= maxItems,
    maxItems,
    togglePinned,
    prunePinned,
  };
}
