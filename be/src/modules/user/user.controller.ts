import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../../common/constants/roles.constant';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto, CreateUserDto, UpdateUserDto } from './user.dto';
import { UserService } from './user.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.OWNER)
  findAll() {
    return this.userService.findAll();
  }

  @Get('me')
  getProfile(@Request() req: { user: { id: number } }) {
    return this.userService.findById(req.user.id);
  }

  @Put('me')
  updateMe(
    @Request() req: { user: { id: number } },
    @Body() dto: UpdateUserDto,
  ) {
    delete dto.role;
    return this.userService.update(req.user.id, dto);
  }

  @Put('me/change-password')
  changeMyPassword(
    @Request() req: { user: { id: number } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(
      req.user.id,
      dto.oldPassword,
      dto.newPassword,
    );
  }

  @Post()
  @Roles(Role.OWNER)
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Put(':id')
  @Roles(Role.OWNER)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.userService.update(id, dto);
  }

  @Put(':id/change-password')
  @Roles(Role.OWNER)
  changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(id, dto.oldPassword, dto.newPassword);
  }

  @Delete(':id')
  @Roles(Role.OWNER)
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.userService.delete(id);
  }
}
