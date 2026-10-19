"use client"

import { CircleMinus, UserPlus, X } from "lucide-react"
import { Field } from "@base-ui/react/field"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useState, useTransition, type FormEvent } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerForHackathon } from "@/lib/actions"
import { MAX_TEAM_SIZE, type Hackathon, type TeamMember } from "@/lib/api/hackathons"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
const labelClass = "text-[11px] font-semibold text-[var(--hg-text)]"
const fieldLabelClass = "text-[10px] font-medium text-[var(--hg-dim)]"

export function RegisterModal({
  hackathon,
  onClose,
}: {
  hackathon: Hackathon
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [leader, setLeader] = useState<TeamMember>({ name: "", email: "" })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      window.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const totalMembers = 1 + members.length

  function updateMember(index: number, patch: Partial<TeamMember>) {
    setMembers((prev) =>
      prev.map((member, i) => (i === index ? { ...member, ...patch } : member)),
    )
  }

  function addMember() {
    if (totalMembers >= MAX_TEAM_SIZE) return
    setMembers((prev) => [...prev, { name: "", email: "" }])
  }

  function removeMember(index: number) {
    setMembers((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const team: TeamMember[] = [
      { name: leader.name.trim(), email: leader.email.trim() },
      ...members.map((member) => ({ name: member.name.trim(), email: member.email.trim() })),
    ].filter((member, index) => index === 0 || member.name !== "" || member.email !== "")

    if (!team[0].name) {
      setError("Enter the team leader's name.")
      return
    }
    if (!EMAIL_PATTERN.test(team[0].email)) {
      setError("Enter a valid email address for the team leader.")
      return
    }
    for (let i = 1; i < team.length; i++) {
      if (!team[i].name || !EMAIL_PATTERN.test(team[i].email)) {
        setError("Each team member needs both a name and a valid email — or clear the row.")
        return
      }
    }

    setError(null)
    startTransition(async () => {
      const result = await registerForHackathon(hackathon.id, team)
      if (result?.error) {
        setError(result.error)
        return
      }
      onClose()
      router.refresh()
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="hg-backdrop-in absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        className="hg-pop-in relative z-10 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[var(--hg-border-strong)] bg-[var(--hg-surface)] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
              Team registration
            </span>
            <h2
              id="register-modal-title"
              className="mt-1.5 text-[17px] font-semibold text-[var(--hg-text)]"
            >
              {hackathon.name}
            </h2>
            <p className="mt-0.5 text-[12px] text-[var(--hg-muted)]">
              Max team size is {MAX_TEAM_SIZE} — leader first, members optional.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg border border-[var(--hg-border)] p-1.5 text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form className="mt-5" onSubmit={handleSubmit} noValidate>
          <span className={labelClass}>Team leader</span>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <Field.Root className="flex flex-col gap-1.5">
              <Label className={fieldLabelClass}>Name</Label>
              <Input
                autoFocus
                name="leader-name"
                placeholder="Jane Doe"
                value={leader.name}
                onChange={(event) => setLeader((prev) => ({ ...prev, name: event.target.value }))}
                className={fieldClass}
              />
            </Field.Root>
            <Field.Root className="flex flex-col gap-1.5">
              <Label className={fieldLabelClass}>Email</Label>
              <Input
                type="email"
                name="leader-email"
                placeholder="jane@team.com"
                value={leader.email}
                onChange={(event) => setLeader((prev) => ({ ...prev, email: event.target.value }))}
                className={fieldClass}
              />
            </Field.Root>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className={labelClass}>Team members</span>
            <span className="text-[10px] font-medium text-[var(--hg-dim)]">
              {totalMembers}/{MAX_TEAM_SIZE} members
            </span>
          </div>

          {members.map((member, index) => (
            <div
              key={index}
              className="mt-2 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/60 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--hg-dim)]">
                  Member {index + 2}
                </span>
                <button
                  type="button"
                  onClick={() => removeMember(index)}
                  aria-label={`Remove member ${index + 2}`}
                  className="rounded p-1 text-[var(--hg-dim)] transition-colors hover:text-red-400"
                >
                  <CircleMinus className="size-4" />
                </button>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Input
                  name={`member-${index}-name`}
                  placeholder="Name"
                  value={member.name}
                  onChange={(event) => updateMember(index, { name: event.target.value })}
                  className={fieldClass}
                />
                <Input
                  type="email"
                  name={`member-${index}-email`}
                  placeholder="Email"
                  value={member.email}
                  onChange={(event) => updateMember(index, { email: event.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addMember}
            disabled={totalMembers >= MAX_TEAM_SIZE}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--hg-border-strong)] px-3 py-2 text-[11px] font-semibold text-[var(--hg-muted)] transition-colors hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[var(--hg-border-strong)] disabled:hover:text-[var(--hg-muted)]"
          >
            <UserPlus className="size-3.5" />
            {totalMembers >= MAX_TEAM_SIZE ? "Team is full" : "Add member"}
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-400"
            >
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 flex-1 rounded-lg border border-[var(--hg-border-strong)] text-[13px] font-semibold text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="hg-gradient-bg h-10 flex-1 rounded-lg text-[13px] font-bold shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Registering…" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
