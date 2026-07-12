import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
import { CreateLabourInsuranceDto } from './dto/create-labour-insurance.dto';
import { UpdateLabourInsuranceDto } from './dto/update-labour-insurance.dto';
import { QueryLabourInsuranceDto } from './dto/query-labour-insurance.dto';

@Injectable()
export class LabourInsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, query: QueryLabourInsuranceDto = {}) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(
      actor, query.locationId ? Number(query.locationId) : undefined,
    );
    const where: Prisma.LabourInsuranceWhereInput = { ...locationWhere };
    if (query.policyStatus) where.policyStatus = query.policyStatus as any;
    if (query.customerType) where.customerType = query.customerType as any;
    if (query.renewalDays) {
      const days = parseInt(query.renewalDays, 10) || 30;
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      where.renewalDate = { gte: now, lte: future };
      where.policyStatus = { not: 'CANCELLED' as any };
    }
    if (query.search) {
      const q = query.search;
      where.OR = [
        { policyNumber: { contains: q } },
        { insuredName: { contains: q } },
        { mobileNumber: { contains: q } },
        { insuranceCompanyName: { contains: q } },
      ];
    }
    return this.prisma.labourInsurance.findMany({
      where,
      include: {
        renewals: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true, status: true, notes: true, renewedDate: true, createdAt: true, updatedAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, actor: Express.User) {
    const record = await this.prisma.labourInsurance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Labour insurance #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, record.locationId);
    return record;
  }

  async create(dto: CreateLabourInsuranceDto, actor: Express.User) {
    const locationId = dto.locationId ?? actor.primaryLocationId;
    if (!locationId) {
      throw new BadRequestException('locationId is required — no default location on your account');
    }
    await this.accessControl.assertCanAccessLocation(actor, locationId);

    return this.prisma.labourInsurance.create({
      data: {
        ...dto,
        locationId,
        policyStartDate: new Date(dto.policyStartDate),
        policyEndDate: new Date(dto.policyEndDate),
        renewalDate: new Date(dto.renewalDate),
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : null,
      } as any,
    });
  }

  async update(id: number, dto: UpdateLabourInsuranceDto, actor: Express.User) {
    const existing = await this.findOne(id, actor);

    if (dto.locationId && dto.locationId !== existing.locationId) {
      await this.accessControl.assertCanAccessLocation(actor, dto.locationId);
    }

    const data: Record<string, unknown> = { ...dto };
    if (existing.policyDocument && dto.policyDocument && dto.policyDocument !== existing.policyDocument) {
      await this.cloudinary.destroy(existing.policyDocument).catch(() => {});
    }
    if (dto.policyStartDate) data.policyStartDate = new Date(dto.policyStartDate);
    if (dto.policyEndDate) data.policyEndDate = new Date(dto.policyEndDate);
    if (dto.renewalDate) data.renewalDate = new Date(dto.renewalDate);
    if (dto.receiptDate !== undefined) data.receiptDate = dto.receiptDate ? new Date(dto.receiptDate) : null;
    return this.prisma.labourInsurance.update({ where: { id }, data });
  }

  async remove(id: number, actor: Express.User) {
    const existing = await this.findOne(id, actor);
    if (existing.policyDocument) await this.cloudinary.destroy(existing.policyDocument).catch(() => {});
    return this.prisma.labourInsurance.delete({ where: { id } });
  }

  async getStats(actor: Express.User, requestedLocationId?: number) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(actor, requestedLocationId);
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const [total, active, expired, pendingRenewal, upcoming] = await Promise.all([
      this.prisma.labourInsurance.count({ where: locationWhere }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'ACTIVE' } }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'EXPIRED' } }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.labourInsurance.count({
        where: { ...locationWhere, renewalDate: { gte: now, lte: in30 }, policyStatus: { not: 'CANCELLED' } },
      }),
    ]);
    return { total, active, expired, pendingRenewal, upcoming };
  }
}
