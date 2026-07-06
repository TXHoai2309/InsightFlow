import React, { useState, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  Label, TopicKey, Intent,
  SENTIMENT_LABELS, TOPIC_LABELS, URGENCY_LABELS, INTENT_LABELS,
  EMPTY_LABEL, IRRELEVANT_PRESET_LABEL, isIrrelevantPreset,
} from '../types';

interface LabelSelectorProps {
  label: Label;
  onChange: (label: Label) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================
// Multi-select topic dropdown
// ============================================================
const ALL_TOPICS: TopicKey[] = ['quality', 'price', 'service', 'location', 'promotion', 'recruitment', 'other'];
const TOPIC_HOTKEY_DISPLAY: Record<TopicKey, string> = {
  quality: 'q', price: 'w', service: 'e', location: 'r',
  promotion: 't', recruitment: 'y', other: 'u',
};

function TopicSelector({
  topics,
  onChange,
  disabled,
}: {
  topics: TopicKey[];
  onChange: (t: TopicKey[]) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const toggle = (key: TopicKey) => {
    if (disabled) return;
    if (topics.includes(key)) onChange(topics.filter(t => t !== key));
    else onChange([...topics, key]);
  };

  const displayText = topics.length === 0
    ? '-- Chủ đề'
    : topics.map(t => TOPIC_LABELS[t]).join(', ');

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className="select-control min-w-[120px] text-left flex items-center justify-between gap-1"
        title="Chọn chủ đề (có thể chọn nhiều)"
      >
        <span className="truncate max-w-[100px] text-xs">{displayText}</span>
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="topic-panel">
          {ALL_TOPICS.map(key => (
            <label key={key} className="topic-option">
              <input
                type="checkbox"
                checked={topics.includes(key)}
                onChange={() => toggle(key)}
                className="rounded accent-white cursor-pointer"
                style={{ colorScheme: 'light' }}
              />
              <span>{TOPIC_LABELS[key]}</span>
              <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
                {TOPIC_HOTKEY_DISPLAY[key]}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main LabelSelector — 5 controls (no quick-assign button)
// ============================================================
export default function LabelSelector({ label, onChange, disabled, compact }: LabelSelectorProps) {
  const update = <K extends keyof Label>(key: K, value: Label[K]) => {
    onChange({ ...label, [key]: value });
  };

  return (
    <div className={`flex flex-wrap gap-2 items-center ${compact ? 'mt-1' : 'mt-2'}`}>

      {/* 1. Sentiment */}
      <select
        disabled={disabled}
        value={label.sentiment ?? ''}
        onChange={e => update('sentiment', (e.target.value || null) as Label['sentiment'])}
        className="select-control"
        title="Cảm xúc (1=Tích cực, 2=Tiêu cực, 3=Trung tính)"
      >
        <option value="">-- Cảm xúc</option>
        <option value="positive">😊 Tích cực</option>
        <option value="negative">😠 Tiêu cực</option>
        <option value="neutral">😐 Trung tính</option>
      </select>

      {/* 2. Topic multi-select */}
      <TopicSelector
        topics={label.topic}
        onChange={t => update('topic', t)}
        disabled={disabled}
      />

      {/* 3. Relevance */}
      <select
        disabled={disabled}
        value={label.relevance === null ? '' : label.relevance ? 'yes' : 'no'}
        onChange={e => {
          const v = e.target.value;
          update('relevance', v === '' ? null : v === 'yes');
        }}
        className="select-control"
        title="Liên quan thương hiệu (a=Có, s=Không)"
      >
        <option value="">-- Liên quan</option>
        <option value="yes">✅ Có</option>
        <option value="no">❌ Không</option>
      </select>

      {/* 4. Urgency */}
      <select
        disabled={disabled}
        value={label.urgency ?? ''}
        onChange={e => update('urgency', (e.target.value || null) as Label['urgency'])}
        className="select-control"
        title="Mức độ (z=Thấp, x=Trung bình, c=Cao, v=Khẩn cấp)"
      >
        <option value="">-- Mức độ</option>
        <option value="low">🟢 Thấp</option>
        <option value="medium">🟡 Trung bình</option>
        <option value="high">🟠 Cao</option>
        <option value="urgent">🔴 Khẩn cấp</option>
      </select>

      {/* 5. Intent */}
      <select
        disabled={disabled}
        value={label.intent ?? ''}
        onChange={e => update('intent', (e.target.value || null) as Intent)}
        className="select-control"
        title="Ý định mua hàng (h=Hot, m=Warm, b=Cold, n=None)"
      >
        <option value="">-- Intent</option>
        <option value="hot" title="Quan tâm mạnh — có ý định mua/ứng tuyển ngay">🔥 Hot</option>
        <option value="warm" title="Quan tâm vừa — đang tìm hiểu, cân nhắc">🌡️ Warm</option>
        <option value="cold" title="Ít quan tâm — đề cập nhưng không có ý định">🧧 Cold</option>
        <option value="none" title="Không liên quan đến mua hàng/tuyển dụng">➖ None</option>
      </select>

      {/* Quick-assign button (phím 0) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({
          ...(isIrrelevantPreset(label) ? EMPTY_LABEL : IRRELEVANT_PRESET_LABEL),
        })}
        className={`select-control inline-flex items-center gap-1.5 font-medium transition-colors ${
          isIrrelevantPreset(label)
            ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
            : ''
        }`}
        title="Bật/tắt nhãn nhanh: Trung tính · Khác · Không liên quan · Thấp · None (phím 0)"
        aria-label="Gán nhanh nhãn không liên quan"
        aria-pressed={isIrrelevantPreset(label)}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isIrrelevantPreset(label) ? 'Bỏ gán nhanh' : 'Không liên quan'}</span>
        <kbd className="kbd">0</kbd>
      </button>

      {/* Inline badges for quick visual confirmation */}
      <div className="flex gap-1 ml-1 flex-wrap items-center text-xs">
        {label.sentiment && (
          <span className={`px-2 py-0.5 rounded-full font-semibold ${
            label.sentiment === 'positive' ? 'badge-positive' :
            label.sentiment === 'negative' ? 'badge-negative' : 'badge-neutral'
          }`}>
            {label.sentiment === 'positive' ? '😊' : label.sentiment === 'negative' ? '😠' : '😐'}{' '}
            {SENTIMENT_LABELS[label.sentiment]}
          </span>
        )}
        {label.urgency && (
          <span className={`px-2 py-0.5 rounded-full font-semibold ${
            label.urgency === 'low' ? 'badge-normal' :
            label.urgency === 'medium' ? 'badge-notable' :
            label.urgency === 'high' ? 'bg-orange-500 text-white' : 'badge-crisis'
          }`}>
            {label.urgency === 'low' ? '🟢' : label.urgency === 'medium' ? '🟡' :
             label.urgency === 'high' ? '🟠' : '🔴'}{' '}
            {URGENCY_LABELS[label.urgency]}
          </span>
        )}
        {label.intent && (() => {
          const meta = INTENT_LABELS[label.intent];
          const cls = {
            hot: 'badge-intent-hot', warm: 'badge-intent-warm',
            cold: 'badge-intent-cold', none: 'badge-intent-none',
          }[label.intent];
          return (
            <span className={`px-2 py-0.5 rounded-full font-semibold border ${cls}`} title={meta.tooltip}>
              {meta.emoji} {meta.label}
            </span>
          );
        })()}
        {label.relevance !== null && label.relevance !== undefined && (
          <span className={`px-2 py-0.5 rounded-full font-semibold ${
            label.relevance ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300'
                            : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            {label.relevance ? '✅ Liên quan' : '❌ Không liên quan'}
          </span>
        )}
      </div>
    </div>
  );
}
