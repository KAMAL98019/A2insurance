import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetPermissionDto } from './dto/set-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  getForUser(adminUserId: number) {
    return this.prisma.adminUserPermission.findMany({ where: { adminUserId } });
  }

  setOne(adminUserId: number, dto: SetPermissionDto, assignedById: number) {
    const { moduleName, canView, canCreate, canUpdate, canDelete, canExport } = dto;
    return this.prisma.adminUserPermission.upsert({
      where: { adminUserId_moduleName: { adminUserId, moduleName } },
      create: { adminUserId, moduleName, canView, canCreate, canUpdate, canDelete, canExport, assignedById },
      update: { canView, canCreate, canUpdate, canDelete, canExport, assignedById },
    });
  }

  setMany(adminUserId: number, permissions: SetPermissionDto[], assignedById: number) {
    return Promise.all(permissions.map((p) => this.setOne(adminUserId, p, assignedById)));
  }

  async cloneFrom(sourceAdminUserId: number, targetAdminUserId: number, assignedById: number) {
    const source = await this.getForUser(sourceAdminUserId);
    return this.setMany(
      targetAdminUserId,
      source.map(({ moduleName, canView, canCreate, canUpdate, canDelete, canExport }) => ({
        moduleName, canView, canCreate, canUpdate, canDelete, canExport,
      })),
      assignedById,
    );
  }
}
