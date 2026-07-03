import React, { useState, useRef, useEffect } from 'react';
import { Label, TopicKey, Intent, SENTIMENT_LABELS, TOPIC_LABELS, URGENCY_LABELS, INTENT_LABELS } from '../types';

interface LabelSelectorProps {
  label: Label;
  onChange: (label: Label) => void;
  disabled?: boolean;
  compact?: boolean;
}

// ============================================================
// Badges
// ============================================================
function SentimentBadge({ sentiment }: { sentiment: Label['sentiment'] }) {
  if (!sentiment) return <span className="text-gray-400 dark:text-gray-500 text-xs">--</span>;
  const cls = {
    positive: 'badge-positive',
    negative: 'badge-negative',
    neutral: 'badge-neutral',
  }[sentiment];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {SENTIMENT_LABELS[sentiment]}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: Label['urgency'] }) {
  if (!urgency) return <span className="text-gray-400 dark:text-gray-500 text-xs">--</span>;
  const cls = {
    normal: 'badge-normal',
    notable: 'badge-notable',
    crisis: 'badge-crisis',
  }[urgency];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      {URGENCY_LABELS[urgency]}
    </span>
  );
}

function IntentBadge({ intent }: { intent: Label['intent'] }) {
  if (!intent) return <span className="text-gray-400 dark:text-gray-500 text-xs">--</span>;
  const meta = INTENT_LABELS[intent];
  const cls = {
    hot:  'badge-intent-hot',
    warm: 'badge-intent-warm',
    cold: 'badge-intent-cold',
    none: 'badge-intent-none',
  }[intent];
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`} title={meta.tooltip}>
      {meta.emoji} {meta.label}
    </span>
  );
}

// ============================================================
// Multi-select topic dropdown
// ============================================================
const ALL_TOPICS: TopicKey[] = ['quality', 'price', 'service', 'location', 'promotion', 'other'];

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
    ? '--'
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
                {key === 'quality' ? 'q' : key === 'price' ? 'w' : key === 'service' ? 'e' :
                  key === 'location' ? 'r' : key === 'promotion' ? 't' : 'y'}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main LabelSelector — 5 controls
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
        <option value="positive">Tích cực</option>
        <option value="negative">Tiêu cực</option>
        <option value="neutral">Trung tính</option>
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
        <option value="yes">Có</option>
        <option value="no">Không</option>
      </select>

      {/* 4. Urgency */}
      <select
        disabled={disabled}
        value={label.urgency ?? ''}
        onChange={e => update('urgency', (e.target.value || null) as Label['urgency'])}
        className="select-control"
        title="Mức độ khẩn cấp (z=Bình thường, x=Đáng chú ý, c=Crisis)"
      >
        <option value="">-- Mức độ</option>
        <option value="normal">Bình thường</option>
        <option value="notable">Đáng chú ý</option>
        <option value="crisis">🚨 Crisis</option>
      </select>

      {/* 5. Intent — NEW */}
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
        <option value="cold" title="Ít quan tâm — đề cập nhưng không có ý định">🧊 Cold</option>
        <option value="none" title="Không liên quan đến mua hàng/tuyển dụng">➖ None</option>
      </select>

      {/* Inline badges for quick visual confirmation */}
      <div className="flex gap-1 ml-1 flex-wrap">
        <SentimentBadge sentiment={label.sentiment} />
        <UrgencyBadge urgency={label.urgency} />
        <IntentBadge intent={label.intent} />
      </div>
    </div>
  );
}
