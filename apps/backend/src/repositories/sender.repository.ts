import { prisma } from "../config/prisma";

export const senderRepository = {
  async create(data: {
    userId: string;
    senderName: string;
    senderEmail: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPasswordEncrypted?: string;
    dailyLimit?: number;
    hourlyLimit?: number;
  }) {
    return prisma.emailSender.create({ data });
  },

  async findById(id: string, userId: string) {
    return prisma.emailSender.findFirst({ where: { id, userId } });
  },

  async findActiveByUser(userId: string) {
    return prisma.emailSender.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    });
  },

  async listByUser(userId: string) {
    return prisma.emailSender.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  },

  async update(id: string, userId: string, data: Record<string, unknown>) {
    return prisma.emailSender.update({
      where: { id, userId },
      data,
    });
  },

  async deactivate(id: string, userId: string) {
    return prisma.emailSender.update({
      where: { id, userId },
      data: { isActive: false },
    });
  },
};
