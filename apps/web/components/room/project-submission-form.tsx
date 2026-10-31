"use client"

import { useState, type FormEvent } from "react"

type Props = {
  hackathonId: string
  registrationId: string
  teamName: string
  teamLeaderEmail: string
  projectZipUrl?: string
  githubRepoUrl?: string
}

export function ProjectSubmissionForm({
  hackathonId,
  registrationId,
  teamName: initialTeamName,
  teamLeaderEmail,
  projectZipUrl: initialProjectZipUrl = "",
  githubRepoUrl: initialGithubRepoUrl = "",
}: Props) {
  const [teamName, setTeamName] = useState(initialTeamName)
  const [projectZipUrl, setProjectZipUrl] = useState(initialProjectZipUrl)
  const [githubRepoUrl, setGithubRepoUrl] = useState(initialGithubRepoUrl)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch("/api/project-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hackathonId,
          registrationId,
          teamName,
          projectZipUrl,
          githubRepoUrl,
        }),
      })

      let payload: unknown
      try {
        payload = await response.json()
      } catch {
        throw new Error("The server returned an invalid response.")
      }

      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Project submission failed."
        throw new Error(message)
      }

      setSuccess("Project submitted successfully.")
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Project submission failed.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5">
      <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">
        Submit your project
      </h2>
      <p className="mt-1 text-[12px] text-[var(--hg-dim)]">
        Provide a ZIP URL or storage key and your GitHub repository link.
      </p>

      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-1.5 text-[11px] font-semibold text-[var(--hg-muted)]">
          Team name
          <input
            required
            maxLength={100}
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            className="h-10 rounded-md border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[13px] text-[var(--hg-text)] outline-none focus:border-[var(--hg-cyan)]/50"
          />
        </label>

        <p className="text-[11px] text-[var(--hg-dim)]">
          Team leader email: <span className="text-[var(--hg-muted)]">{teamLeaderEmail}</span>
        </p>

        <label className="grid gap-1.5 text-[11px] font-semibold text-[var(--hg-muted)]">
          Project ZIP URL or storage key
          <input
            required
            maxLength={2_048}
            value={projectZipUrl}
            onChange={(event) => setProjectZipUrl(event.target.value)}
            placeholder="https://storage.example.com/project.zip"
            className="h-10 rounded-md border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[13px] text-[var(--hg-text)] outline-none placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
          />
        </label>

        <label className="grid gap-1.5 text-[11px] font-semibold text-[var(--hg-muted)]">
          GitHub repository
          <input
            required
            type="url"
            maxLength={2_048}
            value={githubRepoUrl}
            onChange={(event) => setGithubRepoUrl(event.target.value)}
            placeholder="https://github.com/team/project"
            className="h-10 rounded-md border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[13px] text-[var(--hg-text)] outline-none placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
          />
        </label>

        {error && (
          <p role="alert" className="text-[12px] font-medium text-red-400">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="text-[12px] font-medium text-emerald-400">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="h-10 rounded-lg bg-[var(--hg-cyan)] px-4 text-[12px] font-bold text-[#101426] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Submitting…" : "Submit project"}
        </button>
      </form>
    </section>
  )
}
