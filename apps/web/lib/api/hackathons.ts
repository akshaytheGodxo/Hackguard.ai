export type HackathonStatus = "Live" | "Upcoming" | "Completed"
export type HackathonType = "standard" | "live"

export type TeamMember = {
  name: string
  email: string
}

export type RegistrationView = {
  hackathonId: string
  teamName: string | null
  members: TeamMember[]
}

export const MAX_TEAM_SIZE = 3

export type Hackathon = {
  id: string
  name: string
  date: string
  startAt: string | null
  startTime: string | null
  endTime: string | null
  status: HackathonStatus
  participants: number
  submissions: number
  description: string
  organizer: string
  type: HackathonType
}

export function getHackathonStartAt(date: Date, time: string | null): string | null {
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null

  const [hours, minutes] = time.split(":").map(Number)
  const startAt = new Date(date)
  startAt.setHours(hours, minutes, 0, 0)
  return Number.isNaN(startAt.getTime()) ? null : startAt.toISOString()
}

export function formatHackathonDate(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(`${value}T09:00:00`)
  if (Number.isNaN(parsed.getTime())) return String(value)
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}