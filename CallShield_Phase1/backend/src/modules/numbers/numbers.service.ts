import { Injectable, NotFoundException } from '@nestjs/common';
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
        campaignLinks: { include: { campaign: true } },
      },
    });

    if (!number) {
      throw new NotFoundException('Number not found in CallShield intelligence');
    }

    const uniqueReporters = new Set(number.reports.map((r) => r.reporterId).filter(Boolean)).size;
    const categoryCounts = number.reports.reduce<Record<string, number>>((counts, report) => { counts[report.category] = (counts[report.category] ?? 0) + 1; return counts; }, {});
    const highSeverityReports = number.reports.filter(
      (r) => r.severity === 'HIGH' || r.severity === 'CRITICAL',
    ).length;
    const recentReports = number.reports.filter(
      (r) => r.createdAt.getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).length;

    const risk = this.risk.calculate({
      reports: number.reports.length,
      uniqueReporters,
      highSeverityReports,
      recentReports,
      campaignLinks: number.campaignLinks.length,
      verifiedSignals: number.verifiedSignals,
      falsePositiveReports: number.falsePositiveReports,
    });

    return {
      number: number.e164,
      status: number.status,
      risk,
      reports: number.reports.length,
      uniqueReporters,
      categoryCounts,
      campaigns: number.campaignLinks.map((x) => ({
        id: x.campaign.id,
        name: x.campaign.name,
        status: x.campaign.status,
      })),
      carrier: number.carrier,
      telecomRegion: number.telecomRegion,
      location: {
        value: number.locationValue,
        confidence: number.locationConfidence,
        source: number.locationSource,
      },
      intelligenceConfidence: number.intelligenceConfidence,
    };
  }

  async getRisk(e164: string) {
    const result = await this.getIntelligence(e164);
    return result.risk;
  }
}
