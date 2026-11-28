"use client"

import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialButtons } from "@/components/auth/social-buttons"
import { FormAlert, FormField } from "@/components/ui/app-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signUp } from "@/lib/actions"

const STRENGTH_LABELS = ["Too weak", "Weak", "Weak", "Fair", "Strong", "Very strong"]
const STRENGTH_COLORS = ["#ee847a", "#ee847a", "#e9c975", "#e9c975", "#83d5b1", "#83d5b1"]

const inputClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

function scorePassword(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

function PasswordStrengthMeter({ password }: { password: string }) {
  if (password.length === 0) {
    return (
      <p className="mt-2 text-[10px] text-[var(--hg-dim)]">
        Use 8+ characters with a mix of letters, numbers and symbols.
      </p>
    )
  }
  const score = scorePassword(password)
  return (
    <div className="mt-2.5">
      <div className="grid grid-cols-5 gap-1.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            className="h-1 rounded-full transition-colors duration-200"
            style={{ background: index < score ? STRENGTH_COLORS[score] : "var(--hg-border-strong)" }}
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

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

      <div className="space-y-4">
        <FormField label="Full name" htmlFor="sign-up-name" required>
          <div className="relative">
            <UserRound className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <Input
              id="sign-up-name"
              type="text"
              name="name"
              placeholder="Ada Lovelace"
              required
              autoComplete="name"
              className={`${inputClass} pl-9`}
            />
          </div>
        </FormField>

        <FormField label="Work email" htmlFor="sign-up-email" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <Input
              id="sign-up-email"
              type="email"
              name="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
              className={`${inputClass} pl-9`}
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="sign-up-password" required>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <PasswordInput
              id="sign-up-password"
              name="password"
              placeholder="Create a strong password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pl-9`}
            />
            <PasswordStrengthMeter password={password} />
          </div>
        </FormField>
      </div>

      <label className="mt-4 inline-flex cursor-pointer items-start gap-2.5 text-[11px] leading-relaxed text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-0.5 size-3.5 shrink-0 cursor-pointer rounded border-[var(--hg-border-strong)] bg-transparent accent-[var(--hg-cyan)]"
        />
        <span>I agree to the HackGuard AI Terms of Service and Privacy Policy.</span>
      </label>

      {error ? <FormAlert className="mt-4">{error}</FormAlert> : null}

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
