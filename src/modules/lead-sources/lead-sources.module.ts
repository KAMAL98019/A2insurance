import { Module } from '@nestjs/common';
import { LeadSourcesService }    from './lead-sources.service';
import { LeadSourcesController } from './lead-sources.controller';
import { PrismaModule }          from '../../prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [LeadSourcesController],
  providers:   [LeadSourcesService],
  exports:     [LeadSourcesService],
})
export class LeadSourcesModule {}
