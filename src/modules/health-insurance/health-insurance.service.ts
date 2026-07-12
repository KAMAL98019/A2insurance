import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
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
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, query: QueryHealthInsuranceDto = {}) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(
      actor, query.locationId ? Number(query.locationId) : undefined,
    );
    const where: Prisma.HealthInsuranceWhereInput = { ...locationWhere };

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

  async findOne(id: number, actor: Express.User) {
    const record = await this.prisma.healthInsurance.findUnique({
      where: { id },
      include: { familyMembers: { orderBy: { createdAt: 'asc' } } },
    });
    if (!record) throw new NotFoundException(`Health insurance #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, record.locationId);
    return record;
  }

  async create(dto: CreateHealthInsuranceDto, actor: Express.User) {
    const locationId = dto.locationId ?? actor.primaryLocationId;
    if (!locationId) {
      throw new BadRequestException('locationId is required — no default location on your account');
    }
    await this.accessControl.assertCanAccessLocation(actor, locationId);

    const { familyMembers, ...data } = dto;

    return this.prisma.healthInsurance.create({
      data: {
        ...data,
        locationId,
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

  async update(id: number, dto: UpdateHealthInsuranceDto, actor: Express.User) {
    const existing = await this.findOne(id, actor);
    const { familyMembers, ...data } = dto;

    if (data.locationId && data.locationId !== existing.locationId) {
      await this.accessControl.assertCanAccessLocation(actor, data.locationId);
    }

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

  async remove(id: number, actor: Express.User) {
    const existing = await this.findOne(id, actor);

    const destroyOps = DOC_FIELDS
      .filter((f) => existing[f as DocField])
      .map((f) => this.cloudinary.destroy(existing[f as DocField] as string));
    await Promise.allSettled(destroyOps);

    return this.prisma.healthInsurance.delete({ where: { id } });
  }

  async getUpcomingRenewals(actor: Express.User, days = 30) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(actor);
    const now    = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);

    return this.prisma.healthInsurance.findMany({
      where: {
        ...locationWhere,
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

  async getStats(actor: Express.User, requestedLocationId?: number) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(actor, requestedLocationId);
    const now        = new Date();
    const in30Days   = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [total, active, expired, pendingRenewal, upcomingRenewals] = await Promise.all([
      this.prisma.healthInsurance.count({ where: locationWhere }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'ACTIVE' } }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'EXPIRED' } }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.healthInsurance.count({
        where: {
          ...locationWhere,
          renewalDate:  { gte: now, lte: in30Days },
          policyStatus: { not: 'CANCELLED' },
        },
      }),
    ]);

    return { total, active, expired, pendingRenewal, upcomingRenewals };
  }

  // ── WhatsApp manual send ──────────────────────────────────────────────────

  async sendWhatsApp(id: number, actor: Express.User, customMessage?: string) {
    const record = await this.findOne(id, actor);

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
