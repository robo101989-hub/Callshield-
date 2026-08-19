import { Injectable } from '@nestjs/common';

export type RiskReportInput = {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  createdAt: Date;
  reporterId: string | null;
};

export type RiskInput = {
  reports: RiskReportInput[];
  campaignLinks: number;
  verifiedSignals: number;
  falsePositiveReports: number;
};

@Injectable()
export class RiskService {
  calculate(input: RiskInput) {
    const now = Date.now();

    const uniqueReporterIds = new Set(
      input.reports
        .map((report) => report.reporterId)
        .filter((id): id is string => Boolean(id)),
    );

    const uniqueReporters = uniqueReporterIds.size;

    const recentReports = input.reports.filter(
      (report) =>
        report.createdAt.getTime() >
        now - 30 * 24 * 60 * 60 * 1000,
    );

    const highSeverityReports = input.reports.filter(
      (report) =>
        report.severity === 'HIGH' ||
        report.severity === 'CRITICAL',
    );

    const criticalReports = input.reports.filter(
      (report) => report.severity === 'CRITICAL',
    );

    const categories = new Set(
      input.reports.map((report) => report.category),
    );

    let score = 0;

    // Community evidence.
    score += Math.min(input.reports.length * 2, 20);

    // Independent reporters are stronger evidence than repeated reports.
    score += Math.min(uniqueReporters * 6, 25);

    // Recent reports have stronger influence.
    score += Math.min(recentReports.length * 2, 15);

    // Severity.
    score += Math.min(highSeverityReports.length * 4, 20);

    // Critical reports provide an additional escalation signal.
    score += Math.min(criticalReports.length * 3, 10);

    // Multiple scam categories indicate broader threat behavior.
    score += Math.min(Math.max(categories.size - 1, 0) * 3, 9);

    // Campaign association.
    score += Math.min(input.campaignLinks * 5, 10);

    // Verified signals.
    score += Math.min(input.verifiedSignals * 5, 15);

    // False-positive history reduces the score.
    score -= Math.min(input.falsePositiveReports * 3, 15);

    /*
     * If there are many reports but no independent reporters,
     * prevent repeated anonymous/test submissions from creating
     * an artificially extreme reputation.
     */
    if (input.reports.length >= 3 && uniqueReporters === 0) {
      score = Math.min(score, 65);
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    const classification =
      score <= 20
        ? 'SAFE'
        : score <= 40
          ? 'LOW_RISK'
          : score <= 60
            ? 'SUSPICIOUS'
            : score <= 80
              ? 'HIGH_RISK'
              : 'DANGEROUS';

    let confidence: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    if (uniqueReporters >= 3 || input.verifiedSignals >= 2) {
      confidence = 'HIGH';
    } else if (
      uniqueReporters >= 1 ||
      input.reports.length >= 3 ||
      input.campaignLinks >= 1
    ) {
      confidence = 'MEDIUM';
    }

    return {
      score,
      classification,
      confidence,
      signals: {
        reports: input.reports.length,
        uniqueReporters,
        recentReports: recentReports.length,
        highSeverityReports: highSeverityReports.length,
        criticalReports: criticalReports.length,
        categoryCount: categories.size,
        campaignLinks: input.campaignLinks,
        verifiedSignals: input.verifiedSignals,
        falsePositiveReports: input.falsePositiveReports,
      },
    };
  }
}
