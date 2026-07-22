export type LeadWorkflowRow = Record<string, unknown>;

function normalizeKey(value: unknown) {
  return String(value || "").trim();
}

function getUpdatedAt(row: LeadWorkflowRow) {
  const timestamp = new Date(String(row.updated_at || row.created_at || 0)).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getLeadWorkflowRowKeys(row: LeadWorkflowRow) {
  return Array.from(
    new Set(
      [row.id, row.mention_id, row.source_mention_id]
        .map(normalizeKey)
        .filter(Boolean),
    ),
  );
}

export function buildLeadWorkflowLookupKeys(
  records: Array<{ id?: unknown }>,
) {
  return Array.from(
    new Set(records.map((record) => normalizeKey(record.id)).filter(Boolean)),
  );
}

export function mergeLeadWorkflowRows(
  ...groups: LeadWorkflowRow[][]
) {
  const rowsByIdentity = new Map<string, LeadWorkflowRow>();

  groups.flat().forEach((row, index) => {
    const keys = getLeadWorkflowRowKeys(row);
    const identity = normalizeKey(row.id) || keys.join(":") || `row-${index}`;
    const current = rowsByIdentity.get(identity);
    if (!current || getUpdatedAt(row) >= getUpdatedAt(current)) {
      rowsByIdentity.set(identity, row);
    }
  });

  return Array.from(rowsByIdentity.values()).sort(
    (left, right) => getUpdatedAt(right) - getUpdatedAt(left),
  );
}

export function indexLeadWorkflowRows(rows: LeadWorkflowRow[]) {
  const rowsByKey = new Map<string, LeadWorkflowRow>();

  rows.forEach((row) => {
    getLeadWorkflowRowKeys(row).forEach((key) => {
      const current = rowsByKey.get(key);
      if (!current || getUpdatedAt(row) >= getUpdatedAt(current)) {
        rowsByKey.set(key, row);
      }
    });
  });

  return rowsByKey;
}

export function getMissingLeadWorkflowKeys(
  lookupKeys: string[],
  rows: LeadWorkflowRow[],
) {
  const rowsByKey = indexLeadWorkflowRows(rows);
  return lookupKeys.filter((key) => !rowsByKey.has(key));
}
