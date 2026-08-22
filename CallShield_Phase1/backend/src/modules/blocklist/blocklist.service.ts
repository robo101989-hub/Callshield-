import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma.service';

@Injectable()
export class BlocklistService {
  constructor(private readonly prisma: PrismaService) {}

  async block(e164: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.whitelistedNumber.deleteMany({ where: { e164 } });

      return tx.blockedNumber.upsert({
        where: { e164 },
        update: { reason },
        create: { e164, reason },
      });
    });
  }

  async unblock(e164: string) {
    await this.prisma.blockedNumber.deleteMany({ where: { e164 } });
    return { e164, blocked: false };
  }

  listBlocked() {
    return this.prisma.blockedNumber.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async whitelist(e164: string, note?: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.blockedNumber.deleteMany({ where: { e164 } });

      return tx.whitelistedNumber.upsert({
        where: { e164 },
        update: { note },
        create: { e164, note },
      });
    });
  }

  async removeWhitelist(e164: string) {
    await this.prisma.whitelistedNumber.deleteMany({ where: { e164 } });
    return { e164, whitelisted: false };
  }

  listWhitelisted() {
    return this.prisma.whitelistedNumber.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
