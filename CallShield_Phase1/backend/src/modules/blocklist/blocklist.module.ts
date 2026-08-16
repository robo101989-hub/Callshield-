import { Module } from '@nestjs/common';
import { BlocklistController } from './blocklist.controller';
import { BlocklistService } from './blocklist.service';
import { PrismaService } from '../../common/prisma.service';

@Module({
  controllers: [BlocklistController],
  providers: [BlocklistService, PrismaService],
})
export class BlocklistModule {}
