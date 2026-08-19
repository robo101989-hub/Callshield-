import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCampaign(body: { name: string; description?: string; status?: string }) {
    return this.prisma.scamCampaign.create({
      data: {
        name: body.name,
        description: body.description,
        status: (body.status as any) || "EMERGING",
      },
    });
  }

  async listCampaigns() {
    const campaigns = await this.prisma.scamCampaign.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        numbers: {
          include: {
            phoneNumber: {
              select: {
                e164: true,
                status: true,
              },
            },
          },
          orderBy: { confidence: 'desc' },
        },
      },
    });

    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      numberCount: campaign.numbers.length,
      numbers: campaign.numbers.map((item) => ({
        number: item.phoneNumber.e164,
        status: item.phoneNumber.status,
        confidence: item.confidence,
      })),
    }));
  }
}
