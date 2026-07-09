import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFireRenewalDto } from './dto/create-fire-renewal.dto';
import { UpdateFireRenewalDto } from './dto/update-fire-renewal.dto';

const FIRE_INCLUDE = {
  fireInsurance: {
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
export class FireRenewalsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(fireInsuranceId?: number) {
    return this.prisma.fireInsuranceRenewal.findMany({
      where: fireInsuranceId ? { fireInsuranceId } : undefined,
      include: FIRE_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const r = await this.prisma.fireInsuranceRenewal.findUnique({ where: { id }, include: FIRE_INCLUDE });
    if (!r) throw new NotFoundException(`Fire renewal #${id} not found`);
    return r;
  }

  async create(dto: CreateFireRenewalDto) {
    const rec = await this.prisma.fireInsurance.findUnique({ where: { id: dto.fireInsuranceId } });
    if (!rec) throw new NotFoundException(`Fire insurance #${dto.fireInsuranceId} not found`);
    return this.prisma.fireInsuranceRenewal.create({ data: dto as any, include: FIRE_INCLUDE });
  }

  async update(id: number, dto: UpdateFireRenewalDto) {
    const renewal = await this.prisma.fireInsuranceRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Fire renewal #${id} not found`);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) data.renewedDate = new Date();
    return this.prisma.fireInsuranceRenewal.update({ where: { id }, data, include: FIRE_INCLUDE });
  }

  async remove(id: number) {
    const r = await this.prisma.fireInsuranceRenewal.findUnique({ where: { id } });
    if (!r) throw new NotFoundException(`Fire renewal #${id} not found`);
    return this.prisma.fireInsuranceRenewal.delete({ where: { id } });
  }
}
