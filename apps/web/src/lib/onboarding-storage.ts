export interface OnboardingStorageState {
  completed: boolean;
  skipped: boolean;
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
    };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.warn("[onboarding-storage] Failed to save state:", err);
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
