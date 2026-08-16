import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './common/health.controller';
import { PrismaService } from './common/prisma.service';
import { NumbersModule } from './modules/numbers/numbers.module';
import { ReportsModule } from './modules/reports/reports.module';
import { RiskModule } from './modules/risk/risk.module';
import { BlocklistModule } from './modules/blocklist/blocklist.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NumbersModule,
    ReportsModule,
    RiskModule,
    BlocklistModule,
  ],
  controllers: [HealthController],
  providers: [PrismaService],
})
export class AppModule {}
