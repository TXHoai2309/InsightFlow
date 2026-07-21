export default function AppLoading() {
  return (
    <div className="relative min-h-[45vh] w-full overflow-hidden px-4 py-8 md:px-8">
      <div className="fixed left-0 right-0 top-0 z-[200] h-1 overflow-hidden bg-[var(--color-brand-subtle)]">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-[var(--color-brand)]" />
      </div>
      <div className="mx-auto max-w-[1600px] animate-pulse space-y-5" aria-label="Đang chuyển trang">
        <div className="h-8 w-48 rounded-lg bg-[var(--color-bg-surface)]" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-28 rounded-xl bg-[var(--color-bg-surface)]" />
          <div className="h-28 rounded-xl bg-[var(--color-bg-surface)]" />
          <div className="h-28 rounded-xl bg-[var(--color-bg-surface)]" />
        </div>
        <div className="h-72 rounded-xl bg-[var(--color-bg-surface)]" />
      </div>
    </div>
  );
}
