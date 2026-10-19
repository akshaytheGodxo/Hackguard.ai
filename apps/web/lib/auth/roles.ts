export type Role = "candidate" | "organizer"

export const ROLES: Role[] = ["candidate", "organizer"]

export const ROLE_LABEL: Record<Role, string> = {
  candidate: "Candidate",
  organizer: "Organizer",
}

export const ROLE_BLURB: Record<Role, string> = {
  candidate: "Browse & join hackathons",
  organizer: "Host & manage hackathons",
}

export const ROLE_HOME: Record<Role, string> = {
  candidate: "/events",
  organizer: "/organizer",
}

export function isRole(value: unknown): value is Role {
  return value === "candidate" || value === "organizer"
}
