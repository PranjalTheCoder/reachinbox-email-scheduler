import { prisma } from "../config/prisma";

export const campaignRepository = {
  async create(data: { userId: string; name: string; description?: string; totalEmails?: number }) {
    return prisma.emailCampaign.create({ data });
  },

  async findById(id: string, userId: string) {
    return prisma.emailCampaign.findFirst({ where: { id, userId } });
  },

  async listByUser(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.emailCampaign.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take: limit }),
      prisma.emailCampaign.count({ where: { userId } }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateStats(id: string) {
    const [sent, failed] = await Promise.all([
      prisma.emailJob.count({ where: { campaignId: id, status: "sent" } }),
      prisma.emailJob.count({ where: { campaignId: id, status: "failed" } }),
    ]);
    return prisma.emailCampaign.update({
      where: { id },
      data: { sentEmails: sent, failedEmails: failed },
    });
  },

  async updateStatus(id: string, status: string) {
    return prisma.emailCampaign.update({ where: { id }, data: { status: status as never } });
  },
};
