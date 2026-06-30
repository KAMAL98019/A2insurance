import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '@prisma/client';

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

  async create(data: {
    name: string;
    email: string;
    phoneNumber: string;
    password: string;
  }): Promise<Omit<User, 'password'>> {
    if (await this.emailExists(data.email)) {
      throw new ConflictException('Email already registered');
    }
    const { password: _, ...user } = await this.prisma.user.create({ data });
    return user;
  }
}
