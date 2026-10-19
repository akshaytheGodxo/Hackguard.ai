import { ArrowLeft, Check, ShieldCheck } from "lucide-react"
import Link from "next/link"

const features = [
  "Sandboxed, isolated code execution",
  "AI evaluation with transparent rubrics",
  "Human judges keep the final call",
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-grid">
        <aside className="auth-aside">
          <Link className="brand" href="/" aria-label="HackGuard AI home">
            <span className="brand-mark">
              <ShieldCheck size={18} />
            </span>
            <span>
              hackguard<span>.ai</span>
            </span>
          </Link>

          <div>
            <span className="auth-hero-eyebrow">
              <i className="auth-eyebrow-dot" />
              Trusted by 400+ hackathons
            </span>
            <h2>
              Hackathons, evaluated with <span>confidence.</span>
            </h2>
            <p className="auth-aside-lead">
              Run secure, fair hackathons at scale — sandboxed code execution, AI-powered
              evaluation, and human-led decisions in one platform.
            </p>
            <ul className="auth-list">
              {features.map((feature) => (
                <li key={feature}>
                  <span className="auth-list-icon">
                    <Check size={13} strokeWidth={2.5} />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div className="auth-quote">
            <span className="auth-quote-avatar">AK</span>
            <p>
              <strong>&ldquo;The first platform we trust with our flagship hackathon.&rdquo;</strong>
              <br />
              Arijit Krishnan, Organizer — DevComm India
            </p>
          </div>
        </aside>

        <main className="auth-main">
          <div className="auth-mainbar">
            <Link className="brand auth-mobile-brand" href="/" aria-label="HackGuard AI home">
              <span className="brand-mark">
                <ShieldCheck size={16} />
              </span>
              <span>
                hackguard<span>.ai</span>
              </span>
            </Link>
            <Link className="auth-back" href="/">
              <ArrowLeft className="size-3.5" />
              Back to home
            </Link>
          </div>
          <div className="auth-form">{children}</div>
        </main>
      </div>
    </div>
  )
}