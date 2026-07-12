import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInsuranceCompanyDto } from './dto/create-insurance-company.dto';
import { UpdateInsuranceCompanyDto } from './dto/update-insurance-company.dto';

@Injectable()
export class InsuranceCompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(onlyActive = false) {
    return this.prisma.insuranceCompany.findMany({
      where: onlyActive ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: number) {
    const item = await this.prisma.insuranceCompany.findUnique({ where: { id } });
    if (!item) throw new NotFoundException(`Insurance company #${id} not found`);
    return item;
  }

  async create(dto: CreateInsuranceCompanyDto) {
    const exists = await this.prisma.insuranceCompany.findUnique({ where: { name: dto.name } });
    if (exists) throw new ConflictException(`Insurance company "${dto.name}" already exists`);
    return this.prisma.insuranceCompany.create({ data: { name: dto.name, isActive: dto.isActive ?? true } });
  }

  async update(id: number, dto: UpdateInsuranceCompanyDto) {
    await this.findOne(id);
    if (dto.name) {
      const conflict = await this.prisma.insuranceCompany.findFirst({ where: { name: dto.name, NOT: { id } } });
      if (conflict) throw new ConflictException(`Insurance company "${dto.name}" already exists`);
    }
    return this.prisma.insuranceCompany.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.insuranceCompany.delete({ where: { id } });
  }
}
