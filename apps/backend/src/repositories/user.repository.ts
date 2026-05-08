import { prisma } from "../config/prisma";

export const userRepository = {
  async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: { googleId: string; email: string; name: string; avatar: string }) {
    return prisma.user.create({ data });
  },

  async updateProfile(googleId: string, data: { name: string; avatar: string }) {
    return prisma.user.update({ where: { googleId }, data });
  },

  async upsertFromGoogle(data: { googleId: string; email: string; name: string; avatar: string }) {
    const existing = await prisma.user.findUnique({ where: { googleId: data.googleId } });
    if (!existing) {
      return prisma.user.create({ data });
    }
    return prisma.user.update({
      where: { googleId: data.googleId },
      data: { name: data.name, avatar: data.avatar },
    });
  },
};
