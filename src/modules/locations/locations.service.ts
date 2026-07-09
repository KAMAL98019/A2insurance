import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessControl: AccessControlService,
  ) {}

  /**
   * Master Admin AND Super Admin see every location (Super Admin is an
   * oversight/monitoring role — full data visibility, no catalog management
   * rights). Admin Users only see locations they're assigned to.
   */
  async findAll(actor: Express.User) {
    const allowed = await this.accessControl.getAccessibleLocationIds(actor);
    if (allowed === null) {
      return this.prisma.location.findMany({ orderBy: { name: 'asc' } });
    }
    return this.prisma.location.findMany({
      where: { id: { in: allowed } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const loc = await this.prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundException(`Location #${id} not found`);
    return loc;
  }

  async create(dto: CreateLocationDto, createdById: number) {
    const exists = await this.prisma.location.count({ where: { code: dto.code } });
    if (exists) throw new ConflictException('Location code already in use');
    return this.prisma.location.create({ data: { ...dto, createdById } });
  }

  async update(id: number, dto: UpdateLocationDto) {
    await this.findOne(id);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async deactivate(id: number) {
    await this.findOne(id);
    return this.prisma.location.update({ where: { id }, data: { status: 'INACTIVE' } });
  }

  async activate(id: number) {
    await this.findOne(id);
    return this.prisma.location.update({ where: { id }, data: { status: 'ACTIVE' } });
  }

  async remove(id: number) {
    await this.findOne(id);

    const [vehicles, health, fire, labour, users] = await Promise.all([
      this.prisma.vehicleRecord.count({ where: { locationId: id } }),
      this.prisma.healthInsurance.count({ where: { locationId: id } }),
      this.prisma.fireInsurance.count({ where: { locationId: id } }),
      this.prisma.labourInsurance.count({ where: { locationId: id } }),
      this.prisma.userLocation.count({ where: { locationId: id } }),
    ]);
    const total = vehicles + health + fire + labour + users;
    if (total > 0) {
      throw new BadRequestException(
        `Cannot delete — this location still has ${vehicles} vehicle, ${health} health, ${fire} fire, ` +
        `${labour} labour record(s) and ${users} assigned user(s). Deactivate it instead, or reassign/remove ` +
        `those first.`,
      );
    }

    return this.prisma.location.delete({ where: { id } });
  }

  async assignSuperAdmin(locationId: number, superAdminId: number, assignedById: number) {
    await this.findOne(locationId);
    return this.prisma.userLocation.upsert({
      where: { userId_locationId: { userId: superAdminId, locationId } },
      create: { userId: superAdminId, locationId, assignedById },
      update: {},
    });
  }
}
