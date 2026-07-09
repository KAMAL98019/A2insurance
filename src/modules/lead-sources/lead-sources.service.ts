import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateLeadSourceDto } from './dto/create-lead-source.dto';
import { UpdateLeadSourceDto } from './dto/update-lead-source.dto';

@Injectable()
export class LeadSourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(onlyActive = false) {
    return this.prisma.leadSource.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.leadSource.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Lead source #${id} not found`);
    return item;
  }

  async create(dto: CreateLeadSourceDto) {
    const exists = await this.prisma.leadSource.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Lead source "${dto.name}" already exists`);
    return this.prisma.leadSource.create({ data: { name: dto.name, isActive: dto.isActive ?? true } });
  }

  async update(id: number, dto: UpdateLeadSourceDto) {
    await this.findOne(id);
    if (dto.name) {
      const conflict = await this.prisma.leadSource.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (conflict) throw new ConflictException(`Lead source "${dto.name}" already exists`);
    }
    return this.prisma.leadSource.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.leadSource.delete({ where: { id } });
  }
}
