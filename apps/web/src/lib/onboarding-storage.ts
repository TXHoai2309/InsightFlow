import { auth } from "@/lib/firebase";

export interface OnboardingStorageState {
  completed: boolean;
  skipped: boolean;
  currentStepIndex?: number;
  updatedAt?: string;
  completedAt?: string;
  skippedAt?: string;
}

export function getOnboardingStorageKey(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
): string {
  const cleanUser = userId && userId.trim() ? userId.trim() : "guest";
  const cleanRoute = routeKey.replace(/^\//, "").replace(/\//g, "_") || "home";
  return `insightflow:onboarding:${cleanUser}:${cleanRoute}:v${version}`;
}

export function getOnboardingState(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
): OnboardingStorageState | null {
  if (typeof window === "undefined") return null;
  try {
    const key = getOnboardingStorageKey(userId, routeKey, version);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as OnboardingStorageState;
  } catch (err) {
    console.warn("[onboarding-storage] Failed to parse state:", err);
    return null;
  }
}

export function setOnboardingState(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
  state: Partial<OnboardingStorageState>,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getOnboardingStorageKey(userId, routeKey, version);
    const existing = getOnboardingState(userId, routeKey, version) || {
      completed: false,
      skipped: false,
    };
    const updated: OnboardingStorageState = {
      ...existing,
      ...state,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("[onboarding-storage] Failed to save state:", err);
  }
}

export async function getSyncedOnboardingState(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
): Promise<OnboardingStorageState | null> {
  const localState = getOnboardingState(userId, routeKey, version);
  if (!userId || userId === "guest") return localState;

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return localState;
    const response = await fetch(
      `/api/auth/onboarding?routeKey=${encodeURIComponent(routeKey)}&version=${version}`,
      {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!response.ok) return localState;
    const payload = (await response.json()) as { data?: OnboardingStorageState | null };
    if (!payload.data) return localState;

    const remoteState = payload.data;
    const localUpdated = Date.parse(localState?.updatedAt || "") || 0;
    const remoteUpdated = Date.parse(remoteState.updatedAt || "") || 0;
    const resolved = localUpdated > remoteUpdated ? localState : remoteState;
    if (resolved) setOnboardingState(userId, routeKey, version, resolved);
    return resolved;
  } catch {
    return localState;
  }
}

export async function setSyncedOnboardingState(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
  state: Partial<OnboardingStorageState>,
): Promise<void> {
  setOnboardingState(userId, routeKey, version, state);
  if (!userId || userId === "guest") return;

  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) return;
    await fetch("/api/auth/onboarding", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ routeKey, version, state }),
    });
  } catch {
    // Local progress remains the offline fallback.
  }
}

export function clearOnboardingState(
  userId: string | null | undefined,
  routeKey: string,
  version: number,
): void {
  if (typeof window === "undefined") return;
  try {
    const key = getOnboardingStorageKey(userId, routeKey, version);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn("[onboarding-storage] Failed to clear state:", err);
  }
}
