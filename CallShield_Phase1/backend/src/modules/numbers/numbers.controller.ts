import { Controller, Get, Param } from '@nestjs/common';
import { NumbersService } from './numbers.service';

@Controller('numbers')
export class NumbersController {
  constructor(private readonly numbers: NumbersService) {}

  @Get(':e164')
  getNumber(@Param('e164') e164: string) {
    return this.numbers.getIntelligence(e164);
  }

  @Get(':e164/risk')
  getRisk(@Param('e164') e164: string) {
    return this.numbers.getRisk(e164);
  }
}
