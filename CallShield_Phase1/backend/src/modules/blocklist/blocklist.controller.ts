import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { BlocklistService } from './blocklist.service';

@Controller()
export class BlocklistController {
  constructor(private readonly service: BlocklistService) {}

  @Get('blocklist')
  listBlocked() {
    return this.service.listBlocked();
  }

  @Post('blocklist')
  block(@Body() body: { e164: string; reason?: string }) {
    return this.service.block(body.e164, body.reason);
  }

  @Delete('blocklist/:e164')
  unblock(@Param('e164') e164: string) {
    return this.service.unblock(e164);
  }

  @Get('whitelist')
  listWhitelisted() {
    return this.service.listWhitelisted();
  }

  @Post('whitelist')
  whitelist(@Body() body: { e164: string; note?: string }) {
    return this.service.whitelist(body.e164, body.note);
  }

  @Delete('whitelist/:e164')
  removeWhitelist(@Param('e164') e164: string) {
    return this.service.removeWhitelist(e164);
  }
}
