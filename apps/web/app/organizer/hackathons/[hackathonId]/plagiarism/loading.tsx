export default function Loading() {
  return (
    <main className="min-h-screen bg-[var(--hg-bg)]">
      <div className="mx-auto max-w-7xl animate-pulse px-6 py-10">
        <div className="h-4 w-36 rounded bg-white/10" />
        <div className="mt-8 h-8 w-72 rounded bg-white/10" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-white/5" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-24 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]" />
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="h-48 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]" />
          <div className="h-48 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]" />
        </div>
        <div className="mt-5 h-80 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)]" />
      </div>
    </main>
  )
}
