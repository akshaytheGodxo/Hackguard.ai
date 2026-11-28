import { Button } from "@/components/ui/button"
import { GitHubIcon, GoogleIcon } from "@/components/auth/social-icons"

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button
        type="button"
        variant="outline"
        disabled
        aria-label="Google sign-in coming soon"
        className="h-10 rounded-lg! gap-2 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-muted)] opacity-70 dark:bg-[var(--hg-surface)]"
      >
        <GoogleIcon className="size-4" />
        Google
        <span className="ml-auto rounded border border-[var(--hg-border)] px-1 py-0.5 font-mono text-[8px] uppercase tracking-wide text-[var(--hg-dim)]">
          Soon
        </span>
      </Button>
      <Button
        type="button"
        variant="outline"
        disabled
        aria-label="GitHub sign-in coming soon"
        className="h-10 rounded-lg! gap-2 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-muted)] opacity-70 dark:bg-[var(--hg-surface)]"
      >
        <GitHubIcon className="size-4" />
        GitHub
        <span className="ml-auto rounded border border-[var(--hg-border)] px-1 py-0.5 font-mono text-[8px] uppercase tracking-wide text-[var(--hg-dim)]">
          Soon
        </span>
      </Button>
    </div>
  )
}
