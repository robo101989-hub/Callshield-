import { Module } from '@nestjs/common';
import { NumbersController } from './numbers.controller';
import { NumbersService } from './numbers.service';
import { PrismaService } from '../../common/prisma.service';
import { RiskModule } from '../risk/risk.module';

@Module({
  imports: [RiskModule],
  controllers: [NumbersController],
  providers: [NumbersService, PrismaService],
  exports: [NumbersService],
})
export class NumbersModule {}
