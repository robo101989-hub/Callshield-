import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RiskService } from '../risk/risk.service';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskService,
  ) {}

  async createCampaign(body: { name: string; description?: string; status?: string }) {
    return this.prisma.scamCampaign.create({
      data: {
        name: body.name,
        description: body.description,
        status: (body.status as any) || "EMERGING",
      },
    });
  }

  async linkNumber(
    campaignId: string,
    body: { e164: string; confidence?: number },
  ) {
    const phoneNumber = await this.prisma.phoneNumber.upsert({
      where: { e164: body.e164 },
      update: {},
      create: { e164: body.e164 },
    });

    const confidence = Math.max(
      0,
      Math.min(100, body.confidence ?? 50),
    );

    const link = await this.prisma.campaignNumber.upsert({
      where: {
        campaignId_phoneNumberId: {
          campaignId,
          phoneNumberId: phoneNumber.id,
        },
      },
      update: {
        confidence,
      },
      create: {
        campaignId,
        phoneNumberId: phoneNumber.id,
        confidence,
      },
      include: {
        campaign: true,
        phoneNumber: true,
      },
    });

    return {
      campaignId: link.campaignId,
      campaignName: link.campaign.name,
      number: link.phoneNumber.e164,
      confidence: link.confidence,
      createdAt: link.createdAt,
    };
  }

  async listCampaigns() {
    const campaigns = await this.prisma.scamCampaign.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        numbers: {
          include: {
            phoneNumber: {
              include: {
                reports: {
                  select: {
                    severity: true,
                    category: true,
                    createdAt: true,
                    reporterId: true,
                  },
                },
                blocked: true,
                whitelisted: true,
                campaignLinks: {
                  select: {
                    campaignId: true,
                  },
                },
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
      numbers: campaign.numbers.map((item) => {
        const phone = item.phoneNumber;

        const risk = this.risk.calculate({
          reports: phone.reports,
          campaignLinks: phone.campaignLinks.length,
          verifiedSignals: phone.verifiedSignals,
          blocked: Boolean(phone.blocked),
          trusted: Boolean(phone.whitelisted),
          falsePositiveReports: phone.falsePositiveReports,
        });

        return {
          number: phone.e164,
          status: risk.classification,
          confidence: item.confidence,
          riskScore: risk.score,
          intelligenceConfidence: risk.confidence,
        };
      }),
    }));
  }
}
