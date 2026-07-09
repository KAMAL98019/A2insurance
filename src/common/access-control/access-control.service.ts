import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PermissionAction } from '../decorators/require-permission.decorator';

export interface ActorUser {
  id: number;
  role: string;
}

const PERMISSION_FIELD: Record<PermissionAction, 'canView' | 'canCreate' | 'canUpdate' | 'canDelete' | 'canExport'> = {
  view: 'canView',
  create: 'canCreate',
  update: 'canUpdate',
  delete: 'canDelete',
  export: 'canExport',
};

/**
 * Master Admin and Super Admin both get unrestricted location DATA access
 * (Super Admin is an oversight role — can monitor/switch to any branch's
 * records). Location CATALOG management (create/edit/deactivate a branch)
 * stays Master Admin only — see LocationsController's @Roles.
 */
function hasUnrestrictedLocationAccess(role: string): boolean {
  return role === 'MASTER_ADMIN' || role === 'SUPER_ADMIN';
}

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /** null = unrestricted (Master Admin, Super Admin) */
  async getAccessibleLocationIds(actor: ActorUser): Promise<number[] | null> {
    if (hasUnrestrictedLocationAccess(actor.role)) return null;

    const rows = await this.prisma.userLocation.findMany({
      where: { userId: actor.id },
      select: { locationId: true },
    });
    return rows.map((r) => r.locationId);
  }

  async assertCanAccessLocation(actor: ActorUser, locationId: number | null) {
    if (hasUnrestrictedLocationAccess(actor.role)) return;
    if (locationId === null) {
      throw new ForbiddenException('This record has no location assigned — Master Admin access required');
    }
    const allowed = await this.getAccessibleLocationIds(actor);
    if (allowed && !allowed.includes(locationId)) {
      throw new ForbiddenException('You do not have access to this location');
    }
  }

  /** Builds a Prisma `where` fragment scoping a query by the actor's accessible locations. */
  async buildLocationScopeWhere(actor: ActorUser, requestedLocationId?: number): Promise<Record<string, unknown>> {
    if (hasUnrestrictedLocationAccess(actor.role)) {
      return requestedLocationId ? { locationId: requestedLocationId } : {};
    }

    const allowed = await this.getAccessibleLocationIds(actor);

    if (requestedLocationId) {
      if (!allowed?.includes(requestedLocationId)) {
        throw new ForbiddenException('You do not have access to this location');
      }
      return { locationId: requestedLocationId };
    }

    return { locationId: { in: allowed ?? [] } };
  }

  async assertCanManageUser(actor: ActorUser, targetUserId: number) {
    if (actor.role === 'MASTER_ADMIN') return;

    const target = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new ForbiddenException('User not found');

    if (actor.role === 'SUPER_ADMIN') {
      if (target.role !== 'ADMIN_USER' || target.superAdminId !== actor.id) {
        throw new ForbiddenException('You can only manage Admin Users you created');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions to manage users');
  }

  /**
   * Master Admin and Super Admin have unrestricted CRUD within their location scope.
   * Only Admin Users are gated by the per-module permission matrix.
   */
  async assertModulePermission(actor: ActorUser, moduleName: string, action: PermissionAction) {
    if (actor.role === 'MASTER_ADMIN' || actor.role === 'SUPER_ADMIN') return;

    const perm = await this.prisma.adminUserPermission.findUnique({
      where: { adminUserId_moduleName: { adminUserId: actor.id, moduleName } },
    });

    if (!perm || !perm[PERMISSION_FIELD[action]]) {
      throw new ForbiddenException(`No permission to ${action} ${moduleName}`);
    }
  }
}
