"use client"

import { CheckCircle2, Plus, Trash2, X } from "lucide-react"
import { useState, useTransition } from "react"
import { FormAlert, FormField } from "@/components/ui/app-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addProblem, type TestCaseDraft } from "@/lib/actions"

const EMPTY_TEST_CASE: TestCaseDraft = { input: "", output: "" }

const inputClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
const codeAreaClass =
  "w-full resize-y rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2 font-mono text-[12px] leading-relaxed text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

export function AddProblemForm({
  hackathonId,
  onClose,
  onSaved,
}: {
  hackathonId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([{ ...EMPTY_TEST_CASE }])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function updateTestCase(index: number, patch: Partial<TestCaseDraft>) {
    setTestCases((current) =>
      current.map((testCase, position) =>
        position === index ? { ...testCase, ...patch } : testCase,
      ),
    )
  }

  function addTestCase() {
    setTestCases((current) => [...current, { ...EMPTY_TEST_CASE }])
  }

  function removeTestCase(index: number) {
    setTestCases((current) =>
      current.length === 1 ? [{ ...EMPTY_TEST_CASE }] : current.filter((_, position) => position !== index),
    )
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    startTransition(async () => {
      const result = await addProblem(hackathonId, { name, description, testCases })
      if (result?.error) {
        setError(result.error)
        return
      }
      setSaved(true)
      onSaved()
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="min-w-0 rounded-xl border border-[var(--hg-border-strong)] bg-[var(--hg-bg)]/50 p-4 sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold text-[var(--hg-text)]">Add a problem</h3>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--hg-dim)]">
              Candidates solve this during the live event.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close problem form"
          className="rounded-md p-1 text-[var(--hg-dim)] transition-colors hover:bg-white/5 hover:text-[var(--hg-text)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        <FormField label="Problem name" htmlFor="problem-name" required>
          <Input
            id="problem-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Two Sum"
            required
            className={inputClass}
          />
        </FormField>

        <FormField label="Description" htmlFor="problem-description" required>
          <textarea
            id="problem-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={3}
            placeholder="Describe the problem statement, constraints, and expected output."
            className="w-full resize-y rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"
          />
        </FormField>

        <div className="border-t border-[var(--hg-border)] pt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--hg-dim)]">
              Test cases
            </span>
            <span className="font-mono text-[10px] text-[var(--hg-dim)]">
              {String(testCases.length).padStart(2, "0")} added
            </span>
          </div>

          <div className="mt-3 space-y-3">
            {testCases.map((testCase, index) => (
              <div
                key={index}
                className="grid min-w-0 gap-3 rounded-lg border border-[var(--hg-border)] bg-[var(--hg-surface)] p-3 sm:grid-cols-2"
              >
                <FormField label={`Input ${index + 1}`} htmlFor={`test-input-${index}`} required>
                  <textarea
                    id={`test-input-${index}`}
                    value={testCase.input}
                    onChange={(event) => updateTestCase(index, { input: event.target.value })}
                    rows={2}
                    placeholder="stdin fed to the solution"
                    className={codeAreaClass}
                  />
                </FormField>
                <FormField
                  label={`Expected output ${index + 1}`}
                  htmlFor={`test-output-${index}`}
                  required
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <textarea
                      id={`test-output-${index}`}
                      value={testCase.output}
                      onChange={(event) => updateTestCase(index, { output: event.target.value })}
                      rows={2}
                      placeholder="expected stdout"
                      className={codeAreaClass}
                    />
                    <button
                      type="button"
                      onClick={() => removeTestCase(index)}
                      aria-label={`Remove test case ${index + 1}`}
                      className="inline-flex w-fit items-center gap-1 text-[10px] font-semibold text-[var(--hg-dim)] transition-colors hover:text-red-400"
                    >
                      <Trash2 className="size-3" /> Remove
                    </button>
                  </div>
                </FormField>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={addTestCase}
            className="mt-3 h-9 w-full rounded-lg! border-dashed border-[var(--hg-border-strong)] bg-transparent text-[11px] font-semibold text-[var(--hg-muted)] hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)]"
          >
            <Plus className="size-3.5" /> Add test case
          </Button>
        </div>
      </div>

      {error ? <FormAlert className="mt-4">{error}</FormAlert> : null}
      {saved ? <FormAlert tone="success" className="mt-4">Problem saved.</FormAlert> : null}

      <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--hg-border)] pt-4">
        <Button
          type="submit"
          disabled={pending}
          className="hg-gradient-bg h-9 rounded-lg! px-4 text-[12px] font-bold text-[#101426] hover:brightness-105"
        >
          {pending ? "Saving…" : "Save problem"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={pending}
          className="h-9 rounded-lg! border-[var(--hg-border-strong)] bg-transparent px-4 text-[12px] font-semibold text-[var(--hg-muted)]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
