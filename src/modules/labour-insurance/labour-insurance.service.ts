import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { CreateLabourInsuranceDto } from './dto/create-labour-insurance.dto';
import { UpdateLabourInsuranceDto } from './dto/update-labour-insurance.dto';
import { QueryLabourInsuranceDto } from './dto/query-labour-insurance.dto';

@Injectable()
export class LabourInsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  findAll(query: QueryLabourInsuranceDto = {}) {
    const where: Prisma.LabourInsuranceWhereInput = {};
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

  async findOne(id: number) {
    const record = await this.prisma.labourInsurance.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Labour insurance #${id} not found`);
    return record;
  }

  create(dto: CreateLabourInsuranceDto) {
    return this.prisma.labourInsurance.create({
      data: {
        ...dto,
        policyStartDate: new Date(dto.policyStartDate),
        policyEndDate: new Date(dto.policyEndDate),
        renewalDate: new Date(dto.renewalDate),
        receiptDate: dto.receiptDate ? new Date(dto.receiptDate) : null,
      } as any,
    });
  }

  async update(id: number, dto: UpdateLabourInsuranceDto) {
    const existing = await this.findOne(id);
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

  async remove(id: number) {
    const existing = await this.findOne(id);
    if (existing.policyDocument) await this.cloudinary.destroy(existing.policyDocument).catch(() => {});
    return this.prisma.labourInsurance.delete({ where: { id } });
  }

  async getStats() {
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const [total, active, expired, pendingRenewal, upcoming] = await Promise.all([
      this.prisma.labourInsurance.count(),
      this.prisma.labourInsurance.count({ where: { policyStatus: 'ACTIVE' } }),
      this.prisma.labourInsurance.count({ where: { policyStatus: 'EXPIRED' } }),
      this.prisma.labourInsurance.count({ where: { policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.labourInsurance.count({
        where: { renewalDate: { gte: now, lte: in30 }, policyStatus: { not: 'CANCELLED' } },
      }),
    ]);
    return { total, active, expired, pendingRenewal, upcoming };
  }
}
