import type { Prisma } from "@prisma/client"

export type RepositoryRiskLevel = "high" | "medium" | "low" | "unknown"

export type MatchedRepositoryFile = {
  fileA: string
  fileB: string
  language: string
  similarity: number
}

export function getRepositoryRiskLevel(value: string): RepositoryRiskLevel {
  switch (value.toLowerCase()) {
    case "high":
      return "high"
    case "medium":
      return "medium"
    case "low":
      return "low"
    default:
      return "unknown"
  }
}

export function parseMatchedRepositoryFiles(
  value: Prisma.JsonValue,
): MatchedRepositoryFile[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((entry) => {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return []
    }

    const fileA = entry.file_a
    const fileB = entry.file_b
    const language = entry.language
    const similarity = entry.similarity

    if (
      typeof fileA !== "string" ||
      typeof fileB !== "string" ||
      typeof language !== "string" ||
      typeof similarity !== "number"
    ) {
      return []
    }

    return [{ fileA, fileB, language, similarity }]
  })
}
