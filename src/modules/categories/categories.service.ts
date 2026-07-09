import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicleCategory.findMany({
      where:   { parentId: null },
      include: { children: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const cat = await this.prisma.vehicleCategory.findUnique({
      where:   { id },
      include: { children: { orderBy: { name: 'asc' } } },
    });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.vehicleCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Category "${dto.name}" already exists`);

    if (dto.parentId) {
      const parent = await this.prisma.vehicleCategory.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException(`Parent category #${dto.parentId} not found`);
      if (parent.parentId !== null) {
        throw new BadRequestException('Sub-categories cannot have their own sub-categories (max 1 level)');
      }
    }

    return this.prisma.vehicleCategory.create({
      data:    { name: dto.name, parentId: dto.parentId ?? null },
      include: { children: true },
    });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.name) {
      const conflict = await this.prisma.vehicleCategory.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Category "${dto.name}" already exists`);
    }
    return this.prisma.vehicleCategory.update({
      where:   { id },
      data:    dto,
      include: { children: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const childCount = await this.prisma.vehicleCategory.count({ where: { parentId: id } });
    if (childCount > 0) {
      throw new BadRequestException('Delete all sub-categories first before deleting the parent');
    }
    return this.prisma.vehicleCategory.delete({ where: { id } });
  }
}
