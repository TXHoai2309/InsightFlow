import {
  DEFAULT_LEAD_WORKBENCH_FILTERS,
  type LeadUpdatedRangeFilter,
  type LeadWorkbenchFilters,
} from "@/lib/lead-filters";

export interface LeadFilterSessionIdentity {
  userId: string;
  loginSessionId: string;
}

export interface LeadDateFilterState {
  updatedRange: LeadUpdatedRangeFilter;
  customStartDate?: string;
  customEndDate?: string;
}

interface StoredLeadDateFilterState extends LeadDateFilterState {
  loginSessionId: string;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_PREFIX = "insightflow.leads.date-filter.";
const VALID_RANGES = new Set<LeadUpdatedRangeFilter>([
  "all",
  "today",
  "7d",
  "30d",
  "custom",
]);

function getStorageKey(userId: string) {
  return `${STORAGE_PREFIX}${encodeURIComponent(userId)}`;
}

export function getLeadDateFilterState(
  filters: Pick<
    LeadWorkbenchFilters,
    "updatedRange" | "customStartDate" | "customEndDate"
  >,
): LeadDateFilterState {
  return {
    updatedRange: filters.updatedRange,
    customStartDate:
      filters.updatedRange === "custom" ? filters.customStartDate : undefined,
    customEndDate:
      filters.updatedRange === "custom" ? filters.customEndDate : undefined,
  };
}

export function readLeadDateFilterSession(
  storage: StorageLike,
  identity: LeadFilterSessionIdentity,
): LeadDateFilterState | null {
  try {
    const raw = storage.getItem(getStorageKey(identity.userId));
    if (!raw) return null;

    const stored = JSON.parse(raw) as Partial<StoredLeadDateFilterState>;
    if (
      stored.loginSessionId !== identity.loginSessionId ||
      !VALID_RANGES.has(stored.updatedRange as LeadUpdatedRangeFilter)
    ) {
      return null;
    }

    return {
      updatedRange: stored.updatedRange as LeadUpdatedRangeFilter,
      customStartDate:
        stored.updatedRange === "custom" ? stored.customStartDate : undefined,
      customEndDate:
        stored.updatedRange === "custom" ? stored.customEndDate : undefined,
    };
  } catch {
    return null;
  }
}

export function writeLeadDateFilterSession(
  storage: StorageLike,
  identity: LeadFilterSessionIdentity,
  filters: Pick<
    LeadWorkbenchFilters,
    "updatedRange" | "customStartDate" | "customEndDate"
  >,
) {
  const dateFilter = getLeadDateFilterState(filters);
  try {
    storage.setItem(
      getStorageKey(identity.userId),
      JSON.stringify({
        loginSessionId: identity.loginSessionId,
        ...dateFilter,
      } satisfies StoredLeadDateFilterState),
    );
  } catch {
    // Storage can be unavailable in restricted/private browser contexts.
  }
}

export function getDefaultLeadDateFilterState(): LeadDateFilterState {
  return getLeadDateFilterState(DEFAULT_LEAD_WORKBENCH_FILTERS);
}
