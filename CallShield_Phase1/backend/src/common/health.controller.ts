import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health() {
    return {
      service: 'callshield-api',
      phase: 1,
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
