import { Injectable } from '@nestjs/common';

export type RiskInput = {
  reports: number;
  uniqueReporters: number;
  highSeverityReports: number;
  recentReports: number;
  campaignLinks: number;
  verifiedSignals: number;
  falsePositiveReports: number;
};

@Injectable()
export class RiskService {
  calculate(input: RiskInput) {
    // Phase 1 deterministic risk baseline.
    let score = 0;

    // Community reports
    score += Math.min(input.reports * 2, 30);

    // Independent reporters
    score += Math.min(input.uniqueReporters * 2, 20);

    // High/Critical severity reports
    score += Math.min(input.highSeverityReports * 4, 20);

    // Recent activity
    score += Math.min(input.recentReports * 2, 10);

    // Scam campaign association
    score += Math.min(input.campaignLinks * 5, 10);

    // Verified intelligence signals
    score += Math.min(input.verifiedSignals * 5, 25);

    // False-positive reports reduce confidence
    score -= Math.min(input.falsePositiveReports * 3, 15);

    score = Math.max(0, Math.min(100, score));

    const classification =
      score <= 20 ? 'SAFE' :
      score <= 40 ? 'LOW_RISK' :
      score <= 60 ? 'SUSPICIOUS' :
      score <= 80 ? 'HIGH_RISK' :
      'DANGEROUS';

    return { score, classification };
  }
}
