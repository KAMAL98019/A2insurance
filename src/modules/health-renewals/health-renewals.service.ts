import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
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
      locationId: true,
    },
  },
};

@Injectable()
export class HealthRenewalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, healthInsuranceId?: number) {
    const allowed = await this.accessControl.getAccessibleLocationIds(actor);
    const where: Prisma.HealthInsuranceRenewalWhereInput = {
      ...(healthInsuranceId ? { healthInsuranceId } : {}),
      ...(allowed ? { healthInsurance: { locationId: { in: allowed } } } : {}),
    };

    return this.prisma.healthInsuranceRenewal.findMany({
      where,
      include: HEALTH_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, actor: Express.User) {
    const renewal = await this.prisma.healthInsuranceRenewal.findUnique({
      where: { id },
      include: HEALTH_INCLUDE,
    });
    if (!renewal) throw new NotFoundException(`Health renewal #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, renewal.healthInsurance.locationId);
    return renewal;
  }

  async create(dto: CreateHealthRenewalDto, actor: Express.User) {
    const record = await this.prisma.healthInsurance.findUnique({
      where: { id: dto.healthInsuranceId },
    });
    if (!record) throw new NotFoundException(`Health insurance #${dto.healthInsuranceId} not found`);
    await this.accessControl.assertCanAccessLocation(actor, record.locationId);

    return this.prisma.healthInsuranceRenewal.create({
      data: dto,
      include: HEALTH_INCLUDE,
    });
  }

  async update(id: number, dto: UpdateHealthRenewalDto, actor: Express.User) {
    const renewal = await this.findOne(id, actor);

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

  async remove(id: number, actor: Express.User) {
    await this.findOne(id, actor);
    return this.prisma.healthInsuranceRenewal.delete({ where: { id } });
  }
}
