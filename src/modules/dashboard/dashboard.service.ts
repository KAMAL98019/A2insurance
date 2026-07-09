import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/access-control/access-control.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  async getStats(actor: Express.User, requestedLocationId?: number) {
    const locationWhere = await this.accessControl.buildLocationScopeWhere(actor, requestedLocationId);
    const allAccessible = await this.accessControl.getAccessibleLocationIds(actor);
    const scopedLocationIds = requestedLocationId ? [requestedLocationId] : allAccessible;

    const now = new Date();
    const in7Days  = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Renewals have no own locationId column — scope via the parent record's location.
    const renewalWhere = locationWhere.locationId !== undefined
      ? { vehicleRecord: locationWhere }
      : {};

    const [
      total,
      expiringIn7Days,
      expiringIn30Days,
      expired,
      renewedThisMonth,
      trackTotal,
      trackInProgress,
      trackRenewed,
      trackCancelled,
      expirySoonRaw,
      categoryRaw,
      // Health Insurance stats
      healthTotal,
      healthActive,
      healthExpired,
      healthPendingRenewal,
      healthUpcoming,
      // Fire Insurance stats
      fireTotal,
      fireActive,
      fireExpired,
      firePendingRenewal,
      fireUpcoming,
      // Labour Insurance stats
      labourTotal,
      labourActive,
      labourExpired,
      labourPendingRenewal,
      labourUpcoming,
    ] = await Promise.all([
      // Vehicle overview
      this.prisma.vehicleRecord.count({ where: locationWhere }),
      this.prisma.vehicleRecord.count({ where: { ...locationWhere, policyExpiryDate: { gte: now, lte: in7Days } } }),
      this.prisma.vehicleRecord.count({ where: { ...locationWhere, policyExpiryDate: { gte: now, lte: in30Days } } }),
      this.prisma.vehicleRecord.count({ where: { ...locationWhere, policyExpiryDate: { lt: now } } }),
      this.prisma.vehicleRecord.count({
        where: { ...locationWhere, updatedAt: { gte: startOfMonth, lte: endOfMonth }, policyExpiryDate: { gte: now } },
      }),

      // Renewal tracking KPIs
      this.prisma.vehicleRenewal.count({ where: renewalWhere }),
      this.prisma.vehicleRenewal.count({
        where: { ...renewalWhere, status: { notIn: ['RENEWED', 'CANCELLED'] } },
      }),
      this.prisma.vehicleRenewal.count({ where: { ...renewalWhere, status: 'RENEWED' } }),
      this.prisma.vehicleRenewal.count({ where: { ...renewalWhere, status: 'CANCELLED' } }),

      // Expiry alerts — next 30 days, sorted by urgency
      this.prisma.vehicleRecord.findMany({
        where: { ...locationWhere, policyExpiryDate: { gte: now, lte: in30Days } },
        orderBy: { policyExpiryDate: 'asc' },
        take: 10,
        select: {
          id: true,
          vehicleNumber: true,
          ownerName: true,
          cellNumber: true,
          category: true,
          policyExpiryDate: true,
        },
      }),

      // Category breakdown
      this.prisma.vehicleRecord.groupBy({
        by: ['category'],
        where: locationWhere,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),

      // Health Insurance stats
      this.prisma.healthInsurance.count({ where: locationWhere }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'ACTIVE' } }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'EXPIRED' } }),
      this.prisma.healthInsurance.count({ where: { ...locationWhere, policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.healthInsurance.count({
        where: { ...locationWhere, renewalDate: { gte: now, lte: in30Days }, policyStatus: { not: 'CANCELLED' } },
      }),

      // Fire Insurance stats
      this.prisma.fireInsurance.count({ where: locationWhere }),
      this.prisma.fireInsurance.count({ where: { ...locationWhere, policyStatus: 'ACTIVE' } }),
      this.prisma.fireInsurance.count({ where: { ...locationWhere, policyStatus: 'EXPIRED' } }),
      this.prisma.fireInsurance.count({ where: { ...locationWhere, policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.fireInsurance.count({
        where: { ...locationWhere, renewalDate: { gte: now, lte: in30Days }, policyStatus: { not: 'CANCELLED' } },
      }),

      // Labour Insurance stats
      this.prisma.labourInsurance.count({ where: locationWhere }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'ACTIVE' } }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'EXPIRED' } }),
      this.prisma.labourInsurance.count({ where: { ...locationWhere, policyStatus: 'PENDING_RENEWAL' } }),
      this.prisma.labourInsurance.count({
        where: { ...locationWhere, renewalDate: { gte: now, lte: in30Days }, policyStatus: { not: 'CANCELLED' } },
      }),
    ]);

    const MS_PER_DAY = 86_400_000;

    return {
      // Location context for the UI
      scopedLocationIds,

      // Vehicle overview
      total,
      expiringIn7Days,
      expiringIn30Days,
      expired,
      renewedThisMonth,

      // Renewal tracking
      renewalTracking: {
        total:      trackTotal,
        inProgress: trackInProgress,
        renewed:    trackRenewed,
        cancelled:  trackCancelled,
      },

      // Expiry alerts with days-until-expiry
      expiryAlerts: expirySoonRaw.map((r) => ({
        id:               r.id,
        vehicleNumber:    r.vehicleNumber,
        ownerName:        r.ownerName,
        cellNumber:       r.cellNumber,
        category:         r.category,
        policyExpiryDate: r.policyExpiryDate.toISOString(),
        daysUntilExpiry:  Math.ceil((r.policyExpiryDate.getTime() - now.getTime()) / MS_PER_DAY),
      })),

      // Category distribution
      categoryBreakdown: categoryRaw.map((r) => ({
        category: r.category,
        count:    r._count.id,
      })),

      // Health Insurance overview
      healthInsurance: {
        total:          healthTotal,
        active:         healthActive,
        expired:        healthExpired,
        pendingRenewal: healthPendingRenewal,
        upcomingIn30:   healthUpcoming,
      },

      // Fire Insurance overview
      fireInsurance: {
        total:          fireTotal,
        active:         fireActive,
        expired:        fireExpired,
        pendingRenewal: firePendingRenewal,
        upcomingIn30:   fireUpcoming,
      },

      // Labour Insurance overview
      labourInsurance: {
        total:          labourTotal,
        active:         labourActive,
        expired:        labourExpired,
        pendingRenewal: labourPendingRenewal,
        upcomingIn30:   labourUpcoming,
      },
    };
  }
}
