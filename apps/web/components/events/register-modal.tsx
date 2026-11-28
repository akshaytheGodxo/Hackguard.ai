"use client"

import { CircleMinus, Radio, Trophy, UserPlus, Users, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createPortal } from "react-dom"
import { useEffect, useRef, useState, useTransition, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { FormAlert, FormField, StatusPill } from "@/components/ui/app-ui"
import { Input } from "@/components/ui/input"
import { registerForHackathon } from "@/lib/actions"
import { MAX_TEAM_SIZE, type Hackathon, type TeamMember } from "@/lib/api/hackathons"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

export function RegisterModal({
  hackathon,
  onClose,
}: {
  hackathon: Hackathon
  onClose: () => void
}) {
  const router = useRouter()
  const dialogRef = useRef<HTMLDivElement>(null)
  const [pending, startTransition] = useTransition()
  const [teamName, setTeamName] = useState("")
  const [leader, setLeader] = useState<TeamMember>({ name: "", email: "" })
  const [members, setMembers] = useState<TeamMember[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (event.key !== "Tab" || !dialogRef.current) return

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
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
    setMembers((current) =>
      current.map((member, i) => (i === index ? { ...member, ...patch } : member)),
    )
  }

  function addMember() {
    if (totalMembers >= MAX_TEAM_SIZE) return
    setMembers((current) => [...current, { name: "", email: "" }])
  }

  function removeMember(index: number) {
    setMembers((current) => current.filter((_, i) => i !== index))
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!teamName.trim()) {
      setError("Enter a team name to continue.")
      return
    }

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
    for (let index = 1; index < team.length; index++) {
      if (!team[index].name || !EMAIL_PATTERN.test(team[index].email)) {
        setError("Each added member needs a name and a valid email — or clear the row.")
        return
      }
    }

    startTransition(async () => {
      try {
        const result = await registerForHackathon(hackathon.id, teamName.trim(), team)
        if (result?.error) {
          setError(result.error)
          return
        }
        onClose()
        router.refresh()
      } catch (registrationError) {
        console.error("Team registration request failed:", registrationError)
        setError("Unable to register your team. Please try again.")
      }
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      <div
        className="hg-backdrop-in absolute inset-0 bg-[#03060b]/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-modal-title"
        aria-describedby="register-modal-description"
        className="hg-pop-in relative z-10 flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[var(--hg-border-strong)] bg-[var(--hg-surface)] shadow-[0_30px_100px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--hg-border)] bg-[var(--hg-bg)]/40 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]">
              <UserPlus className="size-4" />
            </span>
            <div className="min-w-0">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
                Team registration
              </span>
              <h2 id="register-modal-title" className="mt-1 text-[17px] font-semibold text-[var(--hg-text)]">
                {hackathon.name}
              </h2>
              <p id="register-modal-description" className="mt-1 text-[11px] leading-relaxed text-[var(--hg-muted)]">
                Fill in your team details. You can add up to {MAX_TEAM_SIZE} members including the leader.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close registration"
            className="rounded-lg border border-[var(--hg-border)] p-1.5 text-[var(--hg-muted)] transition-colors hover:border-[var(--hg-border-strong)] hover:text-[var(--hg-text)]"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex min-h-0 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={hackathon.status === "Live" ? "live" : "upcoming"}>
                {hackathon.status}
              </StatusPill>
              <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--hg-dim)]">
                {hackathon.type === "live" ? <Radio className="size-3.5" /> : <Trophy className="size-3.5" />}
                {hackathon.date}
              </span>
              <Link
                href={`/rooms/${hackathon.id}`}
                className="ml-auto text-[11px] font-semibold text-[var(--hg-cyan)] hover:underline"
              >
                View event
              </Link>
            </div>

            <FormField label="Team name" htmlFor="registration-team-name" required>
              <Input
                autoFocus
                id="registration-team-name"
                name="team-name"
                placeholder="e.g. Byte Builders"
                value={teamName}
                maxLength={100}
                onChange={(event) => setTeamName(event.target.value)}
                className={inputClass}
              />
            </FormField>

            <div className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[12px] font-semibold text-[var(--hg-text)]">Team leader</p>
                  <p className="mt-0.5 text-[11px] text-[var(--hg-dim)]">
                    This person will be registered as the primary contact.
                  </p>
                </div>
                <span className="rounded-full border border-[var(--hg-border)] bg-[var(--hg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--hg-muted)]">
                  01
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <FormField label="Full name" htmlFor="registration-leader-name" required>
                  <Input
                    id="registration-leader-name"
                    name="leader-name"
                    placeholder="Jane Doe"
                    value={leader.name}
                    onChange={(event) => setLeader((current) => ({ ...current, name: event.target.value }))}
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Email" htmlFor="registration-leader-email" required>
                  <Input
                    id="registration-leader-email"
                    type="email"
                    name="leader-email"
                    placeholder="jane@team.com"
                    value={leader.email}
                    onChange={(event) => setLeader((current) => ({ ...current, email: event.target.value }))}
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 text-[var(--hg-cyan)]" />
                  <span className="text-[12px] font-semibold text-[var(--hg-text)]">Team members</span>
                </div>
                <span className="font-mono text-[10px] text-[var(--hg-dim)]">
                  {String(totalMembers).padStart(2, "0")} / {String(MAX_TEAM_SIZE).padStart(2, "0")}
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {members.map((member, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/50 p-3.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-semibold uppercase tracking-wide text-[var(--hg-dim)]">
                        Member {String(index + 2).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        aria-label={`Remove member ${index + 2}`}
                        className="rounded-md p-1 text-[var(--hg-dim)] transition-colors hover:bg-red-500/10 hover:text-red-400"
                      >
                        <CircleMinus className="size-4" />
                      </button>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <FormField label="Full name" htmlFor={`registration-member-${index}-name`} required>
                        <Input
                          id={`registration-member-${index}-name`}
                          name={`member-${index}-name`}
                          placeholder="Alex Smith"
                          value={member.name}
                          onChange={(event) => updateMember(index, { name: event.target.value })}
                          className={inputClass}
                        />
                      </FormField>
                      <FormField label="Email" htmlFor={`registration-member-${index}-email`} required>
                        <Input
                          id={`registration-member-${index}-email`}
                          type="email"
                          name={`member-${index}-email`}
                          placeholder="alex@team.com"
                          value={member.email}
                          onChange={(event) => updateMember(index, { email: event.target.value })}
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={addMember}
                disabled={totalMembers >= MAX_TEAM_SIZE}
                className="mt-3 h-9 w-full rounded-lg! border-dashed border-[var(--hg-border-strong)] bg-transparent text-[11px] font-semibold text-[var(--hg-muted)] hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)]"
              >
                <UserPlus className="size-3.5" />
                {totalMembers >= MAX_TEAM_SIZE ? "Team is full" : "Add another member"}
              </Button>
            </div>

            {error ? <FormAlert>{error}</FormAlert> : null}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-[var(--hg-border)] bg-[var(--hg-bg)]/40 px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 rounded-lg! border-[var(--hg-border-strong)] bg-transparent px-4 text-[12px] font-semibold text-[var(--hg-muted)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="hg-gradient-bg h-10 rounded-lg! px-5 text-[12px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] hover:brightness-105"
            >
              {pending ? "Registering…" : "Confirm registration"}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
