import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../upload/cloudinary.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
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
    private readonly accessControl: AccessControlService,
  ) {}

  async findAll(actor: Express.User, requestedLocationId?: number) {
    const where = await this.accessControl.buildLocationScopeWhere(actor, requestedLocationId);
    return this.prisma.vehicleRecord.findMany({
      where,
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

  async findOne(id: number, actor: Express.User) {
    const record = await this.prisma.vehicleRecord.findUnique({ where: { id } });
    if (!record) throw new NotFoundException(`Vehicle record #${id} not found`);
    await this.accessControl.assertCanAccessLocation(actor, record.locationId);
    return record;
  }

  async create(dto: CreateVehicleRecordDto, actor: Express.User) {
    const locationId = dto.locationId ?? actor.primaryLocationId;
    if (!locationId) {
      throw new BadRequestException('locationId is required — no default location on your account');
    }
    await this.accessControl.assertCanAccessLocation(actor, locationId);

    return this.prisma.vehicleRecord.create({
      data: { ...dto, locationId, policyExpiryDate: new Date(dto.policyExpiryDate) },
    });
  }

  async update(id: number, dto: UpdateVehicleRecordDto, actor: Express.User) {
    const existing = await this.findOne(id, actor);

    if (dto.locationId && dto.locationId !== existing.locationId) {
      await this.accessControl.assertCanAccessLocation(actor, dto.locationId);
    }

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

  async remove(id: number, actor: Express.User) {
    const existing = await this.findOne(id, actor);

    // Delete all associated Cloudinary files on record deletion
    const destroyOps = DOC_FIELDS
      .filter((f) => existing[f as DocField])
      .map((f) => this.cloudinary.destroy(existing[f as DocField] as string));
    await Promise.allSettled(destroyOps);

    return this.prisma.vehicleRecord.delete({ where: { id } });
  }
}
