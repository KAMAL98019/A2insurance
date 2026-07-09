import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLabourRenewalDto } from './dto/create-labour-renewal.dto';
import { UpdateLabourRenewalDto } from './dto/update-labour-renewal.dto';

const LABOUR_INCLUDE = {
  labourInsurance: {
    select: {
      id: true,
      policyNumber: true,
      insuredName: true,
      mobileNumber: true,
      insuranceCompanyName: true,
      renewalDate: true,
      policyStatus: true,
    },
  },
};

@Injectable()
export class LabourRenewalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(labourInsuranceId?: number) {
    return this.prisma.labourInsuranceRenewal.findMany({
      where: labourInsuranceId ? { labourInsuranceId } : undefined,
      include: LABOUR_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const r = await this.prisma.labourInsuranceRenewal.findUnique({ where: { id }, include: LABOUR_INCLUDE });
    if (!r) throw new NotFoundException(`Labour renewal #${id} not found`);
    return r;
  }

  async create(dto: CreateLabourRenewalDto) {
    const rec = await this.prisma.labourInsurance.findUnique({ where: { id: dto.labourInsuranceId } });
    if (!rec) throw new NotFoundException(`Labour insurance #${dto.labourInsuranceId} not found`);
    return this.prisma.labourInsuranceRenewal.create({ data: dto as any, include: LABOUR_INCLUDE });
  }

  async update(id: number, dto: UpdateLabourRenewalDto) {
    const renewal = await this.prisma.labourInsuranceRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Labour renewal #${id} not found`);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) data.renewedDate = new Date();
    return this.prisma.labourInsuranceRenewal.update({ where: { id }, data, include: LABOUR_INCLUDE });
  }

  async remove(id: number) {
    const r = await this.prisma.labourInsuranceRenewal.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`Labour renewal #${id} not found`);
    return this.prisma.labourInsuranceRenewal.delete({ where: { id } });
  }
}
