import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  listCampaigns() {
    return this.service.listCampaigns();
  }

  @Get(':campaignId')
  getCampaign(@Param('campaignId') campaignId: string) {
    return this.service.getCampaign(campaignId);
  }

  @Post(':campaignId/numbers')
  linkNumber(
    @Param('campaignId') campaignId: string,
    @Body() body: { e164: string; confidence?: number },
  ) {
    return this.service.linkNumber(campaignId, body);
  }

  @Post()
  createCampaign(@Body() body: { name: string; description?: string; status?: string }) {
    return this.service.createCampaign(body);
  }
}
