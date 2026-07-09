import { Controller, Get, Post, Patch, Param, Body, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccessControlService } from '../../common/access-control/access-control.service';
import { UsersService } from './users.service';
import { CreateSuperAdminDto } from './dto/create-super-admin.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetStatusDto } from './dto/set-status.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly accessControl: AccessControlService,
  ) {}

  @Get()
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'List all users (Master Admin only)' })
  listAll() {
    return this.usersService.listAll();
  }

  @Get('my-admin-users')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List Admin Users created by the current Super Admin' })
  listMine(@CurrentUser() user: Express.User) {
    return this.usersService.listUnderSuperAdmin(user.id);
  }

  @Post('super-admin')
  @Roles('MASTER_ADMIN')
  @ApiOperation({ summary: 'Create a Super Admin (Master Admin only)' })
  createSuperAdmin(@Body() dto: CreateSuperAdminDto, @CurrentUser() user: Express.User) {
    return this.usersService.createSuperAdmin(dto, user.id);
  }

  @Post('admin-user')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create an Admin User (Master Admin can assign under any Super Admin; Super Admin creates under self)' })
  createAdminUser(@Body() dto: CreateAdminUserDto, @CurrentUser() user: Express.User) {
    const ownerId = user.role === 'MASTER_ADMIN' ? dto.superAdminId ?? user.id : user.id;
    return this.usersService.createAdminUser(dto, ownerId);
  }

  @Patch(':id/status')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Activate / deactivate / block a user' })
  async setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetStatusDto,
    @CurrentUser() user: Express.User,
  ) {
    if (id === user.id) {
      throw new BadRequestException('You cannot change your own account status — ask another admin.');
    }
    await this.accessControl.assertCanManageUser(user, id);
    return this.usersService.setStatus(id, dto.status);
  }

  @Patch(':id/reset-password')
  @Roles('MASTER_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: "Reset a managed user's password" })
  async resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: Express.User,
  ) {
    await this.accessControl.assertCanManageUser(user, id);
    return this.usersService.resetPassword(id, dto.newPassword);
  }
}
