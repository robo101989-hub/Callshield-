import { PrismaClient, ReportCategory, Severity } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const number = await prisma.phoneNumber.upsert({
    where: { e164: '+919876543210' },
    update: {},
    create: {
      e164: '+919876543210',
      status: 'HIGH_RISK',
      carrier: 'Demo Carrier',
      telecomRegion: 'Delhi NCR',
      intelligenceConfidence: 'MEDIUM',
    },
  });

  await prisma.report.deleteMany({ where: { phoneNumberId: number.id } });

  await prisma.report.createMany({
    data: [
      { phoneNumberId: number.id, category: ReportCategory.UPI_FRAUD, severity: Severity.HIGH, description: 'Demo report: suspicious payment request.' },
      { phoneNumberId: number.id, category: ReportCategory.POLICE_IMPERSONATION, severity: Severity.CRITICAL, description: 'Demo report: caller impersonated law enforcement.' },
      { phoneNumberId: number.id, category: ReportCategory.KYC_FRAUD, severity: Severity.HIGH, description: 'Demo report: requested urgent KYC verification.' }
    ]
  });

  console.log('Seeded demo intelligence for +919876543210');
}

main().finally(() => prisma.$disconnect());
