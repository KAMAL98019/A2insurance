import { SetMetadata } from '@nestjs/common';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'export';

export interface ModulePermissionMeta {
  module: string;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'module_permission';

export const RequireModulePermission = (module: string, action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, { module, action } as ModulePermissionMeta);
