import type { Metadata } from "next"
import { SignUpForm } from "@/components/auth/sign-up-form"

export const metadata: Metadata = {
  title: "Create account | HackGuard AI",
  description:
    "Create your HackGuard AI workspace and start running secure, fair hackathons at scale.",
}

export default function SignUpPage() {
  return <SignUpForm />
}