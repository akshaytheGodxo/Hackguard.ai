"use client"

import { ArrowLeft, CalendarPlus, Clock3, Code2, FileText, Radio, Trophy } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { FormAlert, FormField, PageIntro } from "@/components/ui/app-ui"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Input } from "@/components/ui/input"
import { hostHackathon } from "@/lib/actions"
import type { SessionView } from "@/lib/auth/session"

const inputClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] [color-scheme:dark] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
const textareaClass =
  "w-full resize-y rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

export function HostHackathonForm({ session }: { session: SessionView }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [hackathonType, setHackathonType] = useState("")
  const [startDate, setStartDate] = useState("")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const data = new FormData(event.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const date = String(data.get("date") ?? "")
    const endDate = String(data.get("enddate") ?? "")
    const description = String(data.get("description") ?? "").trim()
    const type = String(data.get("type") ?? "").trim()

    if (!name || !date || !description || !type || !endDate) {
      setError("Complete all required fields before creating your hackathon.")
      return
    }
    if (endDate < date) {
      setError("The end date must be on or after the start date.")
      return
    }
    if (type === "standard") {
      const startTime = String(data.get("startTime") ?? "")
      const endTime = String(data.get("endTime") ?? "")
      if (!startTime || !endTime) {
        setError("Add a start and end time for standard hackathons.")
        return
      }
      if (endDate === date && endTime < startTime) {
        setError("The end time must be after the start time.")
        return
      }
    }

    startTransition(async () => {
      const result = await hostHackathon(data)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to your hackathons
        </Link>

        <PageIntro
          className="mt-6"
          eyebrow="New event"
          icon={<Trophy className="size-3.5" />}
          title="Host a hackathon"
          description="Set the schedule and challenge details. Candidates will see your event as soon as it's created."
        />

        <form
          onSubmit={handleSubmit}
          className="mt-5 space-y-5 rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-4 shadow-[var(--hg-shadow)] sm:p-6"
        >
          <fieldset>
            <legend className="text-[11px] font-semibold tracking-wide text-[var(--hg-text)]">
              Event format <span className="ml-1 text-[var(--hg-cyan)]">*</span>
            </legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  hackathonType === "standard"
                    ? "border-[var(--hg-cyan)]/60 bg-[var(--hg-cyan)]/10"
                    : "border-[var(--hg-border-strong)] bg-[var(--hg-bg)]/50 hover:border-[var(--hg-cyan)]/30"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="standard"
                  required
                  checked={hackathonType === "standard"}
                  onChange={() => setHackathonType("standard")}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <Code2 className="size-4 text-[var(--hg-cyan)]" />
                  <span className="text-[13px] font-semibold text-[var(--hg-text)]">Standard</span>
                </span>
                <span className="mt-2 block text-[11px] leading-relaxed text-[var(--hg-muted)]">
                  Team registration, one problem statement, and repository submission.
                </span>
              </label>
              <label
                className={`cursor-pointer rounded-xl border p-4 transition-all ${
                  hackathonType === "live"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-[var(--hg-border-strong)] bg-[var(--hg-bg)]/50 hover:border-emerald-500/30"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value="live"
                  required
                  checked={hackathonType === "live"}
                  onChange={() => setHackathonType("live")}
                  className="sr-only"
                />
                <span className="flex items-center gap-2">
                  <Radio className="size-4 text-emerald-400" />
                  <span className="text-[13px] font-semibold text-[var(--hg-text)]">Live 1v1</span>
                </span>
                <span className="mt-2 block text-[11px] leading-relaxed text-[var(--hg-muted)]">
                  Rapid arena with multiple problems you can add after creation.
                </span>
              </label>
            </div>
          </fieldset>

          <FormField label="Hackathon name" htmlFor="hackathon-name" required>
            <Input
              id="hackathon-name"
              name="name"
              placeholder="e.g. HackSphere 2027"
              required
              className={inputClass}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Start date" htmlFor="hackathon-start-date" required>
              <Input
                id="hackathon-start-date"
                type="date"
                name="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className={inputClass}
              />
            </FormField>
            <FormField label="End date" htmlFor="hackathon-end-date" required>
              <Input
                id="hackathon-end-date"
                type="date"
                name="enddate"
                required
                min={startDate || undefined}
                className={inputClass}
              />
            </FormField>
          </div>

          {hackathonType === "standard" ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Start time" htmlFor="hackathon-start-time" required>
                  <Input id="hackathon-start-time" type="time" name="startTime" required className={inputClass} />
                </FormField>
                <FormField label="End time" htmlFor="hackathon-end-time" required>
                  <Input id="hackathon-end-time" type="time" name="endTime" required className={inputClass} />
                </FormField>
              </div>
              <FormField
                label="Problem statement"
                htmlFor="hackathon-problem-statement"
                hint="Shown to candidates when they open the event room."
                required
              >
                <textarea
                  id="hackathon-problem-statement"
                  name="problemStatement"
                  required
                  rows={5}
                  placeholder="Describe the challenge teams will solve."
                  className={textareaClass}
                />
              </FormField>
            </>
          ) : null}

          <FormField label="Description" htmlFor="hackathon-description" required>
            <textarea
              id="hackathon-description"
              name="description"
              required
              rows={4}
              placeholder="What is this hackathon about?"
              className={textareaClass}
            />
          </FormField>

          {error ? <FormAlert>{error}</FormAlert> : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--hg-border)] pt-4">
            <Link
              href="/organizer"
              className="inline-flex h-10 items-center rounded-lg px-4 text-[12px] font-semibold text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
            >
              Cancel
            </Link>
            <Button
              type="submit"
              size="lg"
              disabled={pending}
              className="hg-gradient-bg h-10 rounded-lg! px-5 text-[12px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] hover:brightness-105"
            >
              {pending ? <Clock3 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
              {pending ? "Creating…" : "Create hackathon"}
            </Button>
          </div>
        </form>

        <p className="mt-4 flex items-center gap-2 text-[11px] text-[var(--hg-dim)]">
          <FileText className="size-3.5" />
          You can add problems and adjust details after creating the event.
        </p>
      </div>
    </main>
  )
}
