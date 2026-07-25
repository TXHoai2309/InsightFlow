import React, { useMemo, useState } from 'react';
import { Person, StoredLabel, StoredThreadState, Thread } from '../types';
import { buildExport, downloadJson } from '../utils/exportJson';

interface ExportButtonProps {
  person: Person;
  threads: Thread[];
  labels: Record<string, StoredLabel>;
  threadStates: Record<string, StoredThreadState>;
}

export default function ExportButton({ person, threads, labels, threadStates }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const loadedIds = useMemo(() => new Set(threads.flatMap(thread => [
    thread.post._entity_key,
    ...thread.comments.flatMap(comment => [
      comment.comment._entity_key,
      ...comment.replies.map(reply => reply._entity_key),
    ]),
  ])), [threads]);
  const loadedLabels = Object.values(labels).filter(label => loadedIds.has(label.entity_key));
  const labeledCount = loadedLabels.filter(label => !label.skipped).length;
  const skippedCount = loadedLabels.filter(label => label.skipped).length;

  const handleExport = () => {
    setExporting(true);
    try {
      const payload = buildExport(person, threads, labels, threadStates);
      downloadJson(payload, person);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  return (
    <button
      data-tour="labeling-export-json"
      onClick={handleExport}
      disabled={exporting || labeledCount + skippedCount === 0}
      title={`Export ${labeledCount} labeled, ${skippedCount} skipped`}
      className="btn-primary text-xs disabled:opacity-50"
    >
      {exporting ? (
        <>
          <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" strokeLinecap="round" strokeWidth="4" />
          </svg>
          Xuất...
        </>
      ) : (
        <>
          ⬇ Export JSON
          {labeledCount > 0 && (
            <span className="bg-white/20 rounded px-1 ml-1">{labeledCount}</span>
          )}
        </>
      )}
    </button>
  );
}
