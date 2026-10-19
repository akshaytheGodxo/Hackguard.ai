import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/sign-in-form"

export const metadata: Metadata = {
  title: "Sign in | HackGuard AI",
  description:
    "Sign in to your HackGuard AI workspace to host secure, fair hackathons and keep monitoring submissions.",
}

export default function SignInPage() {
  return <SignInForm />
}