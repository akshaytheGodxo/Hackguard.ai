"use client"

import { useState, useTransition } from "react"
import { Field } from "@base-ui/react/field"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { signUp } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialButtons } from "@/components/auth/social-buttons"

const STRENGTH_LABELS = ["Too weak", "Weak", "Weak", "Fair", "Strong", "Very strong"]
const STRENGTH_COLORS = ["#ee847a", "#ee847a", "#e9c975", "#e9c975", "#83d5b1", "#83d5b1"]

function scorePassword(pw: string): number {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (password.length === 0) {
    return <p className="mt-2 text-[10px] text-[var(--hg-dim)]">Use 8+ characters with a mix of letters, numbers and symbols.</p>
  }
  const score = scorePassword(password)
  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-5 gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <span
            key={i}
            className="h-1 rounded-full transition-colors duration-200"
            style={{ background: i < score ? STRENGTH_COLORS[score] : "var(--hg-border-strong)" }}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[10px]" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </p>
    </div>
  )
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function SignUpForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)

    if (!EMAIL_PATTERN.test(String(data.get("email") ?? "").trim())) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }

    setError(null)
    startTransition(async () => {
      const result = await signUp(data)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <span className="auth-form-eyebrow">Get started</span>
      <h1>Create your workspace</h1>
      <p className="auth-form-sub">
        Set up your HackGuard account and start running fair, secure hackathons in minutes.
      </p>

      <div className="mt-7">
        <SocialButtons />
      </div>

      <div className="auth-divider">or sign up with email</div>

      <Field.Root className="auth-field">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Full name</Label>
        <Input
          type="text"
          name="name"
          placeholder="Ada Lovelace"
          required
          autoComplete="name"
          className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
      </Field.Root>

      <Field.Root className="auth-field">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Work email</Label>
        <Input
          type="email"
          name="email"
          placeholder="you@company.com"
          required
          autoComplete="email"
          className="h-10 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
      </Field.Root>

      <Field.Root className="auth-field">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Password</Label>
        <PasswordInput
          name="password"
          placeholder="Create a strong password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
        <PasswordStrengthMeter password={password} />
      </Field.Root>

      <label className="mt-4 inline-flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 size-3.5 shrink-0 cursor-pointer rounded border-[var(--hg-border-strong)] bg-transparent accent-[var(--hg-cyan)]"
        />
        <span>
          I agree to the{" "}
          <a href="#" className="font-medium text-[var(--hg-cyan)] hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="font-medium text-[var(--hg-cyan)] hover:underline">
            Privacy Policy
          </a>
          .
        </span>
      </label>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-400">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="hg-gradient-bg mt-6 h-11 w-full rounded-lg! px-4 text-[13px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105"
      >
        {pending ? "Creating account…" : "Create account"}
        <ArrowRight className="size-4" />
      </Button>

      <p className="auth-switch">
        Already have an account? <Link href="/sign-in">Sign in</Link>
      </p>
    </form>
  )
}