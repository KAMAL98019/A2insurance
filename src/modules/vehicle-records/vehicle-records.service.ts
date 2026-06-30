import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { CreateVehicleRecordDto } from './dto/create-vehicle-record.dto';
import { UpdateVehicleRecordDto } from './dto/update-vehicle-record.dto';

const DOC_FIELDS = [
  'rcDocument',
  'insuranceDocument',
  'aadhaarDocument',
  'panDocument',
  'photo',
  'odDocument',
  'tpDocument',
] as const;

type DocField = typeof DOC_FIELDS[number];

@Injectable()
export class VehicleRecordsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  findAll() {
    return this.prisma.vehicleRecord.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        renewals: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: {
            id: true, status: true, notes: true,
            renewedDate: true, createdAt: true, updatedAt: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const record = await this.prisma.vehicleRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Vehicle record #${id} not found`);
    return record;
  }

  create(dto: CreateVehicleRecordDto) {
    return this.prisma.vehicleRecord.create({
      data: { ...dto, policyExpiryDate: new Date(dto.policyExpiryDate) },
    });
  }

  async update(id: number, dto: UpdateVehicleRecordDto) {
    const existing = await this.findOne(id);

    // Delete replaced Cloudinary files (fire-and-forget, non-fatal)
    const destroyOps: Promise<void>[] = [];
    for (const field of DOC_FIELDS) {
      const newUrl = dto[field as keyof UpdateVehicleRecordDto] as string | undefined;
      const oldUrl = existing[field as DocField] as string | null;
      if (newUrl && oldUrl && newUrl !== oldUrl) {
        destroyOps.push(this.cloudinary.destroy(oldUrl));
      }
    }
    await Promise.allSettled(destroyOps);

    return this.prisma.vehicleRecord.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.policyExpiryDate && { policyExpiryDate: new Date(dto.policyExpiryDate) }),
      },
    });
  }

  async remove(id: number) {
    const existing = await this.findOne(id);

    // Delete all associated Cloudinary files on record deletion
    const destroyOps = DOC_FIELDS
      .filter((f) => existing[f as DocField])
      .map((f) => this.cloudinary.destroy(existing[f as DocField] as string));
    await Promise.allSettled(destroyOps);

    return this.prisma.vehicleRecord.delete({ where: { id } });
  }
}
