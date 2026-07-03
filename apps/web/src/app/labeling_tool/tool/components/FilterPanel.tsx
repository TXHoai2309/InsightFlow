import React from 'react';
import { Thread } from '../types';

interface FilterPanelProps {
  threads: Thread[];
  brandFilter: string;
  sourceFilter: string;
  onBrandChange: (v: string) => void;
  onSourceChange: (v: string) => void;
  onlyRated: boolean;
  onOnlyRatedChange: (v: boolean) => void;
  skipGMapsSpam: boolean;
  onSkipGMapsSpamChange: (v: boolean) => void;
}

export default function FilterPanel({
  threads,
  brandFilter,
  sourceFilter,
  onBrandChange,
  onSourceChange,
  onlyRated,
  onOnlyRatedChange,
  skipGMapsSpam,
  onSkipGMapsSpamChange,
}: FilterPanelProps) {
  const brands = Array.from(new Set(threads.map(t => t.post._brand).filter(Boolean))).sort();
  const sources = Array.from(new Set(threads.map(t => t.post._source).filter(Boolean))).sort();

  const hasAnyFilter = brandFilter || sourceFilter || onlyRated;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
        Lọc:
      </span>

      <select
        value={brandFilter}
        onChange={e => onBrandChange(e.target.value)}
        className="select-control text-xs"
      >
        <option value="">Tất cả brand</option>
        {brands.map(b => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>

      <select
        value={sourceFilter}
        onChange={e => onSourceChange(e.target.value)}
        className="select-control text-xs"
      >
        <option value="">Tất cả nguồn</option>
        {sources.map(s => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      {/* Stat-based filters */}
      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={onlyRated}
          onChange={e => onOnlyRatedChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-yellow-500"
        />
        <span>⭐ Chỉ hiện có rating</span>
      </label>

      <label className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={skipGMapsSpam}
          onChange={e => onSkipGMapsSpamChange(e.target.checked)}
          className="w-3.5 h-3.5 rounded accent-blue-500"
        />
        <span>🗺️ Bỏ qua spam Google Maps</span>
      </label>

      {hasAnyFilter && (
        <button
          onClick={() => { onBrandChange(''); onSourceChange(''); onOnlyRatedChange(false); }}
          className="text-xs text-red-500 hover:text-red-700 dark:text-red-400"
        >
          ✕ Xóa lọc
        </button>
      )}
    </div>
  );
}
