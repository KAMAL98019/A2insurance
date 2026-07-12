import { Module } from '@nestjs/common';
import { InsuranceCompaniesService }    from './insurance-companies.service';
import { InsuranceCompaniesController } from './insurance-companies.controller';
import { PrismaModule }                 from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [InsuranceCompaniesController],
  providers:   [InsuranceCompaniesService],
  exports:     [InsuranceCompaniesService],
})
export class InsuranceCompaniesModule {}
