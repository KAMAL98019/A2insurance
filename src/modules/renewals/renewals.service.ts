import { Injectable, NotFoundException, OnModuleInit, Logger } from '@nestjs/common';
import { RenewalStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRenewalDto } from './dto/create-renewal.dto';
import { UpdateRenewalDto } from './dto/update-renewal.dto';

@Injectable()
export class RenewalsService implements OnModuleInit {
  private readonly logger = new Logger(RenewalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // Remove orphaned renewals whose parent vehicle record was deleted
    const result = await this.prisma.$executeRaw`
      DELETE FROM vehicle_renewals
      WHERE vehicle_record_id NOT IN (SELECT id FROM vehicle_records)
    `;
    if (result > 0) {
      this.logger.warn(`Cleaned up ${result} orphaned renewal record(s)`);
    }
  }

  findAll(vehicleRecordId?: number) {
    return this.prisma.vehicleRenewal.findMany({
      where: vehicleRecordId ? { vehicleRecordId } : undefined,
      include: { vehicleRecord: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const renewal = await this.prisma.vehicleRenewal.findUnique({
      where: { id },
      include: { vehicleRecord: true },
    });
    if (!renewal) throw new NotFoundException(`Renewal #${id} not found`);
    return renewal;
  }

  async create(dto: CreateRenewalDto) {
    const vehicle = await this.prisma.vehicleRecord.findUnique({
      where: { id: dto.vehicleRecordId },
    });
    if (!vehicle) throw new NotFoundException(`Vehicle record #${dto.vehicleRecordId} not found`);

    return this.prisma.vehicleRenewal.create({
      data: dto,
      include: { vehicleRecord: true },
    });
  }

  async update(id: number, dto: UpdateRenewalDto) {
    const renewal = await this.prisma.vehicleRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Renewal #${id} not found`);

    const data: Record<string, unknown> = { ...dto };
    if (dto.status === RenewalStatus.RENEWED && !renewal.renewedDate) {
      data.renewedDate = new Date();
    }

    return this.prisma.vehicleRenewal.update({
      where: { id },
      data,
      include: { vehicleRecord: true },
    });
  }

  async remove(id: number) {
    const renewal = await this.prisma.vehicleRenewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException(`Renewal #${id} not found`);
    return this.prisma.vehicleRenewal.delete({ where: { id } });
  }
}
