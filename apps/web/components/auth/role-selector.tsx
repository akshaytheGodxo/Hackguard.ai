"use client"

import { Check, UserRound, Wrench } from "lucide-react"
import { ROLES, ROLE_BLURB, ROLE_LABEL, type Role } from "@/lib/auth/roles"

const ROLE_ICON: Record<Role, typeof UserRound> = {
  candidate: UserRound,
  organizer: Wrench,
}

export function RoleSelector({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <fieldset className="mt-6">
      <legend className="text-[11px] font-semibold text-[var(--hg-text)]">
        I want to continue as
      </legend>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const Icon = ROLE_ICON[role]
          const selected = value === role
          return (
            <button
              key={role}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(role)}
              className={`relative flex min-w-0 flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-all ${
                selected
                  ? "border-[var(--hg-cyan)]/60 bg-[var(--hg-cyan)]/10 shadow-[0_10px_30px_rgba(105,228,231,0.08)]"
                  : "border-[var(--hg-border-strong)] bg-[var(--hg-surface)] hover:border-[var(--hg-cyan)]/30 hover:bg-[var(--hg-surface-soft)]"
              }`}
            >
              <span
                className={`grid size-8 place-items-center rounded-lg border transition-colors ${
                  selected
                    ? "border-[var(--hg-cyan)]/40 bg-[var(--hg-cyan)]/15 text-[var(--hg-cyan)]"
                    : "border-[var(--hg-border)] bg-[var(--hg-bg)] text-[var(--hg-dim)]"
                }`}
              >
                <Icon className="size-4" />
              </span>
              <span className="text-[13px] font-semibold text-[var(--hg-text)]">
                {ROLE_LABEL[role]}
              </span>
              <span className="text-[11px] leading-snug text-[var(--hg-muted)]">
                {ROLE_BLURB[role]}
              </span>
              {selected ? (
                <span className="absolute top-3 right-3 grid size-4 place-items-center rounded-full bg-[var(--hg-cyan)] text-[#101426]">
                  <Check className="size-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
