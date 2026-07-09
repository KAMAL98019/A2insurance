import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY, ModulePermissionMeta } from '../decorators/require-permission.decorator';
import { AccessControlService } from '../access-control/access-control.service';

@Injectable()
export class ModulePermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private accessControl: AccessControlService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<ModulePermissionMeta>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!meta) return true;

    const { user } = context.switchToHttp().getRequest();
    await this.accessControl.assertModulePermission(user, meta.module, meta.action);
    return true;
  }
}
