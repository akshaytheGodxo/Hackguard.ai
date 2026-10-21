"use client"

import { Plus, X } from "lucide-react"
import { useState, useTransition } from "react"
import { Field } from "@base-ui/react/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { addProblem, type TestCaseDraft } from "@/lib/actions"

const EMPTY_TEST_CASE: TestCaseDraft = { input: "", output: "" }

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
  const [pending, startTransition] = useTransition()

  function updateTestCase(index: number, patch: Partial<TestCaseDraft>) {
    setTestCases((current) =>
      current.map((testCase, i) => (i === index ? { ...testCase, ...patch } : testCase)),
    )
  }

  function addTestCase() {
    setTestCases((current) => [...current, { ...EMPTY_TEST_CASE }])
  }

  function removeTestCase(index: number) {
    setTestCases((current) =>
      current.length === 1 ? [{ ...EMPTY_TEST_CASE }] : current.filter((_, i) => i !== index),
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await addProblem(hackathonId, { name, description, testCases })
      if (result?.error) {
        setError(result.error)
        return
      }
      onSaved()
    })
  }

  return (
    <form
      className="rounded-xl border border-[var(--hg-border)] bg-[var(--hg-surface)] p-5"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[var(--hg-text)]">Add a problem</h3>
          <p className="mt-0.5 text-[12px] text-[var(--hg-dim)]">
            Candidates solve this during the live event.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-[var(--hg-dim)] transition-colors hover:bg-white/5 hover:text-[var(--hg-text)]"
        >
          <X className="size-4" />
        </button>
      </div>

      <Field.Root className="mt-4 flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Problem name</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Two Sum"
          required
          className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
      </Field.Root>

      <Field.Root className="mt-4 flex flex-col gap-1.5">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Description</Label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder="Describe the problem statement."
          className="w-full resize-none rounded-lg border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-3 py-2.5 text-[13px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
        />
      </Field.Root>

      <div className="mt-5 border-t border-[var(--hg-border)] pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--hg-dim)]">
            Test cases
          </span>
          <span className="text-[11px] text-[var(--hg-dim)]">{testCases.length} added</span>
        </div>

        <div className="mt-3 space-y-3">
          {testCases.map((testCase, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-lg border border-[var(--hg-border)] bg-[var(--hg-bg)]/60 p-3 sm:grid-cols-2"
            >
              <Field.Root className="flex flex-col gap-1.5">
                <Label className="text-[11px] font-semibold text-[var(--hg-muted)]">
                  Input {index + 1}
                </Label>
                <textarea
                  value={testCase.input}
                  onChange={(e) => updateTestCase(index, { input: e.target.value })}
                  rows={2}
                  placeholder="stdin fed to the solution"
                  className="w-full resize-none rounded-md border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-2.5 py-2 font-mono text-[12px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
                />
              </Field.Root>
              <Field.Root className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-semibold text-[var(--hg-muted)]">
                    Expected output {index + 1}
                  </Label>
                  <button
                    type="button"
                    onClick={() => removeTestCase(index)}
                    aria-label={`Remove test case ${index + 1}`}
                    className="rounded p-0.5 text-[var(--hg-dim)] transition-colors hover:text-red-400"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <textarea
                  value={testCase.output}
                  onChange={(e) => updateTestCase(index, { output: e.target.value })}
                  rows={2}
                  placeholder="expected stdout"
                  className="w-full resize-none rounded-md border border-[var(--hg-border-strong)] bg-[var(--hg-bg)] px-2.5 py-2 font-mono text-[12px] text-[var(--hg-text)] outline-none transition-colors placeholder:text-[var(--hg-dim)] focus:border-[var(--hg-cyan)]/50"
                />
              </Field.Root>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addTestCase}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-dashed border-[var(--hg-border-strong)] px-3 py-1.5 text-[12px] font-semibold text-[var(--hg-muted)] transition-colors hover:border-[var(--hg-cyan)]/40 hover:text-[var(--hg-cyan)]"
        >
          <Plus className="size-3.5" /> Add test case
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-400"
        >
          {error}
        </p>
      )}

      <div className="mt-5 flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="hg-gradient-bg h-9 rounded-lg! px-4 text-[12px] font-bold text-[#101426] transition-all hover:-translate-y-px hover:brightness-105"
        >
          {pending ? "Saving…" : "Save problem"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onClose}
          disabled={pending}
          className="h-9 rounded-lg! border-[var(--hg-border-strong)] px-4 text-[12px] font-semibold text-[var(--hg-muted)]"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}