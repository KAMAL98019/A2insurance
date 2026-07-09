import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AccessControlService } from '../../common/access-control/access-control.service';
import { PermissionsService } from '../permissions/permissions.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly accessControl: AccessControlService,
    private readonly permissionsService: PermissionsService,
  ) {}

  async masterAdminExists() {
    return this.usersService.masterAdminExists();
  }

  async register(dto: RegisterDto) {
    const masterExists = await this.usersService.masterAdminExists();
    if (masterExists) {
      throw new ForbiddenException('Master admin already exists. Public registration is disabled.');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    // role is never taken from the request body — first registrant is always Master Admin.
    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      password: hashed,
      role: 'MASTER_ADMIN',
    });
    return { message: 'Master admin account created successfully', user };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || user.status !== 'ACTIVE') throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    await this.usersService.touchLastLogin(user.id);

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const accessibleLocationIds = await this.accessControl.getAccessibleLocationIds(user);
    const permissions = user.role === 'ADMIN_USER'
      ? await this.permissionsService.getForUser(user.id)
      : [];

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;
    return {
      access_token: accessToken,
      user: { ...userWithoutPassword, accessibleLocationIds, permissions },
    };
  }

  async forgotPassword(email: string) {
    // Always return the same message regardless of whether email exists
    await this.usersService.emailExists(email);
    return {
      message: 'Password reset request received. Please contact support or an administrator to reset your password.',
    };
  }
}
