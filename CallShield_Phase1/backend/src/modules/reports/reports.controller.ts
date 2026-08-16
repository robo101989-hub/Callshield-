import { Body, Controller, Param, Post } from '@nestjs/common';
import { CreateReportDto } from './reports.dto';
import { ReportsService } from './reports.service';

@Controller('numbers')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post(':e164/reports')
  create(
    @Param('e164') e164: string,
    @Body() dto: CreateReportDto,
  ) {
    return this.reports.create(e164, dto);
  }
}
