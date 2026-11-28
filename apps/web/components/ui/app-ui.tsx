import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageIntroProps = {
  eyebrow: string
  icon?: ReactNode
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

export function PageIntro({
  eyebrow,
  icon,
  title,
  description,
  actions,
  children,
  className,
}: PageIntroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[var(--hg-border)] bg-[linear-gradient(135deg,rgba(105,228,231,0.07),transparent_52%),var(--hg-surface)] px-5 py-6 sm:px-8 sm:py-8",
        className,
      )}
    >
      <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-[var(--hg-cyan)]/10 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--hg-cyan)]">
            {icon}
            {eyebrow}
          </span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--hg-text)] sm:text-4xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[var(--hg-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}

export type PillTone = "live" | "upcoming" | "completed" | "success" | "warning" | "neutral"

const pillStyles: Record<PillTone, string> = {
  live: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  upcoming: "border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]",
  completed: "border-white/10 bg-white/5 text-[var(--hg-dim)]",
  success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  neutral: "border-[var(--hg-border-strong)] bg-[var(--hg-bg)] text-[var(--hg-muted)]",
}

export function StatusPill({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode
  tone?: PillTone
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
        pillStyles[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

export function FormField({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid min-w-0 gap-2", className)}>
      <label
        htmlFor={htmlFor}
        className="text-[11px] font-semibold tracking-wide text-[var(--hg-text)]"
      >
        {label}
        {required ? <span className="ml-1 text-[var(--hg-cyan)]">*</span> : null}
      </label>
      {children}
      {error ? (
        <p className="text-[11px] font-medium text-red-400">{error}</p>
      ) : hint ? (
        <p className="text-[11px] leading-relaxed text-[var(--hg-dim)]">{hint}</p>
      ) : null}
    </div>
  )
}

export function FormAlert({
  children,
  tone = "error",
  className,
}: {
  children: ReactNode
  tone?: "error" | "success" | "info"
  className?: string
}) {
  const toneStyles = {
    error: "border-red-500/30 bg-red-500/10 text-red-300",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    info: "border-[var(--hg-cyan)]/30 bg-[var(--hg-cyan)]/10 text-[var(--hg-cyan)]",
  }

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-[12px] font-medium leading-relaxed",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </p>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-[var(--hg-border-strong)] bg-[var(--hg-surface)]/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? <div className="mx-auto text-[var(--hg-dim)]">{icon}</div> : null}
      <p className="mt-3 text-[14px] font-semibold text-[var(--hg-text)]">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-sm text-[12px] leading-relaxed text-[var(--hg-dim)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  )
}

export function Metric({
  label,
  value,
  icon,
  hint,
  className,
}: {
  label: string
  value: ReactNode
  icon?: ReactNode
  hint?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-xl border border-[var(--hg-border)] bg-[var(--hg-bg)]/60 px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-[var(--hg-dim)]">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums text-[var(--hg-text)]">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-[var(--hg-dim)]">{hint}</p> : null}
    </div>
  )
}
