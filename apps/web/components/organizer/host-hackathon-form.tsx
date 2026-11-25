"use client"

import { ArrowLeft, CalendarPlus } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue } from "@/components/ui/select"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { hostHackathon } from "@/lib/actions"
import type { SessionView } from "@/lib/auth/session"

const items = [
  {label: "Standard", value: "standard"},
  {label: "Live 1vs1", value: "live"}
]

export function HostHackathonForm({ session }: { session: SessionView }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [hackathonType, setHackathonType] = useState("")
  const [startDate, setStartDate] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const data = new FormData(e.currentTarget)
    const name = String(data.get("name") ?? "").trim()
    const date = String(data.get("date") ?? "")
    const enddate = String(data.get("enddate") ?? "")
    const description = String(data.get("description") ?? "").trim()
    const type = String(data.get("type") ?? "").trim()
    if (!name || !date || !description || !type || !enddate) {
      setError("Complete all required fields before creating your hackathon.")
      return
    }
    if (enddate < date) {
      setError("The end date must be on or after the start date.")
      return
    }

    startTransition(async () => {
      const result = await hostHackathon(data)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <main className="hg-fade-in min-h-screen bg-[var(--hg-bg)]">
      <DashboardHeader session={session} />

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/organizer"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]"
        >
          <ArrowLeft className="size-3.5" /> Back to your hackathons
        </Link>

        <span className="mt-6 block font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
          New event
        </span>
        <h1 className="mt-2 text-3xl font-bold text-[var(--hg-text)]">Host a hackathon</h1>
        <p className="mt-1 text-[13px] text-[var(--hg-muted)]">
          Fill in the details — it will show up for candidates right away.
        </p>

        <form
          className="mt-7 rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.12)] sm:p-6"
          onSubmit={handleSubmit}
        >
          <Field.Root className="flex flex-col gap-1.5">
            <Label className="text-[11px] font-semibold text-[var(--hg-text)]">
              Hackathon name
            </Label>
            <Input
              name="name"
              placeholder="e.g. HackSphere 2027"
              required
              className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
            />
          </Field.Root>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field.Root className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Start date</Label>
              <Input
                type="date"
                name="date"
                required
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] [color-scheme:dark] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
              />
            </Field.Root>
            <Field.Root className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold text-[var(--hg-text)]">End date</Label>
              <Input
                type="date"
                name="enddate"
                required
                min={startDate || undefined}
                className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] [color-scheme:dark] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
              />
            </Field.Root>
            <Field.Root className="flex flex-col gap-1.5">
                <Label htmlFor="hackathon-type" className="text-[11px] font-semibold text-[var(--hg-text)]">Hackathon type</Label>
              <Select
                items={items}
                name="type"
                required
                onValueChange={(value) => setHackathonType(String(value ?? ""))}
              >
                <SelectTrigger id="hackathon-type" className="h-10 w-full rounded-md border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[13px] text-[var(--hg-text)] data-placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15">
                  <SelectValue placeholder="Choose your type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field.Root>
          </div>

          {hackathonType === "standard" && (
            <>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field.Root className="flex flex-col gap-1.5">
                  <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Start time</Label>
                  <Input
                    type="time"
                    name="startTime"
                    required
                    className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] [color-scheme:dark] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
                  />
                </Field.Root>
                <Field.Root className="flex flex-col gap-1.5">
                  <Label className="text-[11px] font-semibold text-[var(--hg-text)]">End time</Label>
                  <Input
                    type="time"
                    name="endTime"
                    required
                    className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] [color-scheme:dark] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
                  />
                </Field.Root>
              </div>

              <Field.Root className="mt-4 flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold text-[var(--hg-text)]">
                  Problem Statement
                </Label>
                <textarea
                  name="problemStatement"
                  required
                  rows={5}
                  placeholder="Describe the challenge teams will solve."
                  className="w-full resize-y rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2.5 text-[13px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
                />
              </Field.Root>
            </>
          )}

          <Field.Root className="mt-4 flex flex-col gap-1.5">
            <Label className="text-[11px] font-semibold text-[var(--hg-text)]">
              Description
            </Label>
            <textarea
              name="description"
              required
              rows={4}
              placeholder="What is this hackathon about?"
              className="w-full resize-y rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2.5 text-[13px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
            />
          </Field.Root>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-400"
            >
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={pending}
            className="hg-gradient-bg mt-4 h-11 w-full rounded-lg! px-4 text-[13px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <CalendarPlus className="size-4" />
            {pending ? "Creating…" : "Create hackathon"}
          </Button>
        </form>
      </div>
    </main>
  )
}
