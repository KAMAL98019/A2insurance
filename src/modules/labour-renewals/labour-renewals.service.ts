import { Injectable, NotFoundException } from '@nestjs/common';
import { RenewalStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
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
      locationId: true,
    },
  },
};

@Injectable()
export class LabourRenewalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, labourInsuranceId?: number) {
    const allowed = await this.accessControl.getAccessibleLocationIds(actor);
    const where: Prisma.LabourInsuranceRenewalWhereInput = {
      ...(labourInsuranceId ? { labourInsuranceId } : {}),
      ...(allowed ? { labourInsurance: { locationId: { in: allowed } } } : {}),
    };

    return this.prisma.labourInsuranceRenewal.findMany({
      where,
      include: LABOUR_INCLUDE,
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, actor: Express.User) {
    const r = await this.prisma.labourInsuranceRenewal.findUnique({ where: { id }, include: LABOUR_INCLUDE });
    if (!r) throw new NotFoundException(`Labour renewal #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, r.labourInsurance.locationId);
    return r;
  }

  async create(dto: CreateLabourRenewalDto, actor: Express.User) {
    const rec = await this.prisma.labourInsurance.findUnique({ where: { id: dto.labourInsuranceId } });
    if (!rec) throw new NotFoundException(`Labour insurance #${dto.labourInsuranceId} not found`);
    await this.accessControl.assertCanAccessLocation(actor, rec.locationId);
    return this.prisma.labourInsuranceRenewal.create({ data: dto as any, include: LABOUR_INCLUDE });
  }

  async update(id: number, dto: UpdateLabourRenewalDto, actor: Express.User) {
    const renewal = await this.findOne(id, actor);
    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) data.renewedDate = new Date();
    return this.prisma.labourInsuranceRenewal.update({ where: { id }, data, include: LABOUR_INCLUDE });
  }

  async remove(id: number, actor: Express.User) {
    await this.findOne(id, actor);
    return this.prisma.labourInsuranceRenewal.delete({ where: { id } });
  }
}
