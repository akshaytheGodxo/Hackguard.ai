"use client"

import { Field } from "@base-ui/react/field"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/auth/password-input"
import { SocialButtons } from "@/components/auth/social-buttons"
import { RoleSelector } from "@/components/auth/role-selector"
import { signIn } from "@/lib/actions"
import type { Role } from "@/lib/auth/roles"

export function SignInForm() {
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<Role>("candidate")
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
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

      <Field.Root className="auth-field">
        <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Email</Label>
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
        <div className="flex items-center justify-between">
          <Label className="text-[11px] font-semibold text-[var(--hg-text)]">Password</Label>
          <a href="#" className="text-[10px] font-medium text-[var(--hg-dim)] transition-colors hover:text-[var(--hg-cyan)]">
            Forgot password?
          </a>
        </div>
        <PasswordInput
          name="password"
          placeholder="••••••••••••"
          required
          className="border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-text)] placeholder:text-[var(--hg-dim)]"
        />
      </Field.Root>

      <div className="mt-4 flex items-center justify-between">
        <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] text-[var(--hg-muted)] transition-colors hover:text-[var(--hg-text)]">
          <input
            type="checkbox"
            name="remember"
            className="size-3.5 cursor-pointer rounded border-[var(--hg-border-strong)] bg-transparent accent-[var(--hg-cyan)]"
          />
          Remember me
        </label>
      </div>

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
        {pending ? "Signing in…" : "Sign in"}
        <ArrowRight className="size-4" />
      </Button>

      <p className="auth-switch">
        Don&apos;t have an account? <Link href="/sign-up">Create one</Link>
      </p>
    </form>
  )
}