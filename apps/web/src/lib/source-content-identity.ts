export interface SourceContentRecord {
  id?: string | null;
  entity_key?: string | null;
  source_id?: string | null;
  platform?: string | null;
  source?: string | null;
  content_type?: string | null;
  post_id?: string | null;
  comment_id?: string | null;
  content?: string | null;
  text?: string | null;
  author?: string | null;
  posted_at?: string | null;
  created_at?: string | null;
  url?: string | null;
  post_url?: string | null;
  comment_url?: string | null;
  source_url?: string | null;
}

interface DeduplicateSourceRecordsOptions<T> {
  selectPreferred?: (existing: T, candidate: T) => T;
}

function normalizeValue(value: unknown) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeSourcePlatform(value: unknown) {
  const platform = normalizeValue(value);
  if (platform === "threads") return "thread";
  if (platform === "befood") return "be";
  if (platform === "googlemap") return "google_maps";
  if (platform === "news_html" || platform === "news_rss") return "news";
  return platform || "unknown";
}

export function getSourceContentType(record: SourceContentRecord) {
  const type = normalizeValue(record.content_type);
  if (type === "post" || type === "comment" || type === "reply") return type;
  if (record.comment_id) return "comment";
  if (record.post_id) return "post";
  return "mention";
}

function getNativeSourceId(record: SourceContentRecord) {
  const type = getSourceContentType(record);
  if (type === "comment" || type === "reply") {
    return normalizeValue(record.comment_id || record.source_id || record.id);
  }
  if (type === "post") {
    return normalizeValue(record.post_id || record.source_id || record.id);
  }
  return normalizeValue(
    record.source_id || record.comment_id || record.post_id || record.id,
  );
}

/**
 * Platform + native source id intentionally excludes content_type.
 *
 * Some collectors can persist the same native object once as a post and once
 * as a comment. Keeping content_type in this base key makes analytical and
 * operational counters disagree even though both rows describe one object.
 */
export function getSourceRecordNativeKey(record: SourceContentRecord) {
  const nativeId = getNativeSourceId(record);
  if (!nativeId) return "";
  return `${normalizeSourcePlatform(record.platform || record.source)}:${nativeId}`;
}

export function getSourceRecordTypedKey(record: SourceContentRecord) {
  const nativeKey = getSourceRecordNativeKey(record);
  if (nativeKey) return `${nativeKey}:${getSourceContentType(record)}`;

  const entityKey = normalizeValue(record.entity_key);
  if (entityKey) return `entity:${entityKey}`;

  const url = normalizeValue(
    record.comment_url || record.post_url || record.source_url || record.url,
  );
  return url ? `url:${url}` : "";
}

function getComparableText(record: SourceContentRecord) {
  return normalizeValue(record.content || record.text);
}

function getComparableAuthor(record: SourceContentRecord) {
  return normalizeValue(record.author);
}

function getComparableTime(record: SourceContentRecord) {
  const timestamp = new Date(record.posted_at || record.created_at || "").getTime();
  return Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : null;
}

function isSameNativeObjectAcrossTypes(
  existing: SourceContentRecord,
  candidate: SourceContentRecord,
) {
  if (getSourceContentType(existing) === getSourceContentType(candidate)) {
    return true;
  }

  const existingText = getComparableText(existing);
  const candidateText = getComparableText(candidate);
  if (!existingText || existingText !== candidateText) return false;

  const existingTime = getComparableTime(existing);
  const candidateTime = getComparableTime(candidate);
  if (
    existingTime === null ||
    candidateTime === null ||
    existingTime !== candidateTime
  ) {
    return false;
  }

  const existingAuthor = getComparableAuthor(existing);
  const candidateAuthor = getComparableAuthor(candidate);
  return !existingAuthor || !candidateAuthor || existingAuthor === candidateAuthor;
}

/**
 * Deduplicate source objects without collapsing legitimate cross-platform
 * records or different post/comment objects that merely reuse a local id.
 */
export function deduplicateSourceRecords<T extends SourceContentRecord>(
  records: T[],
  options: DeduplicateSourceRecordsOptions<T> = {},
) {
  const output: T[] = [];
  const indicesByNativeKey = new Map<string, number[]>();
  const indexByFallbackKey = new Map<string, number>();
  const selectPreferred =
    options.selectPreferred || ((existing: T, _candidate: T) => existing);

  records.forEach((record) => {
    const nativeKey = getSourceRecordNativeKey(record);

    if (nativeKey) {
      const candidateIndices = indicesByNativeKey.get(nativeKey) || [];
      const matchingIndex = candidateIndices.find((index) =>
        isSameNativeObjectAcrossTypes(output[index], record),
      );

      if (matchingIndex !== undefined) {
        output[matchingIndex] = selectPreferred(output[matchingIndex], record);
        return;
      }

      const nextIndex = output.length;
      output.push(record);
      indicesByNativeKey.set(nativeKey, [...candidateIndices, nextIndex]);
      return;
    }

    const fallbackKey = getSourceRecordTypedKey(record);
    if (!fallbackKey) {
      output.push(record);
      return;
    }

    const existingIndex = indexByFallbackKey.get(fallbackKey);
    if (existingIndex !== undefined) {
      output[existingIndex] = selectPreferred(output[existingIndex], record);
      return;
    }

    indexByFallbackKey.set(fallbackKey, output.length);
    output.push(record);
  });

  return output;
}
