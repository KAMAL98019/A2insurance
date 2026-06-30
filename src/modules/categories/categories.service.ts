import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.vehicleCategory.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: number) {
    const cat = await this.prisma.vehicleCategory.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException(`Category #${id} not found`);
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const exists = await this.prisma.vehicleCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Category "${dto.name}" already exists`);
    return this.prisma.vehicleCategory.create({ data: { name: dto.name } });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);
    if (dto.name) {
      const conflict = await this.prisma.vehicleCategory.findFirst({
        where: { name: dto.name, NOT: { id } },
      });
      if (conflict) throw new ConflictException(`Category "${dto.name}" already exists`);
    }
    return this.prisma.vehicleCategory.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.vehicleCategory.delete({ where: { id } });
  }
}
