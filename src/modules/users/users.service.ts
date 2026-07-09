import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async emailExists(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }

  async masterAdminExists(): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { role: 'MASTER_ADMIN' } });
    return count > 0;
  }

  async create(data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: 'MASTER_ADMIN' | 'SUPER_ADMIN' | 'ADMIN_USER';
  }): Promise<Omit<User, 'password'>> {
    if (await this.emailExists(data.email)) {
      throw new ConflictException('Email already registered');
    }
    const { password: _, ...user } = await this.prisma.user.create({ data });
    return user;
  }

  async createSuperAdmin(dto: CreateSuperAdminDto, createdById: number) {
    if (await this.emailExists(dto.email)) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: hashed,
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        createdById,
      },
    });

    // Super Admin has unrestricted access to every location (see
    // hasUnrestrictedLocationAccess) — no per-location assignment needed.
    const { password: _, ...safe } = user;
    return safe;
  }

  async createAdminUser(dto: CreateAdminUserDto, superAdminId: number) {
    if (await this.emailExists(dto.email)) {
      throw new ConflictException('Email already registered');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phoneNumber: dto.phoneNumber,
        password: hashed,
        role: 'ADMIN_USER',
        status: 'ACTIVE',
        createdById: superAdminId,
        superAdminId,
        primaryLocationId: dto.locationId,
      },
    });

    await this.prisma.userLocation.create({
      data: { userId: user.id, locationId: dto.locationId, assignedById: superAdminId },
    });

    const { password: _, ...safe } = user;
    return safe;
  }

  listAll() {
    return this.prisma.user.findMany({
      select: {
        id: true, name: true, email: true, phoneNumber: true, role: true, status: true,
        superAdminId: true, primaryLocationId: true, createdAt: true, lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  listUnderSuperAdmin(superAdminId: number) {
    return this.prisma.user.findMany({
      where: { superAdminId },
      select: {
        id: true, name: true, email: true, phoneNumber: true, role: true, status: true,
        primaryLocationId: true, createdAt: true, lastLoginAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async setStatus(id: number, status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED') {
    const { password: _, ...safe } = await this.prisma.user.update({ where: { id }, data: { status } });
    return safe;
  }

  async touchLastLogin(id: number) {
    return this.prisma.user.update({ where: { id }, data: { lastLoginAt: new Date() } });
  }

  async resetPassword(id: number, newPassword: string) {
    const hashed = await bcrypt.hash(newPassword, 12);
    const { password: _, ...safe } = await this.prisma.user.update({ where: { id }, data: { password: hashed } });
    return safe;
  }
}
