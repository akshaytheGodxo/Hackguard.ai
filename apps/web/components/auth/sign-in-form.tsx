"use client"

import { ArrowRight, LockKeyhole, Mail } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { PasswordInput } from "@/components/auth/password-input"
import { RoleSelector } from "@/components/auth/role-selector"
import { SocialButtons } from "@/components/auth/social-buttons"
import { FormAlert, FormField } from "@/components/ui/app-ui"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "@/lib/actions"
import type { Role } from "@/lib/auth/roles"

const inputClass =
  "h-10 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[13px] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)] focus-visible:border-[var(--hg-cyan)]/60 focus-visible:ring-2 focus-visible:ring-[var(--hg-cyan)]/15"

export function SignInForm() {
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>("candidate")
  const [pending, startTransition] = useTransition()

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    data.set("role", role)
    setError(null)
    startTransition(async () => {
      const result = await signIn(data)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <span className="auth-form-eyebrow">Secure access</span>
      <h1>Welcome back</h1>
      <p className="auth-form-sub">
        Sign in to your HackGuard workspace to keep judging and monitoring your hackathon.
      </p>

      <RoleSelector value={role} onChange={setRole} />

      <div className="mt-7">
        <SocialButtons />
      </div>

      <div className="auth-divider">or continue with email</div>

      <div className="space-y-4">
        <FormField label="Email" htmlFor="sign-in-email" required>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <Input
              id="sign-in-email"
              type="email"
              name="email"
              placeholder="you@company.com"
              required
              autoComplete="email"
              className={`${inputClass} pl-9`}
            />
          </div>
        </FormField>

        <FormField label="Password" htmlFor="sign-in-password" required>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 z-10 size-3.5 -translate-y-1/2 text-[var(--hg-dim)]" />
            <PasswordInput
              id="sign-in-password"
              name="password"
              placeholder="••••••••••••"
              required
              className={`${inputClass} pl-9`}
            />
          </div>
        </FormField>
      </div>

      <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-[11px] text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]">
        <input
          type="checkbox"
          name="remember"
          className="size-3.5 cursor-pointer rounded border-[var(--hg-border-strong)] bg-transparent accent-[var(--hg-cyan)]"
        />
        Keep me signed in on this device
      </label>

      {error ? <FormAlert className="mt-4">{error}</FormAlert> : null}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="hg-gradient-bg mt-6 h-11 w-full rounded-lg! px-4 text-[13px] font-bold text-[#101426] shadow-[0_12px_30px_rgba(109,146,238,0.25)] transition-all hover:-translate-y-px hover:brightness-105"
      >
        {pending ? "Signing in…" : "Sign in"}
        <ArrowRight className="size-4" />
      </Button>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/sign-up">Create one</Link>
      </p>
    </form>
  )
}
