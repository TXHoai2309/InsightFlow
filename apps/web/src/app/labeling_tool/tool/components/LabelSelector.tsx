import React, { useState, useRef, useEffect } from 'react';
import { Zap } from 'lucide-react';
import {
  Label, TopicKey, Intent,
  SENTIMENT_LABELS, TOPIC_LABELS, URGENCY_LABELS, INTENT_LABELS,
  EMPTY_LABEL, IRRELEVANT_PRESET_LABEL, isIrrelevantPreset,
  POSITIVE_COLD_PRESET_LABEL, isPositiveColdPreset,
  NEGATIVE_STAFF_ATTITUDE_PRESET_LABEL, isNegativeStaffAttitudePreset,
  POSITIVE_NONE_PRESET_LABEL, isPositiveNonePreset,
} from '../types';

interface LabelSelectorProps {
  label: Label;
  onChange: (label: Label) => void;
  disabled?: boolean;
  compact?: boolean;
  skipped?: boolean;
  onToggleSkip?: () => void;
}

// ============================================================
// Style helpers for color coding select dropdowns
// ============================================================
function getSentimentClass(sentiment: Label['sentiment']) {
  if (!sentiment) return '';
  if (sentiment === 'positive') return 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300';
  if (sentiment === 'negative') return 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300';
  return 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300';
}

function getRelevanceClass(relevance: Label['relevance']) {
  if (relevance === null || relevance === undefined) return '';
  if (relevance === true) return 'bg-teal-50 border-teal-300 text-teal-800 dark:bg-teal-950/30 dark:border-teal-800 dark:text-teal-300';
  return 'bg-slate-50 border-slate-300 text-slate-800 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300';
}

function getUrgencyClass(urgency: Label['urgency']) {
  if (!urgency) return '';
  if (urgency === 'none') return 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300';
  if (urgency === 'low') return 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300';
  if (urgency === 'medium') return 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300';
  if (urgency === 'high') return 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300';
  return 'bg-red-50 border-red-300 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300';
}

function getIntentClass(intent: Label['intent']) {
  if (!intent) return '';
  if (intent === 'hot') return 'bg-orange-50 border-orange-300 text-orange-800 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-300';
  if (intent === 'warm') return 'bg-yellow-50 border-yellow-300 text-yellow-800 dark:bg-yellow-950/30 dark:border-yellow-800 dark:text-yellow-300';
  if (intent === 'cold') return 'bg-blue-50 border-blue-300 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300';
  return 'bg-gray-50 border-gray-300 text-gray-800 dark:bg-gray-800/40 dark:border-gray-700 dark:text-gray-300';
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

  const activeClass = topics.length > 0
    ? 'bg-indigo-50 border-indigo-300 text-indigo-800 dark:bg-indigo-950/30 dark:border-indigo-800 dark:text-indigo-300'
    : '';

  return (
    <div ref={ref} className={`relative ${open ? 'z-50' : ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`select-control min-w-[120px] text-left flex items-center justify-between gap-1 transition-colors ${activeClass}`}
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
// Main LabelSelector — 5 controls
// ============================================================
export default function LabelSelector({
  label,
  onChange,
  disabled,
  compact,
  skipped,
  onToggleSkip,
}: LabelSelectorProps) {
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
        className={`select-control transition-colors ${getSentimentClass(label.sentiment)}`}
        title="Cảm xúc (1=Tích cực, 2=Tiêu cực, 3=Trung tính)"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">-- Cảm xúc</option>
        <option value="positive" className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">🟢 Tích cực</option>
        <option value="negative" className="bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300">🔴 Tiêu cực</option>
        <option value="neutral" className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300">🟡 Trung tính</option>
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
        className={`select-control transition-colors ${getRelevanceClass(label.relevance)}`}
        title="Liên quan thương hiệu (a=Có, s=Không)"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">-- Liên quan</option>
        <option value="yes" className="bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-300">🔵 Có</option>
        <option value="no" className="bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-300">⚪ Không</option>
      </select>

      {/* 4. Urgency */}
      <select
        disabled={disabled}
        value={label.urgency ?? ''}
        onChange={e => update('urgency', (e.target.value || null) as Label['urgency'])}
        className={`select-control transition-colors ${getUrgencyClass(label.urgency)}`}
        title="Mức độ (z=Thấp, x=Trung bình, c=Cao, v=Khẩn cấp, d=None)"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">-- Mức độ</option>
        <option value="none" className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300">⚪ None</option>
        <option value="low" className="bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300">🟢 Thấp</option>
        <option value="medium" className="bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300">🟡 Trung bình</option>
        <option value="high" className="bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300">🟠 Cao</option>
        <option value="urgent" className="bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300">🔴 Khẩn cấp</option>
      </select>

      {/* 5. Intent */}
      <select
        disabled={disabled}
        value={label.intent ?? ''}
        onChange={e => update('intent', (e.target.value || null) as Intent)}
        className={`select-control transition-colors ${getIntentClass(label.intent)}`}
        title="Ý định mua hàng (h=Hot, m=Warm, b=Cold, n=None)"
      >
        <option value="" className="bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200">-- Intent</option>
        <option value="hot" className="bg-orange-50 dark:bg-orange-950/50 text-orange-800 dark:text-orange-300" title="Quan tâm mạnh — có ý định mua/ứng tuyển ngay">🔴 Hot</option>
        <option value="warm" className="bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-300" title="Quan tâm vừa — đang tìm hiểu, cân nhắc">🟡 Warm</option>
        <option value="cold" className="bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300" title="Ít quan tâm — đề cập nhưng không có ý định">🔵 Cold</option>
        <option value="none" className="bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-300" title="Không liên quan đến mua hàng/tuyển dụng">⚪ None</option>
      </select>

      {onToggleSkip && (
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleSkip}
          className={`select-control inline-flex items-center gap-1.5 font-medium transition-colors ${
            skipped
              ? 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-700'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
          title={skipped ? "Khôi phục comment để gán nhãn" : "Bỏ qua/Không gán nhãn cho comment này (phím i)"}
          aria-label="Bỏ qua comment này"
          aria-pressed={skipped}
        >
          <span>{skipped ? '↩️ Khôi phục' : '🚫 Bỏ qua cmt'}</span>
          <kbd className="kbd">i</kbd>
        </button>
      )}

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
        title="Bật/tắt nhãn nhanh: Trung tính · Khác · Không liên quan · None · None (phím 0)"
        aria-label="Gán nhanh nhãn không liên quan"
        aria-pressed={isIrrelevantPreset(label)}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isIrrelevantPreset(label) ? 'Bỏ gán nhanh' : 'Không liên quan'}</span>
        <kbd className="kbd">0</kbd>
      </button>

      {/* Quick-assign button (phím 7) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({
          ...(isPositiveNonePreset(label) ? EMPTY_LABEL : POSITIVE_NONE_PRESET_LABEL),
        })}
        className={`select-control inline-flex items-center gap-1.5 font-medium transition-colors ${
          isPositiveNonePreset(label)
            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
            : ''
        }`}
        title="Bật/tắt nhãn nhanh: Tích cực · Khác · Có · None · None (phím 7)"
        aria-label="Gán nhanh nhãn tích cực, none"
        aria-pressed={isPositiveNonePreset(label)}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isPositiveNonePreset(label) ? 'Bỏ gán nhanh' : 'Tích cực, None'}</span>
        <kbd className="kbd">7</kbd>
      </button>

      {/* Quick-assign button (phím 9) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({
          ...(isPositiveColdPreset(label) ? EMPTY_LABEL : POSITIVE_COLD_PRESET_LABEL),
        })}
        className={`select-control inline-flex items-center gap-1.5 font-medium transition-colors ${
          isPositiveColdPreset(label)
            ? 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
            : ''
        }`}
        title="Bật/tắt nhãn nhanh: Tích cực · Khác · Có · None · Cold (phím 9)"
        aria-label="Gán nhanh nhãn tích cực, cold"
        aria-pressed={isPositiveColdPreset(label)}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isPositiveColdPreset(label) ? 'Bỏ gán nhanh' : 'Tích cực, Cold'}</span>
        <kbd className="kbd">9</kbd>
      </button>

      {/* Quick-assign button (phím 8) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({
          ...(isNegativeStaffAttitudePreset(label) ? EMPTY_LABEL : NEGATIVE_STAFF_ATTITUDE_PRESET_LABEL),
        })}
        className={`select-control inline-flex items-center gap-1.5 font-medium transition-colors ${
          isNegativeStaffAttitudePreset(label)
            ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
            : ''
        }`}
        title="Bật/tắt nhãn nhanh: Tiêu cực · Dịch vụ · Có · Cao · None (phím 8)"
        aria-label="Gán nhanh nhãn tiêu cực về thái độ nhân viên"
        aria-pressed={isNegativeStaffAttitudePreset(label)}
      >
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isNegativeStaffAttitudePreset(label) ? 'Bỏ gán nhanh' : 'Thái độ nhân viên'}</span>
        <kbd className="kbd">8</kbd>
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
            label.urgency === 'none' ? 'badge-neutral' :
            label.urgency === 'low' ? 'badge-normal' :
            label.urgency === 'medium' ? 'badge-notable' :
            label.urgency === 'high' ? 'bg-orange-500 text-white' : 'badge-crisis'
          }`}>
            {label.urgency === 'none' ? '⚪' : label.urgency === 'low' ? '🟢' : label.urgency === 'medium' ? '🟡' :
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
