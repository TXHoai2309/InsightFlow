"use client";

export interface WorkflowProgressStep {
  label: string;
  complete: boolean;
  active: boolean;
}

interface WorkflowProgressProps {
  label: string;
  steps: WorkflowProgressStep[];
}

/**
 * Compact business progress indicator shared by alert and customer queues.
 * Technical events such as opening the source stay actions, not workflow stages.
 */
export function WorkflowProgress({ label, steps }: WorkflowProgressProps) {
  return (
    <ol
      aria-label={label}
      className="mt-2 grid gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface-raised)]/70 p-1.5"
      style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}
    >
      {steps.map((step, index) => (
        <li key={step.label} className="flex min-w-0 items-center">
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-black ${
                step.complete
                  ? "bg-[var(--color-success)] text-white"
                  : step.active
                    ? "bg-[var(--color-brand)] text-white ring-2 ring-[var(--color-brand)]/20"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
            >
              {step.complete ? (
                <span className="material-symbols-outlined text-xs">check</span>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`truncate text-[11px] font-bold ${
                step.active
                  ? "text-[var(--color-brand)]"
                  : step.complete
                    ? "text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <span className="mx-1 h-px w-3 shrink-0 bg-[var(--color-border)]" />
          )}
        </li>
      ))}
    </ol>
  );
}
