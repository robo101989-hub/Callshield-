import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';
import { CreateReportDto } from './reports.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(e164: string, dto: CreateReportDto) {
    const phoneNumber = await this.prisma.phoneNumber.upsert({
      where: { e164 },
      update: {},
      create: { e164 },
    });

    let reporterId: string | undefined;

    if (dto.reporterPhoneE164) {
      const reporter = await this.prisma.user.upsert({
        where: { phoneE164: dto.reporterPhoneE164 },
        update: {},
        create: { phoneE164: dto.reporterPhoneE164 },
      });

      reporterId = reporter.id;
    }

    const report = await this.prisma.report.create({
      data: {
        phoneNumberId: phoneNumber.id,
        reporterId,
        category: dto.category,
        severity: dto.severity,
        description: dto.description,
      },
    });

    return {
      id: report.id,
      number: e164,
      status: 'RECEIVED',
      message: 'Report submitted for CallShield intelligence review.',
    };
  }
}
