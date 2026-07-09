import { Controller, Get, Put, Post, Param, Body, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessControlService } from '../../common/access-control/access-control.service';
import { PermissionsService } from './permissions.service';
import { SetPermissionDto } from './dto/set-permission.dto';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
export class PermissionsController {
  constructor(
    private readonly service: PermissionsService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get(':adminUserId')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: "Get an Admin User's module permission matrix" })
  async get(@Param('adminUserId', ParseIntPipe) adminUserId: number, @CurrentUser() user: Express.User) {
    await this.accessControl.assertCanManageUser(user, adminUserId);
    return this.service.getForUser(adminUserId);
  }

  @Put(':adminUserId')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: "Replace an Admin User's module permission matrix" })
  async setMany(
    @Param('adminUserId', ParseIntPipe) adminUserId: number,
    @Body(new ParseArrayPipe({ items: SetPermissionDto })) permissions: SetPermissionDto[],
    @CurrentUser() user: Express.User,
  ) {
    await this.accessControl.assertCanManageUser(user, adminUserId);
    return this.service.setMany(adminUserId, permissions, user.id);
  }

  @Post(':adminUserId/clone-from/:sourceAdminUserId')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: "Clone another Admin User's permission matrix onto this one" })
  async cloneFrom(
    @Param('adminUserId', ParseIntPipe) adminUserId: number,
    @Param('sourceAdminUserId', ParseIntPipe) sourceAdminUserId: number,
    @CurrentUser() user: Express.User,
  ) {
    await this.accessControl.assertCanManageUser(user, adminUserId);
    await this.accessControl.assertCanManageUser(user, sourceAdminUserId);
    return this.service.cloneFrom(sourceAdminUserId, adminUserId, user.id);
  }
}
