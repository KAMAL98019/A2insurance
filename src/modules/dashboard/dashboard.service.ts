import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const now = new Date();
    const in7Days  = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
    const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

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
    ] = await Promise.all([
      // Vehicle overview
      this.prisma.vehicleRecord.count(),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { gte: now, lte: in7Days } } }),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { gte: now, lte: in30Days } } }),
      this.prisma.vehicleRecord.count({ where: { policyExpiryDate: { lt: now } } }),
      this.prisma.vehicleRecord.count({
        where: { updatedAt: { gte: startOfMonth, lte: endOfMonth }, policyExpiryDate: { gte: now } },
      }),

      // Renewal tracking KPIs
      this.prisma.vehicleRenewal.count(),
      this.prisma.vehicleRenewal.count({
        where: { status: { notIn: ['RENEWED', 'CANCELLED'] } },
      }),
      this.prisma.vehicleRenewal.count({ where: { status: 'RENEWED' } }),
      this.prisma.vehicleRenewal.count({ where: { status: 'CANCELLED' } }),

      // Expiry alerts — next 30 days, sorted by urgency
      this.prisma.vehicleRecord.findMany({
        where: { policyExpiryDate: { gte: now, lte: in30Days } },
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
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    const MS_PER_DAY = 86_400_000;

    return {
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
    };
  }
}
