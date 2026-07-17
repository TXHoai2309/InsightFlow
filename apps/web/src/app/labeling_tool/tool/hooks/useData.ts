import { useState, useCallback } from 'react';
import { Person, Thread } from '../types';
import { parseCrawlerJson, RawPost } from '../utils/dataPartition';
import { AssignmentView, loadSupabaseThreads, PlatformFilter, SupabaseConfig, SupabaseDateRange } from '../utils/supabaseRest';

interface UseDataReturn {
  threads: Thread[];
  loading: boolean;
  error: string | null;
  postCount: number;
  itemCount: number;
  loadFromFile: (file: File, expectedPerson: Person, filterGMapsSpam?: boolean) => Promise<void>;
  loadFromSupabase: (
    config: SupabaseConfig,
    platform: PlatformFilter,
    limit: number,
    assignmentView: AssignmentView,
    dateRange?: SupabaseDateRange,
    brand?: string,
    signal?: AbortSignal,
  ) => Promise<void>;
  resetData: () => void;
}

export function useData(): UseDataReturn {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postCount, setPostCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);

  const loadFromFile = useCallback(async (
    file: File,
    expectedPerson: Person,
    filterGMapsSpam = true,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      let parsed: unknown;

      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error('File không phải JSON hợp lệ. Vui lòng chọn file .json đúng định dạng.');
      }

      // Support 2 formats:
      // 1. Pipeline split file: { person, posts: [...] }
      // 2. Raw crawler file: [{ post_id, ..., comments: [...] }]
      let rawPosts: RawPost[];

      if (Array.isArray(parsed)) {
        // Raw crawler array
        rawPosts = parsed as RawPost[];
      } else if (typeof parsed === 'object' && parsed !== null && 'posts' in parsed) {
        // Pipeline split file — posts key at top level
        const asObj = parsed as Record<string, unknown>;
        if (typeof asObj.person === 'string' && asObj.person !== expectedPerson) {
          throw new Error(
            `Bạn đang chọn ${expectedPerson}, nhưng file này thuộc ${asObj.person}.`,
          );
        }
        if (!Array.isArray(asObj.posts)) {
          throw new Error('File JSON có key "posts" nhưng không phải array.');
        }
        rawPosts = asObj.posts as RawPost[];
      } else {
        throw new Error(
          'File JSON không đúng định dạng.\n' +
          '  • Pipeline split file: { "posts": [...] }\n' +
          '  • Crawler raw file: [{ "post_id": ..., "comments": [...] }]'
        );
      }

      if (rawPosts.length === 0) {
        throw new Error('File JSON không có posts nào để gán nhãn.');
      }

      // Parse nested crawler JSON → Thread[]
      // No partition needed — file is already pre-split per person
      const allThreads = parseCrawlerJson(rawPosts, filterGMapsSpam);

      if (allThreads.length === 0) {
        throw new Error('Không đọc được thread nào từ file. Kiểm tra lại schema JSON.');
      }

      // Count total items
      const totalItems = allThreads.reduce(
        (sum, t) => sum + 1 + t.comments.reduce((s, c) => s + 1 + c.replies.length, 0),
        0
      );

      setThreads(allThreads);
      setPostCount(allThreads.length);
      setItemCount(totalItems);

      console.log(`✅ Loaded ${allThreads.length} threads | ${totalItems} total items | spam filter: ${filterGMapsSpam}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi tải file.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const applyThreads = useCallback((nextThreads: Thread[]) => {
    const totalItems = nextThreads.reduce(
      (sum, t) => sum + 1 + t.comments.reduce((s, c) => s + 1 + c.replies.length, 0),
      0,
    );
    setThreads(nextThreads);
    setPostCount(nextThreads.length);
    setItemCount(totalItems);
  }, []);

  const loadFromSupabase = useCallback(async (
    config: SupabaseConfig,
    platform: PlatformFilter,
    limit: number,
    assignmentView: AssignmentView,
    dateRange: SupabaseDateRange = {},
    brand?: string,
    signal?: AbortSignal,
  ) => {
    setLoading(true);
    setError(null);
    applyThreads([]);

    try {
      if (!config.url.trim() || !config.anonKey.trim()) {
        throw new Error('Thiếu Supabase URL hoặc anon key.');
      }
      const nextThreads = await loadSupabaseThreads(
        config,
        platform,
        limit,
        assignmentView,
        dateRange,
        brand,
        signal,
      );
      if (nextThreads.length === 0) {
        setError('✅ Queue trống — không còn assignment nào cần gán trong queue này!');
        return;
      }
      applyThreads(nextThreads);
    } catch (err) {
      if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'))) {
        setError('❌ Đã hủy tải dữ liệu từ Supabase.');
        return;
      }
      const msg = err instanceof Error ? err.message : 'Lỗi không xác định khi tải Supabase.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [applyThreads]);

  const resetData = useCallback(() => {
    setThreads([]);
    setPostCount(0);
    setItemCount(0);
    setError(null);
  }, []);

  return { threads, loading, error, postCount, itemCount, loadFromFile, loadFromSupabase, resetData };
}
