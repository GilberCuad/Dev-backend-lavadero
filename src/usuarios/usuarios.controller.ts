import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { RestablecerPasswordDto } from './dto/restablecer-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  UsuarioActual,
  type UsuarioJwt,
} from '../auth/decorators/usuario-actual.decorator';

// Por defecto TODO es solo ADMIN; las rutas /me lo sobrescriben a nivel de método
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  // Las rutas /me van ANTES de /:id para que "me" no se tome como un id
  @Get('me')
  @Roles('ADMIN', 'OPERARIO')
  me(@UsuarioActual() usuario: UsuarioJwt) {
    return this.usuariosService.findOne(usuario.userId);
  }

  @Patch('me/password')
  @Roles('ADMIN', 'OPERARIO')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  cambiarPassword(
    @UsuarioActual() usuario: UsuarioJwt,
    @Body() dto: CambiarPasswordDto,
  ) {
    return this.usuariosService.cambiarPassword(usuario.userId, dto);
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUsuarioDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usuariosService.update(id, dto, usuario.userId);
  }

  @Patch(':id/password')
  restablecerPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RestablecerPasswordDto,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usuariosService.restablecerPassword(id, dto, usuario.userId);
  }

  @Patch(':id/desactivar')
  desactivar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usuariosService.cambiarEstado(id, false, usuario.userId);
  }

  @Patch(':id/activar')
  activar(
    @Param('id', ParseUUIDPipe) id: string,
    @UsuarioActual() usuario: UsuarioJwt,
  ) {
    return this.usuariosService.cambiarEstado(id, true, usuario.userId);
  }
}
