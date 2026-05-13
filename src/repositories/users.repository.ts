import { prisma } from '../lib/prisma.js'
import type { User } from '../generated/prisma/client.js'

interface UsersRepository {
  findByEmail: (email: string) => Promise<User | null>
  create:      (email: string, passwordHash: string) => Promise<User>
}

export const usersRepository: UsersRepository = {
  findByEmail: (email) =>
    prisma.user.findUnique({ where: { email } }),

  create: (email, passwordHash) =>
    prisma.user.create({ data: { email, passwordHash } })
}
