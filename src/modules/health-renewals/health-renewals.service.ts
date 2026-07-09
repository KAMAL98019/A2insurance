import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateHealthRenewalDto } from './dto/create-health-renewal.dto';
import { UpdateHealthRenewalDto } from './dto/update-health-renewal.dto';

const HEALTH_INCLUDE = {
  healthInsurance: {
    select: {
      id: true,
      policyNumber: true,
      policyHolderName: true,
      mobileNumber: true,
      insuranceCompanyName: true,
      policyType: true,
      renewalDate: true,
      policyStatus: true,
    },
  },
};

@Injectable()
export class HealthRenewalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(healthInsuranceId?: number) {
    return this.prisma.healthInsuranceRenewal.findMany({
      where: healthInsuranceId ? { healthInsuranceId } : undefined,
      include: HEALTH_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const renewal = await this.prisma.healthInsuranceRenewal.findUnique({
      where: { id },
      include: HEALTH_INCLUDE,
    });
    if (!renewal) throw new NotFoundException(`Health renewal #${id} not found`);
    return renewal;
  }

  async create(dto: CreateHealthRenewalDto) {
    const record = await this.prisma.healthInsurance.findUnique({
      where: { id: dto.healthInsuranceId },
    });
    if (!record) throw new NotFoundException(`Health insurance #${dto.healthInsuranceId} not found`);

    return this.prisma.healthInsuranceRenewal.create({
      data: dto,
      include: HEALTH_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateHealthRenewalDto) {
    const renewal = await this.prisma.healthInsuranceRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Health renewal #${id} not found`);

    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) {
      data.renewedDate = new Date();
    }

    return this.prisma.healthInsuranceRenewal.update({
      where: { id },
      data,
      include: HEALTH_INCLUDE,
    });
  }

  async remove(id: number) {
    const renewal = await this.prisma.healthInsuranceRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Health renewal #${id} not found`);
    return this.prisma.healthInsuranceRenewal.delete({ where: { id } });
  }
}
