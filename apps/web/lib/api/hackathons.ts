export type HackathonStatus = "Live" | "Upcoming" | "Completed"

export type TeamMember = {
  name: string
  email: string
}

export type RegistrationView = {
  hackathonId: string
  members: TeamMember[]
}

export const MAX_TEAM_SIZE = 3

export type Hackathon = {
  id: string
  name: string
  date: string
  status: HackathonStatus
  participants: number
  submissions: number
  description: string
  organizer: string
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