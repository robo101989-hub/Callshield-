import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { RiskService } from '../risk/risk.service';

@Injectable()
export class NumbersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly risk: RiskService,
  ) {}

  async getIntelligence(e164: string) {
    const number = await this.prisma.phoneNumber.findUnique({
      where: { e164 },
      include: {
        reports: true,
        blocked: true,
        whitelisted: true,
        campaignLinks: {
          include: {
            campaign: true,
          },
        },
      },
    });

    if (!number) {
      const risk = this.risk.calculate({
        reports: [],
        campaignLinks: 0,
        verifiedSignals: 0,
        falsePositiveReports: 0,
        blocked: false,
        trusted: false,
      });

      return {
        number: e164,
        status: 'UNKNOWN',
        blocked: false,
        blockReason: null,
        trusted: false,
        trustNote: null,
        risk,
        reports: 0,
        uniqueReporters: 0,
        recentReports: [],
        categoryCounts: {},
        campaigns: [],
        carrier: null,
        telecomRegion: null,
        location: {
          value: null,
          confidence: 'UNKNOWN',
          source: null,
        },
        intelligenceConfidence: 'LOW',
        signals: risk.signals,
      };
    }

    const risk = this.risk.calculate({
      reports: number.reports.map((report) => ({
        severity: report.severity,
        category: report.category,
        createdAt: report.createdAt,
        reporterId: report.reporterId,
      })),
      campaignLinks: number.campaignLinks.length,
      verifiedSignals: number.verifiedSignals,
      falsePositiveReports: number.falsePositiveReports,
      blocked: Boolean(number.blocked),
      trusted: Boolean(number.whitelisted),
    });

    const recentReportItems = [...number.reports]
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime(),
      )
      .slice(0, 10);

    const categoryCounts = number.reports.reduce<Record<string, number>>(
      (counts, report) => {
        counts[report.category] =
          (counts[report.category] ?? 0) + 1;

        return counts;
      },
      {},
    );

    return {
      number: number.e164,

      status: number.status,

      blocked: Boolean(number.blocked),
      blockReason: number.blocked?.reason ?? null,

      trusted: Boolean(number.whitelisted),
      trustNote: number.whitelisted?.note ?? null,

      risk,

      reports: number.reports.length,

      uniqueReporters: risk.signals.uniqueReporters,

      recentReports: recentReportItems.map((report) => ({
        category: report.category,
        severity: report.severity,
        description: report.description,
        createdAt: report.createdAt,
      })),

      categoryCounts,

      campaigns: number.campaignLinks.map((link) => ({
        id: link.campaign.id,
        name: link.campaign.name,
        status: link.campaign.status,
        confidence: link.confidence,
      })),

      carrier: number.carrier,

      telecomRegion: number.telecomRegion,

      location: {
        value: number.locationValue,
        confidence: number.locationConfidence,
        source: number.locationSource,
      },

      intelligenceConfidence: risk.confidence,

      signals: risk.signals,
    };
  }

  async getRisk(e164: string) {
    const result = await this.getIntelligence(e164);

    return result.risk;
  }
}
