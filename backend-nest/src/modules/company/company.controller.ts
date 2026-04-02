import { Controller, Get, Param, Logger } from '@nestjs/common';
import { CompanyService } from './company.service';

@Controller('companies')
export class CompanyController {
  private readonly logger = new Logger(CompanyController.name);

  constructor(private readonly companyService: CompanyService) {}

  @Get(':name')
  async getCompanyDetail(@Param('name') name: string) {
    this.logger.log(`获取公司详情: ${name}`);
    const detail = await this.companyService.getCompanyByName(name);
    return {
      code: 0,
      data: detail,
      message: 'success',
    };
  }
}
