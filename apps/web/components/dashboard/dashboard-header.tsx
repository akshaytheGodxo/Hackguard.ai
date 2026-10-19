"use client"

import { useTransition } from "react"
import { switchRole } from "@/lib/actions"
import type { SessionView } from "@/lib/auth/session"
import { ROLES, ROLE_LABEL, type Role } from "@/lib/auth/roles"

export function DashboardHeader({ session }: { session: SessionView }) {
  const { role } = session
  const [pending, startTransition] = useTransition()

  function select(next: Role) {
    if (next === role || pending) return
    startTransition(async () => {
      await switchRole(next)
    })
  }

  return (
    <header className="border-b border-[var(--hg-border)] bg-[var(--hg-surface)]/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <span className="font-mono text-[13px] font-bold tracking-tight text-[var(--hg-text)]">
          HackGuard <span className="text-[var(--hg-cyan)]">AI</span>
        </span>

        <div
          role="tablist"
          aria-label="Switch role"
          className="relative grid shrink-0 grid-cols-2 rounded-full border border-[var(--hg-border)] bg-[var(--hg-bg)] p-1"
        >
          <span
            aria-hidden="true"
            className="hg-gradient-bg pointer-events-none absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: role === "organizer" ? "translateX(100%)" : "translateX(0)" }}
          />
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              role="tab"
              aria-selected={role === r}
              onClick={() => select(r)}
              className={`relative z-10 rounded-full px-4 py-1.5 text-[11px] font-semibold transition-colors duration-200 ${
                role === r
                  ? "text-[#101426]"
                  : "text-[var(--hg-muted)] hover:text-[var(--hg-text)]"
              }`}
            >
              {ROLE_LABEL[r]}
            </button>
          ))}
        </div>

        <span className="text-[12px] text-[var(--hg-muted)]">{session.email}</span>
      </div>
    </header>
  )
}
