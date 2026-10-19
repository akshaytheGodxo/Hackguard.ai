import "dotenv/config"
import bcrypt from "bcryptjs"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash("akshay123", 12)

  const candidate = await prisma.user.upsert({
    where: { email: "akshaysinghc230@gmail.com" },
    update: {},
    create: {
      name: "Akshay Singh",
      email: "akshaysinghc230@gmail.com",
      password,
      role: "candidate",
    },
  })

  const team = await prisma.user.upsert({
    where: { email: "team@hackguard.ai" },
    update: {},
    create: {
      name: "HackGuard Team",
      email: "team@hackguard.ai",
      password,
      role: "organizer",
    },
  })

  async function upsertHackathon(input: {
    name: string
    date: Date
    description: string
    status: "Live" | "Upcoming" | "Completed"
    participants: number
    submissions: number
    organizerId: string
    type?: "standard" | "live"
  }) {
    const existing = await prisma.hackathon.findFirst({ where: { name: input.name } })
    if (existing) return existing
    return prisma.hackathon.create({ data: input })
  }

  const hackSphere = await upsertHackathon({
    name: "HackSphere 2026",
    date: new Date("2026-10-18T09:00:00"),
    description: "A 36-hour global hackathon focused on AI safety and infrastructure.",
    status: "Live",
    participants: 342,
    submissions: 118,
    organizerId: team.id,
  })

  await upsertHackathon({
    name: "NeuralHack Summer",
    date: new Date("2026-11-02T09:00:00"),
    description: "Machine-learning build sprint for students and first-time hackers.",
    status: "Upcoming",
    participants: 128,
    submissions: 0,
    organizerId: team.id,
  })

  await upsertHackathon({
    name: "Campus CodeStorm",
    date: new Date("2026-09-21T09:00:00"),
    description: "On-campus competitive hackathon with sandboxed judging.",
    status: "Completed",
    participants: 96,
    submissions: 87,
    organizerId: team.id,
  })

  await upsertHackathon({
    name: "Arena Clash 1v1",
    date: new Date("2026-10-19T18:00:00"),
    description: "Head-to-head live coding battles — one round, one winner.",
    status: "Live",
    participants: 42,
    submissions: 12,
    organizerId: team.id,
    type: "live",
  })

  const existingRegistration = await prisma.registration.findFirst({
    where: { hackathonId: hackSphere.id, userId: candidate.id },
  })
  if (!existingRegistration) {
    await prisma.registration.create({
      data: {
        hackathonId: hackSphere.id,
        userId: candidate.id,
        members: {
          create: [
            {
              name: "Akshay Singh",
              email: "akshaysinghc230@gmail.com",
              isLeader: true,
              position: 0,
            },
            {
              name: "Arjun Mehta",
              email: "arjun.mehta@example.com",
              isLeader: false,
              position: 1,
            },
          ],
        },
      },
    })
  }

  console.log("Seeded HackGuard AI database.")
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())