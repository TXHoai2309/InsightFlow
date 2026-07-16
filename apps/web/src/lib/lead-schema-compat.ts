export interface OptionalColumnErrorLike {
  code?: string;
  missingColumn?: string;
}

export function isMissingOptionalColumnError(
  error: unknown,
  column: string,
): error is OptionalColumnErrorLike {
  if (!error || typeof error !== "object") return false;
  const candidate = error as OptionalColumnErrorLike;
  return candidate.code === "PGRST204" && candidate.missingColumn === column;
}

export async function withOptionalColumnFallback<T>(options: {
  payload: Record<string, unknown>;
  column: string;
  knownUnsupported: Set<string>;
  writer: (payload: Record<string, unknown>) => Promise<T>;
}) {
  const { payload, column, knownUnsupported, writer } = options;
  const compatiblePayload = { ...payload };
  if (knownUnsupported.has(column)) delete compatiblePayload[column];

  try {
    return await writer(compatiblePayload);
  } catch (error) {
    if (!isMissingOptionalColumnError(error, column) || !(column in compatiblePayload)) {
      throw error;
    }
    knownUnsupported.add(column);
    const fallbackPayload = { ...compatiblePayload };
    delete fallbackPayload[column];
    return writer(fallbackPayload);
  }
}

