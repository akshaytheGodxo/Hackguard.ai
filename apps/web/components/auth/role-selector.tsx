"use client"

import { UserRound, Wrench } from "lucide-react"
import { ROLES, ROLE_BLURB, ROLE_LABEL, type Role } from "@/lib/auth/roles"

const ROLE_ICON: Record<Role, typeof UserRound> = {
  candidate: UserRound,
  organizer: Wrench,
}

export function RoleSelector({ value, onChange }: { value: Role; onChange: (role: Role) => void }) {
  return (
    <div className="mt-6">
      <span className="text-[11px] font-semibold text-[var(--hg-text)]">
        I want to continue as
      </span>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {ROLES.map((role) => {
          const Icon = ROLE_ICON[role]
          const selected = value === role
          return (
            <button
              key={role}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(role)}
              className={`flex flex-col items-start gap-1.5 rounded-xl border px-4 py-3 text-left transition-all ${
                selected
                  ? "border-[var(--hg-cyan)]/60 bg-[var(--hg-cyan)]/10"
                  : "border-[var(--hg-border-strong)] bg-[var(--hg-surface)] hover:border-[var(--hg-cyan)]/30"
              }`}
            >
              <Icon
                className={`size-4 ${selected ? "text-[var(--hg-cyan)]" : "text-[var(--hg-dim)]"}`}
              />
              <span className="text-[13px] font-semibold text-[var(--hg-text)]">
                {ROLE_LABEL[role]}
              </span>
              <span className="text-[11px] leading-tight text-[var(--hg-muted)]">
                {ROLE_BLURB[role]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
