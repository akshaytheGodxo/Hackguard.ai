import { Button } from "@/components/ui/button"
import { GitHubIcon, GoogleIcon } from "@/components/auth/social-icons"

export function SocialButtons() {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-lg! gap-2 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-text)] hover:bg-[var(--hg-surface-soft)] dark:bg-[var(--hg-surface)] dark:hover:bg-[var(--hg-surface-soft)]"
      >
        <GoogleIcon className="size-4" />
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-lg! gap-2 border-[var(--hg-border-strong)] bg-[var(--hg-surface)] text-[var(--hg-text)] hover:bg-[var(--hg-surface-soft)] dark:bg-[var(--hg-surface)] dark:hover:bg-[var(--hg-surface-soft)]"
      >
        <GitHubIcon className="size-4" />
        GitHub
      </Button>
    </div>
  )
}