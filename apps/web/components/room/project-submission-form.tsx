"use client"

import { CheckCircle2, FileArchive, GitBranch, UploadCloud } from "lucide-react"
import { useState, type ChangeEvent, type FormEvent } from "react"
import { FormAlert, FormField } from "@/components/ui/app-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Props = {
  hackathonId: string
  registrationId: string
  teamName: string
  teamLeaderEmail: string
  githubRepoUrl?: string
}

const inputClass =
  "h-10 w-full min-w-0 rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 text-[13px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

export function ProjectSubmissionForm({
  hackathonId,
  registrationId,
  teamName: initialTeamName,
  teamLeaderEmail,
  githubRepoUrl: initialGithubRepoUrl = "",
}: Props) {
  const [teamName, setTeamName] = useState(initialTeamName)
  const [projectZipFile, setProjectZipFile] = useState<File | null>(null)
  const [githubRepoUrl, setGithubRepoUrl] = useState(initialGithubRepoUrl)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function handleZipChange(event: ChangeEvent<HTMLInputElement>) {
    setProjectZipFile(event.target.files?.[0] ?? null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return

    setPending(true)
    setError(null)
    setSuccess(null)

    try {
      if (!projectZipFile) {
        throw new Error("Choose a ZIP file to submit.")
      }

      const formData = new FormData()
      formData.set("hackathonId", hackathonId)
      formData.set("registrationId", registrationId)
      formData.set("teamName", teamName)
      formData.set("projectZipFile", projectZipFile)
      formData.set("githubRepoUrl", githubRepoUrl)

      const response = await fetch("/api/project-submissions", {
        method: "POST",
        body: formData,
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
        submitError instanceof Error ? submitError.message : "Project submission failed.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-4 shadow-[var(--hg-shadow)] sm:p-5">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]">
          <UploadCloud className="size-4" />
        </span>
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--hg-text)]">Submit your project</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--hg-dim)]">
            Upload your project as a ZIP file (up to 50 MB) and link the source repository.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <FormField label="Team name" htmlFor="submission-team-name" required>
          <Input
            id="submission-team-name"
            required
            maxLength={100}
            value={teamName}
            onChange={(event) => setTeamName(event.target.value)}
            placeholder="Byte Builders"
            className={inputClass}
          />
          <span className="text-[11px] text-[var(--hg-dim)]">
            Team leader: <strong className="font-medium text-[var(--hg-muted)]">{teamLeaderEmail}</strong>
          </span>
        </FormField>

        <FormField label="Project ZIP" htmlFor="project-zip-file" required>
          <label
            htmlFor="project-zip-file"
            className="flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-[var(--hg-border-strong)] bg-[var(--hg-bg)]/60 px-4 py-3 transition-colors hover:border-[var(--hg-cyan)]/50 focus-within:border-[var(--hg-cyan)]/50"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/5 text-[var(--hg-cyan)]">
                <FileArchive className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12px] font-semibold text-[var(--hg-text)]">
                  {projectZipFile?.name || "Choose a ZIP file"}
                </span>
                <span className="block text-[11px] text-[var(--hg-dim)]">
                  {projectZipFile
                    ? `${(projectZipFile.size / 1024 / 1024).toFixed(1)} MB selected`
                    : "Up to 50 MB · .zip only"}
                </span>
              </span>
            </span>
            <span className="rounded-md border border-[var(--hg-border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--hg-muted)]">
              Browse
            </span>
          </label>
          <input
            id="project-zip-file"
            type="file"
            accept=".zip,application/zip,application/x-zip-compressed"
            required
            onChange={handleZipChange}
            className="sr-only"
          />
        </FormField>

        <FormField label="GitHub repository" htmlFor="submission-repo" required>
          <div className="relative">
            <GitBranch className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <Input
              id="submission-repo"
              required
              type="url"
              maxLength={2_048}
              value={githubRepoUrl}
              onChange={(event) => setGithubRepoUrl(event.target.value)}
              placeholder="https://github.com/team/project"
              className={`${inputClass} pl-9`}
            />
          </div>
        </FormField>

        {error ? <FormAlert>{error}</FormAlert> : null}
        {success ? (
          <FormAlert tone="success">
            <CheckCircle2 className="mr-1.5 inline size-3.5" />
            {success}
          </FormAlert>
        ) : null}

        <Button
          type="submit"
          disabled={pending}
          className="hg-gradient-bg h-10 w-full rounded-lg! text-[12px] font-bold text-[#101426] hover:brightness-105"
        >
          {pending ? "Submitting…" : "Submit project"}
        </Button>
      </form>
    </section>
  )
}
