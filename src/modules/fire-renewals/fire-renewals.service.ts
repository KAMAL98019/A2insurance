import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
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
      locationId: true,
    },
  },
};

@Injectable()
export class FireRenewalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, fireInsuranceId?: number) {
    const allowed = await this.accessControl.getAccessibleLocationIds(actor);
    const where: Prisma.FireInsuranceRenewalWhereInput = {
      ...(fireInsuranceId ? { fireInsuranceId } : {}),
      ...(allowed ? { fireInsurance: { locationId: { in: allowed } } } : {}),
    };

    return this.prisma.fireInsuranceRenewal.findMany({
      where,
      include: FIRE_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, actor: Express.User) {
    const r = await this.prisma.fireInsuranceRenewal.findUnique({ where: { id }, include: FIRE_INCLUDE });
    if (!r) throw new NotFoundException(`Fire renewal #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, r.fireInsurance.locationId);
    return r;
  }

  async create(dto: CreateFireRenewalDto, actor: Express.User) {
    const rec = await this.prisma.fireInsurance.findUnique({ where: { id: dto.fireInsuranceId } });
    if (!rec) throw new NotFoundException(`Fire insurance #${dto.fireInsuranceId} not found`);
    await this.accessControl.assertCanAccessLocation(actor, rec.locationId);
    return this.prisma.fireInsuranceRenewal.create({ data: dto as any, include: FIRE_INCLUDE });
  }

  async update(id: number, dto: UpdateFireRenewalDto, actor: Express.User) {
    const renewal = await this.findOne(id, actor);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) data.renewedDate = new Date();
    return this.prisma.fireInsuranceRenewal.update({ where: { id }, data, include: FIRE_INCLUDE });
  }

  async remove(id: number, actor: Express.User) {
    await this.findOne(id, actor);
    return this.prisma.fireInsuranceRenewal.delete({ where: { id } });
  }
}
