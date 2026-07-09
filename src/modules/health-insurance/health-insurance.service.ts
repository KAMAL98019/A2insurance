import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateHealthInsuranceDto } from './dto/create-health-insurance.dto';
import { UpdateHealthInsuranceDto } from './dto/update-health-insurance.dto';
import { QueryHealthInsuranceDto } from './dto/query-health-insurance.dto';
import { Prisma, NotificationType } from '@prisma/client';

const DOC_FIELDS = ['policyDocument', 'idProof', 'medicalDocument'] as const;
type DocField = typeof DOC_FIELDS[number];

@Injectable()
export class HealthInsuranceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
    private readonly notifications: NotificationsService,
  ) {}

  findAll(query: QueryHealthInsuranceDto = {}) {
    const where: Prisma.HealthInsuranceWhereInput = {};

    if (query.policyStatus) where.policyStatus = query.policyStatus;
    if (query.policyType)   where.policyType   = query.policyType;
    if (query.customerType) where.customerType = query.customerType;

    if (query.insuranceCompanyName) {
      where.insuranceCompanyName = { contains: query.insuranceCompanyName };
    }

    if (query.renewalDays) {
      const days = parseInt(query.renewalDays, 10) || 30;
      const now    = new Date();
      const future = new Date();
      future.setDate(future.getDate() + days);
      where.renewalDate   = { gte: now, lte: future };
      where.policyStatus  = { not: 'CANCELLED' };
    }

    if (query.search) {
      const q = query.search;
      where.OR = [
        { policyNumber:         { contains: q } },
        { policyHolderName:     { contains: q } },
        { mobileNumber:         { contains: q } },
        { insuranceCompanyName: { contains: q } },
      ];
    }

    return this.prisma.healthInsurance.findMany({
      where,
      include: {
        familyMembers: true,
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
    const record = await this.prisma.healthInsurance.findUnique({
      where: { id },
      include: { familyMembers: { orderBy: { createdAt: 'asc' } } },
    });
    if (!record) throw new NotFoundException(`Health insurance #${id} not found`);
    return record;
  }

  create(dto: CreateHealthInsuranceDto) {
    const { familyMembers, ...data } = dto;

    return this.prisma.healthInsurance.create({
      data: {
        ...data,
        policyStartDate: new Date(data.policyStartDate),
        policyEndDate:   new Date(data.policyEndDate),
        renewalDate:     new Date(data.renewalDate),
        dateOfBirth:     data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        ...(familyMembers?.length
          ? {
              familyMembers: {
                create: familyMembers.map((m) => ({
                  ...m,
                  dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
                })),
              },
            }
          : {}),
      },
      include: { familyMembers: true },
    });
  }

  async update(id: number, dto: UpdateHealthInsuranceDto) {
    const existing = await this.findOne(id);
    const { familyMembers, ...data } = dto;

    // Delete replaced Cloudinary files (fire-and-forget)
    const destroyOps: Promise<void>[] = [];
    for (const field of DOC_FIELDS) {
      const newUrl = data[field as keyof typeof data] as string | undefined;
      const oldUrl = existing[field as DocField] as string | null;
      if (newUrl && oldUrl && newUrl !== oldUrl) {
        destroyOps.push(this.cloudinary.destroy(oldUrl));
      }
    }
    await Promise.allSettled(destroyOps);

    return this.prisma.healthInsurance.update({
      where: { id },
      data: {
        ...data,
        ...(data.policyStartDate && { policyStartDate: new Date(data.policyStartDate) }),
        ...(data.policyEndDate   && { policyEndDate:   new Date(data.policyEndDate) }),
        ...(data.renewalDate     && { renewalDate:     new Date(data.renewalDate) }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        // Replace all family members on update (delete + recreate)
        ...(familyMembers !== undefined && {
          familyMembers: {
            deleteMany: {},
            create: familyMembers.map((m) => ({
              ...m,
              dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
            })),
          },
        }),
      },
      include: { familyMembers: true },
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    const destroyOps = DOC_FIELDS
      .filter((f) => existing[f as DocField])
      .map((f) => this.cloudinary.destroy(existing[f as DocField] as string));
    await Promise.allSettled(destroyOps);

    return this.prisma.healthInsurance.delete({ where: { id } });
  }

  getUpcomingRenewals(days = 30) {
    const now    = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.prisma.healthInsurance.findMany({
      where: {
        renewalDate:  { gte: now, lte: future },
        policyStatus: { not: 'CANCELLED' },
      },
      orderBy: { renewalDate: 'asc' },
      select: {
        id: true, policyNumber: true, policyHolderName: true,
        mobileNumber: true, insuranceCompanyName: true,
        policyType: true, sumInsured: true, renewalDate: true, policyStatus: true,
      },
    });
  }

  async getStats() {
    const now        = new Date();
    const in30Days   = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [total, active, expired, pendingRenewal, upcomingRenewals] = await Promise.all([
      this.prisma.healthInsurance.count(),
      this.prisma.healthInsurance.count({ where: { policyStatus: 'ACTIVE' } }),
      this.prisma.healthInsurance.count({ where: { policyStatus: 'EXPIRED' } }),
      this.prisma.healthInsurance.count({ where: { policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.healthInsurance.count({
        where: {
          renewalDate:  { gte: now, lte: in30Days },
          policyStatus: { not: 'CANCELLED' },
        },
      }),
    ]);

    return { total, active, expired, pendingRenewal, upcomingRenewals };
  }

  // ── WhatsApp manual send ──────────────────────────────────────────────────

  async sendWhatsApp(id: number, customMessage?: string) {
    const record = await this.findOne(id);

    if (!this.notifications.getWhatsAppStatus().connected) {
      return { success: false, message: 'WhatsApp not connected. Go to Settings to scan the QR code.' };
    }

    const renewalDate = record.renewalDate;
    const now         = new Date();
    const daysLeft    = Math.ceil((renewalDate.getTime() - now.getTime()) / 86_400_000);

    if (customMessage) {
      // Use custom message as MANUAL type
      return this.notifications.sendManual({
        mobileNumber:     record.mobileNumber,
        message:          customMessage,
        healthInsuranceId: record.id,
      });
    }

    // Build and send automatic renewal reminder
    await this.notifications.sendHealthRenewalAlert(
      {
        id:              record.id,
        policyNumber:    record.policyNumber,
        policyHolderName: record.policyHolderName,
        mobileNumber:    record.mobileNumber,
        renewalDate:     renewalDate,
      },
      NotificationType.MANUAL,
      daysLeft,
    );

    return { success: true, message: 'WhatsApp message sent.' };
  }
}
