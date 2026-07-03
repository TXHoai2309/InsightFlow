import React from 'react';
import { formatCount } from '../utils/parser';
import { Item, Label, EMPTY_LABEL, isLabelComplete } from '../types';
import LabelSelector from './LabelSelector';
import { highlightBrandSafe } from '../utils/dataPartition';

// ============================================================
// StarRating — Unicode star display
// ============================================================
export function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
  const filled = Math.round(rating);
  return (
    <span className="text-yellow-400 text-sm tracking-tight" title={`${rating}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i}>{i < filled ? '★' : '☆'}</span>
      ))}
      <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({rating}/5)</span>
    </span>
  );
}

// ============================================================
// CommentStatsMini — inline stats after author · timestamp
// ============================================================
function CommentStatsMini({ item }: { item: Item }) {
  const src = item._source.toLowerCase();
  const { stats } = item;

  // Google Maps / BeFood reviews: show star rating
  if (src === 'google maps' || src === 'google_maps' || src === 'befood') {
    if (stats.star_count !== null && stats.star_count !== undefined && stats.star_count > 0) {
      return <StarRating rating={stats.star_count} />;
    }
    // rating = 0 or null → show "Chưa đánh giá"
    return <span className="text-xs text-gray-400 dark:text-gray-500 italic">Chưa đánh giá</span>;
  }

  // Social platforms: show ❤️ like + 💬 reply count
  const parts: React.ReactNode[] = [];

  if (stats.like_count > 0) {
    parts.push(
      <span key="like" className="flex items-center gap-0.5">
        ❤️ <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.like_count)}</strong>
      </span>
    );
  }

  if (stats.comment_count > 0) {
    parts.push(
      <span key="cmt" className="flex items-center gap-0.5">
        💬 <strong className="text-gray-700 dark:text-gray-300">{formatCount(stats.comment_count)}</strong>
        <span>reply</span>
      </span>
    );
  }

  if (parts.length === 0) return null;

  return (
    <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      {parts}
    </span>
  );
}

// ============================================================
// Text with brand highlighting
// ============================================================
function HighlightedText({ text, brand }: { text: string; brand: string }) {
  const parts = highlightBrandSafe(text, brand);
  return (
    <>
      {parts.map((p, i) =>
        p.highlight
          ? <mark key={i} className="brand-highlight">{p.text}</mark>
          : <span key={i}>{p.text}</span>
      )}
    </>
  );
}

// ============================================================
// Helpers
// ============================================================
function formatTime(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString('vi-VN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function SourceIcon({ source }: { source: string }) {
  const s = source.toLowerCase();
  const icons: Record<string, string> = {
    facebook: '📘', tiktok: '🎵', youtube: '📺',
    instagram: '📸', threads: '🧵', befood: '🍱',
    'google maps': '🗺️', google_maps: '🗺️',
  };
  return <span title={source}>{icons[s] ?? '🌐'}</span>;
}

// ============================================================
// CommentItem
// ============================================================
interface CommentItemProps {
  item: Item;
  isReply?: boolean;
  label: (Label & { skipped?: boolean; needs_review?: boolean }) | null;
  isFocused: boolean;
  onFocus: (id: string) => void;
  onChange: (label: Label) => void;
}

export default function CommentItem({
  item,
  isReply = false,
  label,
  isFocused,
  onFocus,
  onChange,
}: CommentItemProps) {
  const isSkipped = label?.skipped === true;
  const needsReview = label?.needs_review === true;
  const isComplete = !isSkipped && !needsReview && isLabelComplete(label ?? undefined);

  const borderCls = isSkipped ? 'item-skipped'
    : isComplete ? 'item-complete' : 'item-unlabeled';
  const focusCls = isFocused ? 'item-focused' : '';

  const currentLabel: Label = label
    ? { sentiment: label.sentiment, topic: label.topic, relevance: label.relevance, urgency: label.urgency, intent: label.intent ?? null }
    : EMPTY_LABEL;

  const contentType = item._content_type === 'reply' ? '↩️' : '💬';
  const author = item._author || 'Ẩn danh';

  return (
    <div
      onMouseEnter={() => onFocus(item._internal_id)}
      onClick={() => onFocus(item._internal_id)}
      className={`card p-3 transition-all duration-150 ${borderCls} ${focusCls} ${isReply ? 'ml-6' : ''}`}
      data-item-id={item._internal_id}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-base">{contentType}</span>

          {item._queue_status === 'updated_review' && (
            <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded">
              Đã cập nhật · xem lại
            </span>
          )}
          {item._queue_status === 'unassigned' && (
            <span className="text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded">
              Dữ liệu mới
            </span>
          )}

          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-blue-600 dark:bg-blue-700 flex items-center justify-center
                          text-white text-xs font-bold flex-shrink-0">
            {author.replace('@', '').charAt(0).toUpperCase()}
          </div>

          <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
            {author}
          </span>

          <span className="text-gray-400 dark:text-gray-500 text-xs">·</span>
          <span className="text-gray-400 dark:text-gray-500 text-xs">{formatTime(item._posted_at)}</span>

          {/* Inline stats mini — star rating or like/reply counts */}
          <span className="text-gray-400 dark:text-gray-500 text-xs">·</span>
          <CommentStatsMini item={item} />

          {/* Source icon */}
          <span className="text-xs ml-1">
            <SourceIcon source={item._source} />
            <span className="ml-1 text-gray-500 dark:text-gray-400">{item._source}</span>
          </span>

          {item._url && (
            <a href={item._url} target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs"
              onClick={e => e.stopPropagation()}>🔗</a>
          )}
        </div>

        {/* Status pill */}
        {isSkipped && (
          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full line-through">Đã bỏ qua</span>
        )}
        {needsReview && !isSkipped && (
          <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full">
            Cần xác nhận lại
          </span>
        )}
        {isComplete && !isSkipped && (
          <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">✓ Đã gán</span>
        )}
        {!isComplete && !isSkipped && !needsReview && (
          <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full">Chưa gán</span>
        )}
      </div>

      {/* Content */}
      <div className={`mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap
        ${isSkipped ? 'line-through opacity-60' : ''}`}>
        <HighlightedText text={item._text} brand={item._brand} />
      </div>

      {/* Label selectors */}
      {!isSkipped && (
        <LabelSelector label={currentLabel} onChange={onChange} compact />
      )}

      {isFocused && (
        <div className="mt-1.5 text-xs text-blue-500 dark:text-blue-400 opacity-70">
          ↑ Đang focus — 1/2/3 · q-y · a/s · z/x/c
        </div>
      )}
    </div>
  );
}
