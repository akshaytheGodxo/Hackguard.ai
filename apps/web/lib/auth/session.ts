import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { isRole, type Role } from "@/lib/auth/roles"

const SESSION_COOKIE = "hg-session"
const MAX_AGE = 60 * 60 * 24 * 7

export type Session = {
  userId: string
  name: string
  email: string
  role: Role
}

export type SessionView = Pick<Session, "name" | "email" | "role">

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error("SESSION_SECRET is not set.")
  return new TextEncoder().encode(secret)
}

function cookieOptions() {
  const base = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE,
  }
  return process.env.NODE_ENV === "production" ? { ...base, secure: true } : base
}

export async function createSession(session: Session) {
  const token = await new SignJWT({
    name: session.name,
    email: session.email,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret())

  const store = await cookies()
  store.set(SESSION_COOKIE, token, cookieOptions())
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (
      typeof payload.sub !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.email !== "string" ||
      !isRole(payload.role)
    ) {
      return null
    }
    return { userId: payload.sub, name: payload.name, email: payload.email, role: payload.role }
  } catch {
    return null
  }
}

export async function updateSessionRole(role: Role) {
  const session = await getSession()
  if (!session) return
  await createSession({ ...session, role })
}

export async function clearSession() {
  const store = await cookies()
  store.delete(SESSION_COOKIE)
}