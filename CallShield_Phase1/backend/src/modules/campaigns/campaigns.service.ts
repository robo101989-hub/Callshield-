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

  async getCampaign(campaignId: string) {
    const campaigns = await this.prisma.scamCampaign.findUnique({
      where: { id: campaignId },
      include: {
        numbers: {
          include: {
            phoneNumber: {
              include: {
                reports: {
                  select: {
                    id: true,
                    severity: true,
                    category: true,
                    description: true,
                    createdAt: true,
                    reporterId: true,
                  },
                  orderBy: { createdAt: 'desc' },
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

    if (!campaigns) {
      return null;
    }

    const numberIntelligence = campaigns.numbers.map((item) => {
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
        reports: phone.reports.length,
        reportsData: phone.reports,
      };
    });

    const allReports = numberIntelligence.flatMap(
      (item) => item.reportsData,
    );

    const categoryCounts = allReports.reduce<Record<string, number>>(
      (counts, report) => {
        counts[report.category] =
          (counts[report.category] ?? 0) + 1;
        return counts;
      },
      {},
    );

    const severityCounts = allReports.reduce<Record<string, number>>(
      (counts, report) => {
        counts[report.severity] =
          (counts[report.severity] ?? 0) + 1;
        return counts;
      },
      {},
    );

    const riskScores = numberIntelligence.map(
      (item) => item.riskScore,
    );

    const campaignRiskScore =
      riskScores.length > 0
        ? Math.round(
            riskScores.reduce((sum, score) => sum + score, 0) /
              riskScores.length,
          )
        : 0;

    const highRiskNumbers = numberIntelligence.filter(
      (item) =>
        item.status === 'HIGH_RISK' ||
        item.status === 'DANGEROUS',
    ).length;

    const highConfidenceNumbers = numberIntelligence.filter(
      (item) => item.intelligenceConfidence === 'HIGH',
    ).length;

    const recentReports = allReports.filter(
      (report) =>
        report.createdAt.getTime() >
        Date.now() - 30 * 24 * 60 * 60 * 1000,
    );

    const sortedReports = [...allReports].sort(
      (a, b) =>
        b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const calculatedStatus =
      campaigns.numbers.length === 0
        ? 'EMERGING'
        : recentReports.length === 0
          ? 'DECLINING'
          : highRiskNumbers >= 2 ||
              campaignRiskScore >= 60 ||
              recentReports.length >= 3
            ? 'ACTIVE'
            : 'EMERGING';

    const numbers = numberIntelligence.map(
      ({ reportsData, ...item }) => item,
    );

    return {
      id: campaigns.id,
      name: campaigns.name,
      description: campaigns.description,
      status: calculatedStatus,
      storedStatus: campaigns.status,
      createdAt: campaigns.createdAt,
      updatedAt: campaigns.updatedAt,

      numberCount: campaigns.numbers.length,
      reportCount: allReports.length,
      recentReportCount: recentReports.length,

      campaignRiskScore,
      highRiskNumbers,
      highConfidenceNumbers,

      categoryCounts,
      severityCounts,

      firstSeen:
        sortedReports.length > 0
          ? sortedReports[sortedReports.length - 1].createdAt
          : null,

      lastSeen:
        sortedReports.length > 0
          ? sortedReports[0].createdAt
          : null,

      intelligenceConfidence:
        highConfidenceNumbers >= 2 ||
        recentReports.length >= 3
          ? 'HIGH'
          : allReports.length >= 1
            ? 'MEDIUM'
            : 'LOW',

      numbers,

      recentReports: sortedReports.slice(0, 20).map((report) => ({
        id: report.id,
        category: report.category,
        severity: report.severity,
        description: report.description,
        createdAt: report.createdAt,
        reporterId: report.reporterId,
      })),
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

    return campaigns.map((campaign) => {
      const numberIntelligence = campaign.numbers.map((item) => {
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
          reports: phone.reports.length,
          reportsData: phone.reports,
        };
      });

      const allReports = numberIntelligence.flatMap(
        (item) => item.reportsData,
      );

      const now = Date.now();
      const recentReports = allReports.filter(
        (report) =>
          report.createdAt.getTime() >
          now - 30 * 24 * 60 * 60 * 1000,
      );

      const categoryCounts = allReports.reduce<Record<string, number>>(
        (counts, report) => {
          counts[report.category] =
            (counts[report.category] ?? 0) + 1;
          return counts;
        },
        {},
      );

      const severityCounts = allReports.reduce<Record<string, number>>(
        (counts, report) => {
          counts[report.severity] =
            (counts[report.severity] ?? 0) + 1;
          return counts;
        },
        {},
      );

      const riskScores = numberIntelligence.map(
        (item) => item.riskScore,
      );

      const campaignRiskScore =
        riskScores.length > 0
          ? Math.round(
              riskScores.reduce((sum, score) => sum + score, 0) /
                riskScores.length,
            )
          : 0;

      const highRiskNumbers = numberIntelligence.filter(
        (item) =>
          item.status === 'HIGH_RISK' ||
          item.status === 'DANGEROUS',
      ).length;

      const highConfidenceNumbers = numberIntelligence.filter(
        (item) => item.intelligenceConfidence === 'HIGH',
      ).length;

      const calculatedStatus =
        campaign.numbers.length === 0
          ? 'EMERGING'
          : recentReports.length === 0
            ? 'DECLINING'
            : highRiskNumbers >= 2 ||
                campaignRiskScore >= 60 ||
                recentReports.length >= 3
              ? 'ACTIVE'
              : 'EMERGING';

      const sortedReports = [...allReports].sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      );

      const firstSeen =
        sortedReports.length > 0
          ? sortedReports[sortedReports.length - 1].createdAt
          : null;

      const lastSeen =
        sortedReports.length > 0
          ? sortedReports[0].createdAt
          : null;

      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({
          category,
          count,
        }));

      const numbers = numberIntelligence.map(
        ({ reportsData, ...item }) => item,
      );

      return {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: calculatedStatus,
        storedStatus: campaign.status,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,

        numberCount: campaign.numbers.length,
        reportCount: allReports.length,
        recentReportCount: recentReports.length,

        campaignRiskScore,
        highRiskNumbers,
        highConfidenceNumbers,

        categoryCounts,
        topCategories,
        severityCounts,

        firstSeen,
        lastSeen,

        intelligenceConfidence:
          highConfidenceNumbers >= 2 ||
          recentReports.length >= 3
            ? 'HIGH'
            : allReports.length >= 1
              ? 'MEDIUM'
              : 'LOW',

        numbers,
      };
    });
  }
}
