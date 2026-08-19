import { Body, Controller, Get, Post } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly service: CampaignsService) {}

  @Get()
  listCampaigns() {
    return this.service.listCampaigns();
  }

  @Post()
  createCampaign(@Body() body: { name: string; description?: string; status?: string }) {
    return this.service.createCampaign(body);
  }
}
